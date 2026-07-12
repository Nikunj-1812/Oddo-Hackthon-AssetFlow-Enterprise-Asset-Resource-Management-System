/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { AuditStatus, AuditItemStatus, AssetStatus } from "@prisma/client";

import { createNotification } from "@/lib/notifications";

async function verifyAuditor() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  return session.user;
}

export async function createAuditCycle(formData: FormData) {
  try {
    const user = await verifyAuditor();
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const auditorsList = formData.getAll("auditorIds") as string[];

    if (!name || !location || !startDateStr || !endDateStr) {
      return { error: "Name, Location, Start Date, and End Date are required." };
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const cycle = await prisma.auditCycle.create({
      data: {
        name,
        location,
        startDate,
        endDate,
        status: "ACTIVE", // Start immediately in active state
        auditorIds: auditorsList.join(",")
      } as any
    });

    // Automatically clone all assets currently present at the location into the audit checklist
    const assetsAtLocation = await prisma.asset.findMany({
      where: { location }
    });

    if (assetsAtLocation.length > 0) {
      await prisma.auditItem.createMany({
        data: assetsAtLocation.map((asset) => ({
          auditCycleId: cycle.id,
          assetId: asset.id,
          verifiedStatus: "VERIFIED", // default status
          verifiedById: user.id!
        }))
      });
    }

    // Notify Asset Managers / Admins about the new audit
    const managers = await prisma.user.findMany({
      where: { role: { in: ["ASSET_MANAGER", "ADMIN"] }, status: "ACTIVE" }
    });
    for (const mgr of managers) {
      await createNotification(
        mgr.id,
        "Audit Cycle Created",
        `A new audit cycle "${name}" for location "${location}" has been created.`,
        "AUDIT",
        "INFO"
      );
    }

    await logActivity({
      userId: user.id!,
      action: `Created audit cycle ${name} for location ${location}`,
      targetType: "AuditCycle",
      targetId: cycle.id,
      newValue: cycle
    });

    return { success: true };
  } catch (error: any) {
    console.error("Create Audit Cycle Error:", error);
    return { error: error.message || "Failed to create audit cycle." };
  }
}

export async function verifyAuditItem(
  auditItemId: string,
  verifiedStatus: AuditItemStatus,
  notes?: string
) {
  try {
    const user = await verifyAuditor();

    const auditItem = await prisma.auditItem.findUnique({
      where: { id: auditItemId },
      include: { auditCycle: true }
    });

    if (!auditItem) return { error: "Audit item not found." };
    if (auditItem.auditCycle.status === "CLOSED") {
      return { error: "Verification locked. This audit cycle has already been closed." };
    }

    // Authorization: Only assigned auditors (or ADMIN/ASSET_MANAGER) can perform verification
    const cycleAuditorIds = (auditItem.auditCycle as any).auditorIds || "";
    const assignedAuditors = cycleAuditorIds.split(",").map((id: string) => id.trim()).filter(Boolean);
    const isManagerOrAdmin = ["ADMIN", "ASSET_MANAGER"].includes((user as any).role);
    if (!assignedAuditors.includes(user.id) && !isManagerOrAdmin) {
      return { error: "Access Denied: Only assigned auditors can verify checklist items for this cycle." };
    }

    const updated = await prisma.auditItem.update({
      where: { id: auditItemId },
      data: {
        verifiedStatus,
        notes,
        verifiedById: user.id!,
        verifiedAt: new Date()
      }
    });

    await logActivity({
      userId: user.id!,
      action: `Verified audit item as ${verifiedStatus}`,
      targetType: "AuditItem",
      targetId: auditItemId,
      newValue: updated
    });

    return { success: true };
  } catch (error: any) {
    console.error("Verify Audit Item Error:", error);
    return { error: error.message || "Failed to verify item." };
  }
}

export async function closeAuditCycle(cycleId: string) {
  try {
    const user = await verifyAuditor();

    const cycle = await prisma.auditCycle.findUnique({
      where: { id: cycleId },
      include: { items: { include: { asset: true } } }
    });

    if (!cycle) return { error: "Audit cycle not found." };
    if (cycle.status === "CLOSED") return { error: "Cycle already closed." };

    const missingCount = cycle.items.filter(i => i.verifiedStatus === "MISSING").length;
    const damagedCount = cycle.items.filter(i => i.verifiedStatus === "DAMAGED").length;
    const totalCount = cycle.items.length;

    await prisma.$transaction(async (tx) => {
      // Close the cycle
      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: "CLOSED" }
      });

      // Generate and store discrepancy report
      const summaryObj = {
        closedAt: new Date().toISOString(),
        closedBy: user.name,
        missing: cycle.items.filter(i => i.verifiedStatus === "MISSING").map(i => ({ id: i.assetId, tag: i.asset.tag, name: i.asset.name })),
        damaged: cycle.items.filter(i => i.verifiedStatus === "DAMAGED").map(i => ({ id: i.assetId, tag: i.asset.tag, name: i.asset.name })),
        verified: cycle.items.filter(i => i.verifiedStatus === "VERIFIED").map(i => ({ id: i.assetId, tag: i.asset.tag, name: i.asset.name })),
      };

      await (tx as any).discrepancyReport.create({
        data: {
          auditCycleId: cycleId,
          summary: JSON.stringify(summaryObj),
          missingCount,
          damagedCount,
          unexpectedCount: 0,
          totalCount
        }
      });

      // Process discrepancies
      for (const item of cycle.items) {
        if (item.verifiedStatus === "MISSING") {
          const oldAsset = await tx.asset.findUnique({ where: { id: item.assetId } });
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: "LOST" }
          });
          
          await tx.assetHistory.create({
            data: {
              assetId: item.assetId,
              userId: user.id!,
              userName: user.name,
              action: "STATUS_TRANSITION",
              description: `Audit cycle marked asset as missing. Status updated automatically to LOST.`,
              prevStatus: oldAsset?.status || "UNKNOWN",
              nextStatus: "LOST"
            }
          });
        } else if (item.verifiedStatus === "DAMAGED") {
          const oldAsset = await tx.asset.findUnique({ where: { id: item.assetId } });
          await tx.asset.update({
            where: { id: item.assetId },
            data: { condition: "DAMAGED" }
          });
          
          await tx.assetHistory.create({
            data: {
              assetId: item.assetId,
              userId: user.id!,
              userName: user.name,
              action: "CONDITION_CHANGE",
              description: `Audit cycle marked asset as damaged. Condition updated automatically to DAMAGED.`,
              prevStatus: oldAsset?.status || "UNKNOWN",
              nextStatus: oldAsset?.status || "UNKNOWN"
            }
          });
        }
      }
    });

    // Notify Asset Managers / Admins about audit closed
    const managers = await prisma.user.findMany({
      where: { role: { in: ["ASSET_MANAGER", "ADMIN"] }, status: "ACTIVE" }
    });
    for (const mgr of managers) {
      await createNotification(
        mgr.id,
        "Audit Cycle Closed & Discrepancies Resolved",
        `The audit cycle "${cycle.name}" has been closed. ${missingCount} assets marked LOST, ${damagedCount} assets marked DAMAGED.`,
        "AUDIT",
        "SUCCESS"
      );
    }

    await logActivity({
      userId: user.id!,
      action: `Closed audit cycle ${cycle.name} and logged discrepancies`,
      targetType: "AuditCycle",
      targetId: cycleId,
      oldValue: { status: cycle.status },
      newValue: { status: "CLOSED" }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Close Audit Cycle Error:", error);
    return { error: error.message || "Failed to close audit cycle." };
  }
}

export async function updateAuditCycleAuditors(cycleId: string, auditorIds: string[]) {
  try {
    const user = await verifyAuditor();
    const updated = await prisma.auditCycle.update({
      where: { id: cycleId },
      data: {
        auditorIds: auditorIds.join(",")
      } as any
    });

    await logActivity({
      userId: user.id!,
      action: `Updated assigned auditors for audit cycle "${updated.name}"`,
      targetType: "AuditCycle",
      targetId: cycleId,
      newValue: { auditorIds }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update Audit Cycle Auditors Error:", error);
    return { error: error.message || "Failed to update auditors." };
  }
}

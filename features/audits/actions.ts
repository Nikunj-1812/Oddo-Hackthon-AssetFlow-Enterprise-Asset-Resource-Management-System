"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { AuditStatus, AuditItemStatus, AssetStatus } from "@prisma/client";

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
      }
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
      include: { items: true }
    });

    if (!cycle) return { error: "Audit cycle not found." };
    if (cycle.status === "CLOSED") return { error: "Cycle already closed." };

    await prisma.$transaction(async (tx) => {
      // Close the cycle
      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: "CLOSED" }
      });

      // Process discrepancies: if item is MISSING, change asset state to LOST
      for (const item of cycle.items) {
        if (item.verifiedStatus === "MISSING") {
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: "LOST" }
          });
        } else if (item.verifiedStatus === "DAMAGED") {
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: "DISPOSED", condition: "DAMAGED" }
          });
        }
      }
    });

    await logActivity({
      userId: user.id!,
      action: `Closed audit cycle ${cycle.name} and locked verification checks`,
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

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { RequestStatus, AssetStatus } from "@prisma/client";

async function verifyUser() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  return session.user;
}

export async function createMaintenanceRequest(formData: FormData) {
  try {
    const user = await verifyUser();

    const assetId = formData.get("assetId") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;

    if (!assetId || !description || !priority) {
      return { error: "Asset, Description, and Priority are required." };
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        userId: user.id!,
        description,
        priority,
        status: "PENDING"
      },
      include: { asset: true }
    });

    await createNotification(
      user.id!,
      "Maintenance Requested",
      `You raised a maintenance request for asset ${request.asset.name} (${request.asset.tag}).`,
      "MAINTENANCE",
      "INFO"
    );

    // Notify Asset Managers
    const managers = await prisma.user.findMany({ where: { role: { in: ["ASSET_MANAGER", "ADMIN"] }, status: "ACTIVE" } });
    for (const mgr of managers) {
      await createNotification(
        mgr.id,
        "New Maintenance Ticket Raised",
        `A new maintenance ticket has been requested for ${request.asset.name} by ${user.name}.`,
        "MAINTENANCE",
        "INFO"
      );
    }

    await logActivity({
      userId: user.id!,
      action: `Raised maintenance request for asset ${assetId}`,
      targetType: "MaintenanceRequest",
      targetId: request.id,
      newValue: request
    });

    return { success: true };
  } catch (error: any) {
    console.error("Create Maintenance Error:", error);
    return { error: error.message || "Failed to submit request." };
  }
}

export async function updateMaintenanceStatus(
  requestId: string,
  nextStatus: RequestStatus,
  technicianName?: string
) {
  try {
    const operator = await verifyUser();

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: { asset: true }
    });

    if (!request) return { error: "Request not found." };

    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: nextStatus,
          assignedTo: technicianName || undefined,
          approvedById: nextStatus === "APPROVED" ? operator.id : undefined
        }
      });

      // Update Asset Status based on transition
      if (nextStatus === "APPROVED" || nextStatus === "TECHNICIAN_ASSIGNED" || nextStatus === "IN_PROGRESS") {
        await tx.asset.update({
          where: { id: request.assetId },
          data: { status: "UNDER_MAINTENANCE" }
        });
      } else if (nextStatus === "RESOLVED") {
        await tx.asset.update({
          where: { id: request.assetId },
          data: { status: "AVAILABLE" }
        });
      }

      // Log to maintenanceHistory timeline
      await (tx as any).maintenanceHistory.create({
        data: {
          requestId,
          userId: operator.id!,
          userName: operator.name,
          prevStatus: request.status,
          nextStatus: nextStatus,
          comments: technicianName ? `Technician assigned: ${technicianName}` : `Status updated to ${nextStatus}`
        }
      });

      return updatedRequest;
    });

    // Detailed notifications based on status change
    let priorityVal = "INFO";
    let titleMsg = "Maintenance Ticket Updated";
    let bodyMsg = `Your maintenance request status for ${request.asset.name} is now ${nextStatus}.`;

    if (nextStatus === "APPROVED") {
      titleMsg = "Maintenance Approved";
      priorityVal = "SUCCESS";
    } else if (nextStatus === "REJECTED") {
      titleMsg = "Maintenance Rejected";
      priorityVal = "CRITICAL";
    } else if (nextStatus === "RESOLVED") {
      titleMsg = "Maintenance Completed";
      priorityVal = "SUCCESS";
      bodyMsg = `The repair for asset ${request.asset.name} (${request.asset.tag}) has been marked as completed.`;
    } else if (nextStatus === "TECHNICIAN_ASSIGNED") {
      titleMsg = "Technician Assigned";
      bodyMsg = `Technician ${technicianName} has been assigned to repair your asset ${request.asset.name}.`;
    }

    await createNotification(
      request.userId,
      titleMsg,
      bodyMsg,
      "MAINTENANCE",
      priorityVal
    );

    await logActivity({
      userId: operator.id!,
      action: `Updated maintenance request status to ${nextStatus}`,
      targetType: "MaintenanceRequest",
      targetId: requestId,
      oldValue: { status: request.status },
      newValue: { status: nextStatus }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update Maintenance Status Error:", error);
    return { error: error.message || "Failed to update status." };
  }
}

export async function addMaintenancePhoto(requestId: string, url: string, description: string) {
  try {
    const user = await verifyUser();
    
    const photo = await (prisma as any).maintenancePhoto.create({
      data: {
        requestId,
        url,
        description
      }
    });

    await logActivity({
      userId: user.id!,
      action: `Uploaded maintenance photo for ticket ${requestId}`,
      targetType: "MaintenanceRequest",
      targetId: requestId,
      newValue: photo
    });

    return { success: true };
  } catch (error: any) {
    console.error("Add Maintenance Photo Error:", error);
    return { error: error.message || "Failed to attach photo." };
  }
}

export async function fetchMaintenanceDetails(requestId: string) {
  try {
    const [photos, history] = await Promise.all([
      (prisma as any).maintenancePhoto.findMany({
        where: { requestId },
        orderBy: { createdAt: "desc" }
      }),
      (prisma as any).maintenanceHistory.findMany({
        where: { requestId },
        orderBy: { createdAt: "asc" }
      })
    ]);
    return { photos, history };
  } catch (error: any) {
    console.error("Fetch Maintenance Details Error:", error);
    return { photos: [], history: [] };
  }
}

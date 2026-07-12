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
      }
    });

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
      where: { id: requestId }
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
      if (nextStatus === "APPROVED") {
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

      return updatedRequest;
    });

    await createNotification(
      request.userId,
      "Maintenance Request Update",
      `Ticket request status for your asset has been marked as ${nextStatus}.`,
      "MAINTENANCE"
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

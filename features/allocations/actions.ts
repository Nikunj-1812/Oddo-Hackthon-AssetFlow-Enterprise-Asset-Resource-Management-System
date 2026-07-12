"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { Condition, RequestStatus } from "@prisma/client";

async function verifyCanManageAllocations() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  return session.user;
}

export async function createAllocation(formData: FormData) {
  try {
    const operator = await verifyCanManageAllocations();
    
    const assetId = formData.get("assetId") as string;
    const userId = formData.get("userId") as string || null;
    const departmentId = formData.get("departmentId") as string || null;
    const expectedReturnDateStr = formData.get("expectedReturnDate") as string;

    if (!assetId) return { error: "Asset is required." };
    if (!userId && !departmentId) return { error: "Choose an employee or department to allocate." };

    const expectedReturnDate = expectedReturnDateStr ? new Date(expectedReturnDateStr) : null;

    // Check if asset is already allocated (conflict rule)
    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: assetId },
        include: {
          allocations: {
            where: { status: "APPROVED" },
            include: { user: true },
            take: 1
          }
        }
      });

      if (!asset) throw new Error("Asset not found.");

      if (asset.status === "ALLOCATED" || asset.allocations.length > 0) {
        const holder = asset.allocations[0]?.user?.name || "another user";
        throw new Error(`Conflict: Asset ${asset.tag} is currently held by ${holder}.`);
      }

      // Create allocation record
      const allocation = await tx.allocation.create({
        data: {
          assetId,
          userId,
          departmentId,
          expectedReturnDate,
          status: "APPROVED" // auto-approved in simple MVP workflow
        }
      });

      // Update asset status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: "ALLOCATED" }
      });

      return allocation;
    });

    if (userId) {
      await createNotification(
        userId,
        "Asset Workspace Assignment",
        `Asset Tag AF-${result.assetId.substring(0,4)} has been allocated to your workspace.`,
        "ALLOCATION"
      );
    }

    await logActivity({
      userId: operator.id!,
      action: `Allocated asset to user/department`,
      targetType: "Allocation",
      targetId: result.id,
      newValue: result
    });

    return { success: true };
  } catch (error: any) {
    console.error("Create Allocation Error:", error);
    return { error: error.message || "Failed to create allocation." };
  }
}

export async function returnAsset(formData: FormData) {
  try {
    const operator = await verifyCanManageAllocations();
    
    const allocationId = formData.get("allocationId") as string;
    const conditionOnReturn = formData.get("condition") as Condition || "GOOD";
    const notes = formData.get("notes") as string || "";

    if (!allocationId) return { error: "Allocation ID is required." };

    const result = await prisma.$transaction(async (tx) => {
      const allocation = await tx.allocation.findUnique({
        where: { id: allocationId }
      });

      if (!allocation) throw new Error("Allocation not found.");

      const updatedAllocation = await tx.allocation.update({
        where: { id: allocationId },
        data: {
          actualReturnDate: new Date(),
          status: "RESOLVED",
          conditionOnReturn,
          notes
        }
      });

      // Revert asset status back to AVAILABLE
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: {
          status: "AVAILABLE",
          condition: conditionOnReturn
        }
      });

      return updatedAllocation;
    });

    if (result.userId) {
      await createNotification(
        result.userId,
        "Asset Handback Acknowledged",
        `Return processing for allocated asset Tag AF-${result.assetId.substring(0,4)} has been successfully closed.`,
        "ALLOCATION"
      );
    }

    await logActivity({
      userId: operator.id!,
      action: `Returned asset and verified condition`,
      targetType: "Allocation",
      targetId: result.id,
      newValue: result
    });

    return { success: true };
  } catch (error: any) {
    console.error("Return Asset Error:", error);
    return { error: error.message || "Failed to return asset." };
  }
}

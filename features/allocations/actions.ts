/* eslint-disable @typescript-eslint/no-explicit-any */
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
    
    if (expectedReturnDate && isNaN(expectedReturnDate.getTime())) {
      return { error: "Invalid expected return date." };
    }

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
        },
        include: { asset: true }
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
        "Asset Assigned",
        `Asset ${result.asset.name} (${result.asset.tag}) has been allocated to your workspace. Expected return: ${expectedReturnDate ? new Date(expectedReturnDate).toLocaleDateString() : 'N/A'}.`,
        "ALLOCATION",
        "SUCCESS"
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
        },
        include: { asset: true }
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
        "Asset Returned",
        `Your return check-in for ${result.asset.name} (${result.asset.tag}) has been accepted and processed in ${conditionOnReturn} condition.`,
        "ALLOCATION",
        "SUCCESS"
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

export async function submitReturnRequest(allocationId: string, notes: string) {
  try {
    const user = await verifyCanManageAllocations();

    const allocation = await prisma.allocation.findUnique({
      where: { id: allocationId },
      include: { asset: true }
    });

    if (!allocation) return { error: "Allocation not found." };

    // Create the Return Request with all required fields
    const request = await prisma.returnRequest.create({
      data: {
        allocationId,
        assetId: allocation.assetId,
        userId: allocation.userId || user.id!,
        reason: notes || "Employee return request",
        status: "PENDING",
        notes
      }
    });

    // Notify managers
    const managers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "ASSET_MANAGER"] }, status: "ACTIVE" }
    });
    for (const mgr of managers) {
      await createNotification(
        mgr.id,
        "Return Request Filed",
        `Employee ${user.name} requested to return asset ${allocation.asset.name} (${allocation.asset.tag}).`,
        "ALLOCATION",
        "INFO"
      );
    }

    await logActivity({
      userId: user.id!,
      action: `Submitted return request for asset ${allocation.asset.tag}`,
      targetType: "Allocation",
      targetId: allocationId,
      newValue: request
    });

    return { success: true };
  } catch (error: any) {
    console.error("Submit Return Request Error:", error);
    return { error: error.message || "Failed to submit return request." };
  }
}

export async function approveReturnRequest(requestId: string, conditionOnReturn: string, notes: string) {
  try {
    const operator = await verifyCanManageAllocations();

    const request = await prisma.returnRequest.findUnique({
      where: { id: requestId },
      include: { allocation: { include: { asset: true } } }
    });

    if (!request) return { error: "Return request not found." };

    const allocation = request.allocation;

    await prisma.$transaction(async (tx) => {
      // Approve the request
      await tx.returnRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          conditionOnReturn: conditionOnReturn as any,
          notes
        }
      });

      // Update allocation record
      await tx.allocation.update({
        where: { id: request.allocationId },
        data: {
          actualReturnDate: new Date(),
          status: "RESOLVED",
          conditionOnReturn: conditionOnReturn as any,
          notes: notes
        }
      });

      // Revert asset status: if condition needs repair or is damaged, move status to UNDER_MAINTENANCE! Otherwise AVAILABLE.
      const shouldMaint = ["NEEDS_REPAIR", "DAMAGED"].includes(conditionOnReturn);
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: {
          status: shouldMaint ? "UNDER_MAINTENANCE" : "AVAILABLE",
          condition: conditionOnReturn as any
        }
      });

      // Log asset history transition
      await tx.assetHistory.create({
        data: {
          assetId: allocation.assetId,
          userId: operator.id!,
          userName: operator.name,
          action: "RETURN_PROCESS",
          description: `Employee return request approved. Asset condition: ${conditionOnReturn}.`,
          prevStatus: "ALLOCATED",
          nextStatus: shouldMaint ? "UNDER_MAINTENANCE" : "AVAILABLE"
        }
      });
    });

    // Notify employee
    if (allocation.userId) {
      await createNotification(
        allocation.userId,
        "Return Request Approved",
        `Your return request for asset ${allocation.asset.name} has been processed and approved. Check-in condition: ${conditionOnReturn}.`,
        "ALLOCATION",
        "SUCCESS"
      );
    }

    await logActivity({
      userId: operator.id!,
      action: `Approved return request for asset ${allocation.asset.tag}`,
      targetType: "Allocation",
      targetId: allocation.id,
      newValue: { status: "APPROVED" }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Approve Return Request Error:", error);
    return { error: error.message || "Failed to approve return request." };
  }
}

export async function rejectReturnRequest(requestId: string, comments: string) {
  try {
    const operator = await verifyCanManageAllocations();

    const request = await prisma.returnRequest.findUnique({
      where: { id: requestId },
      include: { allocation: { include: { asset: true } } }
    });

    if (!request) return { error: "Return request not found." };

    const allocation = request.allocation;

    await prisma.returnRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        notes: comments
      }
    });

    // Notify employee
    if (allocation.userId) {
      await createNotification(
        allocation.userId,
        "Return Request Rejected",
        `Your return request for asset ${allocation.asset.name} was rejected. Feedback: ${comments}`,
        "ALLOCATION",
        "WARNING"
      );
    }

    await logActivity({
      userId: operator.id!,
      action: `Rejected return request for asset ${allocation.asset.tag}`,
      targetType: "Allocation",
      targetId: allocation.id,
      newValue: { status: "REJECTED", comments }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Reject Return Request Error:", error);
    return { error: error.message || "Failed to reject return request." };
  }
}

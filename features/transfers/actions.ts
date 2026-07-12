"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

/**
 * Ensures user is authenticated.
 */
async function verifyUser() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  return session.user as any;
}

/**
 * Creates an activity log entry.
 */
async function logActivity(userId: string, action: string, targetType: string, targetId: string) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
      }
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

// Removed local emitNotification helper in favor of global createNotification

/**
 * Creates a new Transfer Request.
 */
export async function createTransferRequest(formData: FormData) {
  try {
    const user = await verifyUser();
    
    const assetId = formData.get("assetId") as string;
    const requestedHolderId = formData.get("requestedHolderId") as string | null;
    const requestedDepartmentId = formData.get("requestedDepartmentId") as string | null;
    const reason = formData.get("reason") as string;
    const priority = formData.get("priority") as string || "LOW";
    const expectedTransferDateStr = formData.get("expectedTransferDate") as string;
    const additionalNotes = formData.get("additionalNotes") as string | null;

    if (!assetId || !reason || !expectedTransferDateStr) {
      return { error: "Missing required fields." };
    }

    if (!requestedHolderId && !requestedDepartmentId) {
      return { error: "Must specify a new Employee or Department." };
    }

    const expectedDate = new Date(expectedTransferDateStr);
    if (isNaN(expectedDate.getTime()) || expectedDate < new Date(new Date().setHours(0,0,0,0))) {
      return { error: "Transfer date must be valid and in the future." };
    }

    // Validate Asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { allocations: { where: { actualReturnDate: null } } }
    });

    if (!asset) return { error: "Asset not found." };
    if (asset.status !== "ALLOCATED") return { error: "Asset must be actively allocated to transfer it." };
    
    const activeAllocation = asset.allocations[0];
    if (!activeAllocation) return { error: "No active allocation found for this asset." };

    if (activeAllocation.userId === requestedHolderId) {
      return { error: "Cannot transfer asset to the same employee." };
    }

    // Check for existing pending transfers for this asset
    const pendingTransfers = await prisma.transferRequest.findFirst({
      where: {
        assetId,
        status: { in: ["PENDING", "DEPARTMENT_APPROVED"] }
      }
    });

    if (pendingTransfers) {
      return { error: "A transfer request is already pending for this asset." };
    }

    const request = await prisma.transferRequest.create({
      data: {
        assetId,
        currentHolderId: activeAllocation.userId,
        requestedHolderId: requestedHolderId || null,
        requestedDepartmentId: requestedDepartmentId || null,
        reason,
        priority,
        expectedTransferDate: expectedDate,
        additionalNotes,
        status: "PENDING",
        requestedById: user.id
      }
    });

    await logActivity(user.id, `Created transfer request for asset ${asset.tag}`, "TRANSFER", request.id);

    // Notify Department Head (if applicable)
    // Find department heads
    const deptHeads = await prisma.user.findMany({ where: { role: "DEPARTMENT_HEAD", status: "ACTIVE" } });
    for (const head of deptHeads) {
      await createNotification(head.id, "New Transfer Request", `A new transfer request is pending approval for ${asset.name}.`, "SYSTEM", "APPROVAL");
    }

    revalidatePath("/dashboard/transfers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Create Transfer Error:", err);
    return { error: err.message || "Failed to create transfer request." };
  }
}

/**
 * Approve by Department Head
 */
export async function approveByDepartment(requestId: string, comment: string) {
  try {
    const user = await verifyUser();
    if (user.role !== "DEPARTMENT_HEAD" && user.role !== "ADMIN") {
      return { error: "Permission denied." };
    }

    const request = await prisma.transferRequest.findUnique({ where: { id: requestId }, include: { asset: true } });
    if (!request || request.status !== "PENDING") {
      return { error: "Invalid request state." };
    }

    await prisma.transferRequest.update({
      where: { id: requestId },
      data: {
        status: "DEPARTMENT_APPROVED",
        departmentHeadComment: comment,
      }
    });

    await logActivity(user.id, `Department approved transfer for ${request.asset.tag}`, "TRANSFER", requestId);

    // Notify Asset Managers for final review
    const assetManagers = await prisma.user.findMany({ where: { role: { in: ["ASSET_MANAGER", "ADMIN"] }, status: "ACTIVE" } });
    for (const mgr of assetManagers) {
      await createNotification(mgr.id, "Transfer Pending Final Approval", `Department approved transfer for ${request.asset.name}.`, "SYSTEM", "APPROVAL");
    }

    revalidatePath("/dashboard/transfers");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Approval failed." };
  }
}

/**
 * Reject by Department Head
 */
export async function rejectByDepartment(requestId: string, comment: string) {
  try {
    const user = await verifyUser();
    if (user.role !== "DEPARTMENT_HEAD" && user.role !== "ADMIN") {
      return { error: "Permission denied." };
    }

    const request = await prisma.transferRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        departmentHeadComment: comment,
      },
      include: { asset: true }
    });

    await logActivity(user.id, `Department rejected transfer for ${request.asset.tag}`, "TRANSFER", requestId);
    await createNotification(request.requestedById, "Transfer Rejected", `Your transfer request for ${request.asset.name} was rejected by Department Head.`, "SYSTEM", "CRITICAL");

    revalidatePath("/dashboard/transfers");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Rejection failed." };
  }
}

/**
 * Finalize Transfer by Asset Manager
 */
export async function approveByManager(requestId: string, comment: string) {
  try {
    const user = await verifyUser();
    if (user.role !== "ASSET_MANAGER" && user.role !== "ADMIN") {
      return { error: "Permission denied." };
    }

    const request = await prisma.transferRequest.findUnique({
      where: { id: requestId },
      include: { asset: { include: { allocations: { where: { actualReturnDate: null } } } } }
    });

    if (!request || request.status !== "DEPARTMENT_APPROVED") {
      return { error: "Invalid request state. Must be Department Approved first." };
    }

    const activeAllocation = request.asset.allocations[0];
    if (!activeAllocation) {
      return { error: "Asset is no longer allocated to anyone." };
    }

    // Execute the Transfer Transaction
    await prisma.$transaction(async (tx: any) => {
      // 1. Close old allocation
      await tx.allocation.update({
        where: { id: activeAllocation.id },
        data: {
          actualReturnDate: new Date(),
          status: "RESOLVED",
          notes: `Automatically closed by Transfer Request ${request.id}`
        }
      });

      // 2. Create new allocation
      await tx.allocation.create({
        data: {
          assetId: request.assetId,
          userId: request.requestedHolderId || null,
          departmentId: request.requestedDepartmentId || null,
          status: "APPROVED",
          notes: `Automatically created by Transfer Request ${request.id}`
        }
      });

      // 3. Update Request Status
      await tx.transferRequest.update({
        where: { id: requestId },
        data: {
          status: "COMPLETED",
          managerComment: comment,
        }
      });
    });

    await logActivity(user.id, `Manager finalized transfer for ${request.asset.tag}`, "TRANSFER", requestId);
    
    // Notifications
    await createNotification(request.requestedById, "Transfer Completed", `Your transfer request for ${request.asset.name} has been completed!`, "SYSTEM", "SUCCESS");
    if (request.requestedHolderId) {
       await createNotification(request.requestedHolderId, "New Asset Allocated", `You have received a new asset: ${request.asset.name}.`, "ALLOCATION", "SUCCESS");
    }

    revalidatePath("/dashboard/transfers");
    revalidatePath("/dashboard/allocations");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Transfer finalization failed." };
  }
}

/**
 * Reject by Manager
 */
export async function rejectByManager(requestId: string, comment: string) {
  try {
    const user = await verifyUser();
    if (user.role !== "ASSET_MANAGER" && user.role !== "ADMIN") {
      return { error: "Permission denied." };
    }

    const request = await prisma.transferRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        managerComment: comment,
      },
      include: { asset: true }
    });

    await logActivity(user.id, `Manager rejected transfer for ${request.asset.tag}`, "TRANSFER", requestId);
    await createNotification(request.requestedById, "Transfer Rejected", `Your transfer request for ${request.asset.name} was rejected by Asset Manager.`, "SYSTEM", "CRITICAL");

    revalidatePath("/dashboard/transfers");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Rejection failed." };
  }
}

/**
 * Cancel Request
 */
export async function cancelTransferRequest(requestId: string) {
  try {
    const user = await verifyUser();

    const request = await prisma.transferRequest.findUnique({ where: { id: requestId } });
    if (!request || (request.requestedById !== user.id && user.role !== "ADMIN")) {
      return { error: "Permission denied." };
    }

    if (request.status !== "PENDING") {
      return { error: "Can only cancel pending requests." };
    }

    await prisma.transferRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" }
    });

    await logActivity(user.id, `Cancelled transfer request`, "TRANSFER", requestId);
    
    revalidatePath("/dashboard/transfers");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Cancel failed." };
  }
}

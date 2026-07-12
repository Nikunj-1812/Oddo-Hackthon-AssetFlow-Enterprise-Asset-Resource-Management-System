"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { Role, UserStatus } from "@prisma/client";
import { createNotification } from "@/lib/notifications";

async function verifyAdmin() {
  const session = await auth();
  if (!session || !session.user || !session.user.id || (session.user as any).role !== "ADMIN") {
    throw new Error("Access denied. Admin permissions required.");
  }
  return session.user;
}

export async function createDepartment(formData: FormData) {
  try {
    const adminUser = await verifyAdmin();
    const name = formData.get("name") as string;
    const parentId = formData.get("parentId") as string || null;

    if (!name) return { error: "Department name is required." };

    const dept = await prisma.department.create({
      data: {
        name,
        parentId,
        status: "ACTIVE"
      }
    });

    await logActivity({
      userId: adminUser.id!,
      action: `Created department ${name}`,
      targetType: "Department",
      targetId: dept.id,
      newValue: dept
    });

    return { success: true };
  } catch (error: any) {
    console.error("Create Department Error:", error);
    return { error: error.message || "Failed to create department." };
  }
}

export async function createCategory(formData: FormData) {
  try {
    const adminUser = await verifyAdmin();
    const name = formData.get("name") as string;
    const warrantyMonths = Number(formData.get("warrantyMonths")) || 0;
    const customFieldsRaw = formData.get("customFields") as string || "";

    if (!name) return { error: "Category name is required." };

    const fields = customFieldsRaw.split(",").map(f => f.trim()).filter(f => f.length > 0);
    const schema = { fields, warrantyMonths };

    const cat = await prisma.category.create({
      data: {
        name,
        customFieldsSchema: schema
      }
    });

    await logActivity({
      userId: adminUser.id!,
      action: `Created category ${name}`,
      targetType: "Category",
      targetId: cat.id,
      newValue: cat
    });

    return { success: true };
  } catch (error: any) {
    console.error("Create Category Error:", error);
    return { error: error.message || "Failed to create category." };
  }
}

export async function promoteUser(formData: FormData) {
  try {
    const adminUser = await verifyAdmin();
    const userId = formData.get("userId") as string;
    const role = formData.get("role") as Role;
    const departmentId = formData.get("departmentId") as string || null;

    if (!userId || !role) return { error: "User ID and Role are required." };

    const oldUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!oldUser) return { error: "User not found." };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        departmentId
      }
    });

    if (role === "DEPARTMENT_HEAD" && departmentId) {
      await prisma.department.update({
        where: { id: departmentId },
        data: { managerId: userId }
      });
    }

    await createNotification(
      userId,
      "Role & Department Updated",
      `Your organization role has been updated to ${role} ${departmentId ? "and assigned to department" : ""}.`,
      "SYSTEM",
      "SUCCESS"
    );

    await logActivity({
      userId: adminUser.id!,
      action: `Promoted ${oldUser.name} to ${role}`,
      targetType: "User",
      targetId: userId,
      oldValue: { role: oldUser.role, departmentId: oldUser.departmentId },
      newValue: { role: updatedUser.role, departmentId: updatedUser.departmentId }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Promote User Error:", error);
    return { error: error.message || "Failed to update employee role." };
  }
}

export async function toggleUserStatus(userId: string, currentStatus: UserStatus) {
  try {
    const adminUser = await verifyAdmin();
    const nextStatus: UserStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: nextStatus }
    });

    await logActivity({
      userId: adminUser.id!,
      action: `${nextStatus === "ACTIVE" ? "Activated" : "Deactivated"} user ${user.name}`,
      targetType: "User",
      targetId: userId,
      oldValue: { status: currentStatus },
      newValue: { status: nextStatus }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Toggle User Status Error:", error);
    return { error: error.message || "Failed to toggle status." };
  }
}

export async function updateDepartment(deptId: string, formData: FormData) {
  try {
    const adminUser = await verifyAdmin();
    const name = formData.get("name") as string;
    const parentId = formData.get("parentId") as string || null;
    const managerId = formData.get("managerId") as string || null;
    const status = formData.get("status") as UserStatus;

    if (!deptId || !name) return { error: "Department ID and Name are required." };

    const oldDept = await prisma.department.findUnique({
      where: { id: deptId }
    });
    if (!oldDept) return { error: "Department not found." };

    const updated = await prisma.department.update({
      where: { id: deptId },
      data: {
        name,
        parentId,
        managerId,
        status
      }
    });

    if (managerId && managerId !== oldDept.managerId) {
      await prisma.user.update({
        where: { id: managerId },
        data: {
          role: "DEPARTMENT_HEAD",
          departmentId: deptId
        }
      });
      await createNotification(
        managerId,
        "Assigned as Department Head",
        `You have been assigned as the Department Head of "${name}".`,
        "SYSTEM",
        "SUCCESS"
      );
    }

    await logActivity({
      userId: adminUser.id!,
      action: `Updated department ${name}`,
      targetType: "Department",
      targetId: deptId,
      oldValue: oldDept,
      newValue: updated
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update Department Error:", error);
    return { error: error.message || "Failed to update department." };
  }
}

export async function deleteDepartment(deptId: string) {
  try {
    const adminUser = await verifyAdmin();

    const employeeCount = await prisma.user.count({
      where: { departmentId: deptId }
    });
    if (employeeCount > 0) {
      throw new Error("Cannot delete department: personnel exist.");
    }

    const assetCount = await prisma.allocation.count({
      where: { departmentId: deptId, status: "APPROVED" }
    });
    if (assetCount > 0) {
      throw new Error("Cannot delete department: active allocations exist.");
    }

    const dept = await prisma.department.findUnique({
      where: { id: deptId }
    });
    if (!dept) return { error: "Department not found." };

    await prisma.department.delete({
      where: { id: deptId }
    });

    await logActivity({
      userId: adminUser.id!,
      action: `Deleted department ${dept.name}`,
      targetType: "Department",
      targetId: deptId,
      oldValue: dept,
      newValue: null
    });

    return { success: true };
  } catch (error: any) {
    console.error("Delete Department Error:", error);
    return { error: error.message || "Failed to delete department." };
  }
}

export async function updateCategory(catId: string, formData: FormData) {
  try {
    const adminUser = await verifyAdmin();
    const name = formData.get("name") as string;
    const warrantyMonths = Number(formData.get("warrantyMonths")) || 0;
    const customFieldsRaw = formData.get("customFields") as string || "";
    const status = formData.get("status") as UserStatus;

    if (!catId || !name) return { error: "Category ID and Name are required." };

    const oldCat = await prisma.category.findUnique({
      where: { id: catId }
    });
    if (!oldCat) return { error: "Category not found." };

    const fields = customFieldsRaw.split(",").map(f => f.trim()).filter(f => f.length > 0);
    const schema = { fields, warrantyMonths };

    const updated = await prisma.category.update({
      where: { id: catId },
      data: {
        name,
        customFieldsSchema: schema,
        status
      }
    });

    await logActivity({
      userId: adminUser.id!,
      action: `Updated category ${name}`,
      targetType: "Category",
      targetId: catId,
      oldValue: oldCat,
      newValue: updated
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update Category Error:", error);
    return { error: error.message || "Failed to update category." };
  }
}

export async function deleteCategory(catId: string) {
  try {
    const adminUser = await verifyAdmin();

    // Check validation constraints: assets using it
    const assetCount = await prisma.asset.count({
      where: { categoryId: catId }
    });
    if (assetCount > 0) {
      throw new Error("Cannot delete category: assets of this classification exist in registry.");
    }

    const cat = await prisma.category.findUnique({
      where: { id: catId }
    });
    if (!cat) return { error: "Category not found." };

    await prisma.category.delete({
      where: { id: catId }
    });

    await logActivity({
      userId: adminUser.id!,
      action: `Deleted category ${cat.name}`,
      targetType: "Category",
      targetId: catId,
      oldValue: cat,
      newValue: null
    });

    return { success: true };
  } catch (error: any) {
    console.error("Delete Category Error:", error);
    return { error: error.message || "Failed to delete category." };
  }
}

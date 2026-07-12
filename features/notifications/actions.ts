/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyUser() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  return session.user as any;
}

export async function getNotificationsAction(filters?: {
  category?: string;
  priority?: string;
  read?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const user = await verifyUser();
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { 
      userId: user.id,
      archived: false
    };

    if (filters?.category && filters.category !== "ALL") {
      where.category = filters.category;
    }
    if (filters?.priority && filters.priority !== "ALL") {
      where.priority = filters.priority;
    }
    if (filters?.read !== undefined) {
      where.read = filters.read;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { message: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    let items, total;
    try {
      [items, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where })
      ]);
    } catch (err: any) {
      if (err.message?.includes("archived") || err.message?.includes("Unknown argument")) {
        delete where.archived;
        [items, total] = await Promise.all([
          prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.notification.count({ where })
        ]);
      } else {
        throw err;
      }
    }

    return { items, total, page, limit };
  } catch (error: any) {
    console.error("Get Notifications Error:", error);
    return { items: [], total: 0, page: 1, limit: 50 };
  }
}

export async function markAsReadAction(id: string) {
  try {
    const user = await verifyUser();
    await prisma.notification.update({
      where: { id, userId: user.id },
      data: { read: true },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Mark Read Error:", error);
    return { error: error.message };
  }
}

export async function markAllAsReadAction() {
  try {
    const user = await verifyUser();
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Mark All Read Error:", error);
    return { error: error.message };
  }
}

export async function archiveNotificationAction(id: string) {
  try {
    const user = await verifyUser();
    await prisma.notification.update({
      where: { id, userId: user.id },
      data: { archived: true },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Archive Notification Error:", error);
    return { error: error.message };
  }
}

export async function archiveAllNotificationsAction() {
  try {
    const user = await verifyUser();
    await prisma.notification.updateMany({
      where: { userId: user.id, archived: false },
      data: { archived: true },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Archive All Error:", error);
    return { error: error.message };
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const user = await verifyUser();
    await prisma.notification.delete({
      where: { id, userId: user.id },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Notification Error:", error);
    return { error: error.message };
  }
}

export async function getUserNotificationSettingsAction() {
  try {
    const user = await verifyUser();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        enableReminders: true,
        emailNotifications: true,
        browserNotifications: true,
        reminderTimingHours: true,
      }
    });
    return dbUser || {
      enableReminders: true,
      emailNotifications: true,
      browserNotifications: true,
      reminderTimingHours: 24,
    };
  } catch (error: any) {
    console.error("Get User Settings Error:", error);
    return {
      enableReminders: true,
      emailNotifications: true,
      browserNotifications: true,
      reminderTimingHours: 24,
    };
  }
}

export async function updateNotificationSettingsAction(settings: {
  enableReminders: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
  reminderTimingHours: number;
}) {
  try {
    const user = await verifyUser();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        enableReminders: settings.enableReminders,
        emailNotifications: settings.emailNotifications,
        browserNotifications: settings.browserNotifications,
        reminderTimingHours: settings.reminderTimingHours,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Update User Settings Error:", error);
    return { error: error.message };
  }
}

export async function getDashboardAlertStats() {
  try {
    const user = await verifyUser();
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    // 1. Critical Alerts Count
    const criticalAlertsCount = await prisma.notification.count({
      where: { userId: user.id, priority: "CRITICAL", read: false }
    });

    // Scoped metrics
    let overdueReturnsCount = 0;
    let upcomingReturnsCount = 0;
    let upcomingBookingsCount = 0;
    let pendingMaintenanceCount = 0;
    let upcomingAuditsCount = 0;

    if (user.role === "EMPLOYEE") {
      // Overdue Returns
      overdueReturnsCount = await prisma.allocation.count({
        where: {
          userId: user.id,
          actualReturnDate: null,
          expectedReturnDate: { lt: now }
        }
      });
      // Upcoming Returns (next 24h)
      upcomingReturnsCount = await prisma.allocation.count({
        where: {
          userId: user.id,
          actualReturnDate: null,
          expectedReturnDate: { gte: now, lte: tomorrow }
        }
      });
      // Upcoming Bookings (next 24h)
      upcomingBookingsCount = await prisma.booking.count({
        where: {
          userId: user.id,
          status: "UPCOMING",
          startTime: { gte: now, lte: tomorrow }
        }
      });
      // Pending Maintenance
      pendingMaintenanceCount = await prisma.maintenanceRequest.count({
        where: {
          userId: user.id,
          status: "PENDING"
        }
      });
    } else if (user.role === "DEPARTMENT_HEAD" && user.departmentId) {
      // Dept Head
      const dept = await prisma.department.findUnique({
        where: { id: user.departmentId },
        include: { employees: { select: { id: true } } }
      });
      const employeeIds = dept?.employees.map(e => e.id) || [];

      overdueReturnsCount = await prisma.allocation.count({
        where: {
          actualReturnDate: null,
          expectedReturnDate: { lt: now },
          OR: [
            { departmentId: user.departmentId },
            { userId: { in: employeeIds } }
          ]
        }
      });
      upcomingReturnsCount = await prisma.allocation.count({
        where: {
          actualReturnDate: null,
          expectedReturnDate: { gte: now, lte: tomorrow },
          OR: [
            { departmentId: user.departmentId },
            { userId: { in: employeeIds } }
          ]
        }
      });
      upcomingBookingsCount = await prisma.booking.count({
        where: {
          status: "UPCOMING",
          startTime: { gte: now, lte: tomorrow },
          userId: { in: employeeIds }
        }
      });
      pendingMaintenanceCount = await prisma.maintenanceRequest.count({
        where: {
          status: "PENDING",
          asset: {
            allocations: {
              some: {
                actualReturnDate: null,
                OR: [
                  { departmentId: user.departmentId },
                  { userId: { in: employeeIds } }
                ]
              }
            }
          }
        }
      });
    } else {
      // ADMIN & ASSET_MANAGER (full system access)
      overdueReturnsCount = await prisma.allocation.count({
        where: {
          actualReturnDate: null,
          expectedReturnDate: { lt: now }
        }
      });
      upcomingReturnsCount = await prisma.allocation.count({
        where: {
          actualReturnDate: null,
          expectedReturnDate: { gte: now, lte: tomorrow }
        }
      });
      upcomingBookingsCount = await prisma.booking.count({
        where: {
          status: "UPCOMING",
          startTime: { gte: now, lte: tomorrow }
        }
      });
      pendingMaintenanceCount = await prisma.maintenanceRequest.count({
        where: {
          status: "PENDING"
        }
      });
      upcomingAuditsCount = await prisma.auditCycle.count({
        where: {
          status: "ACTIVE",
          endDate: { gte: now, lte: tomorrow }
        }
      });
    }

    return {
      overdueReturnsCount,
      upcomingReturnsCount,
      upcomingBookingsCount,
      pendingMaintenanceCount,
      upcomingAuditsCount,
      criticalAlertsCount
    };
  } catch (error) {
    console.error("Get Dashboard Alert Stats Error:", error);
    return {
      overdueReturnsCount: 0,
      upcomingReturnsCount: 0,
      upcomingBookingsCount: 0,
      pendingMaintenanceCount: 0,
      upcomingAuditsCount: 0,
      criticalAlertsCount: 0
    };
  }
}


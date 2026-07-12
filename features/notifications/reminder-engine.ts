import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * Creates an activity log entry for automatic reminder.
 */
async function logReminderActivity(userId: string, notifType: string, module: string) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action: `Auto-generated ${notifType} reminder for ${module}`,
        targetType: "Notification",
        targetId: "SYSTEM",
        newValue: { generatedAutomatically: true, module, notifType }
      }
    });
  } catch (err) {
    console.error("Failed to log reminder activity:", err);
  }
}

/**
 * Core Reminder Engine.
 * Periodically scans the database for upcoming return dates, bookings, maintenance tickets, and audit cycles.
 */
export async function runReminderEngine() {
  const now = new Date();

  // Helper to check if a reminder was already sent
  const hasReminderBeenSent = async (targetId: string, type: string, userId: string) => {
    const history = await prisma.reminderHistory.findFirst({
      where: { targetId, type, userId }
    });
    return !!history;
  };

  // Helper to mark a reminder as sent
  const markReminderAsSent = async (targetId: string, type: string, userId: string) => {
    await prisma.reminderHistory.create({
      data: { targetId, type, userId }
    });
  };

  const results: string[] = [];

  // ==========================================
  // 1. ASSET RETURN REMINDERS (24h, 12h, 2h)
  // ==========================================
  const activeAllocations = await prisma.allocation.findMany({
    where: {
      actualReturnDate: null,
      expectedReturnDate: { not: null },
      userId: { not: null }
    },
    include: { asset: true, user: true }
  });

  for (const alloc of activeAllocations) {
    const userId = alloc.userId!;
    const expectedDate = new Date(alloc.expectedReturnDate!);
    const diffMs = expectedDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Overdue check
    if (diffHours < 0) {
      const alreadySent = await hasReminderBeenSent(alloc.id, "return_overdue", userId);
      if (!alreadySent) {
        await createNotification(
          userId,
          "Asset Return Overdue Warning",
          `Your allocation for asset ${alloc.asset.name} (${alloc.asset.tag}) was due on ${expectedDate.toLocaleDateString()}. Please return it immediately.`,
          "ALLOCATION",
          "CRITICAL"
        );
        await markReminderAsSent(alloc.id, "return_overdue", userId);
        await logReminderActivity(userId, "return_overdue", "ALLOCATION");
        results.push(`Return Overdue notification sent to User ${userId} for allocation ${alloc.id}`);
      }
      continue;
    }

    // 2 Hours Before
    if (diffHours <= 2 && diffHours > 0) {
      const alreadySent = await hasReminderBeenSent(alloc.id, "return_2h", userId);
      if (!alreadySent) {
        await createNotification(
          userId,
          "Asset Return Reminder (2 Hours)",
          `Your allocation for asset ${alloc.asset.name} is due in less than 2 hours.`,
          "ALLOCATION",
          "WARNING"
        );
        await markReminderAsSent(alloc.id, "return_2h", userId);
        await logReminderActivity(userId, "return_2h", "ALLOCATION");
        results.push(`Return 2h reminder sent to User ${userId}`);
      }
    }
    // 12 Hours Before
    else if (diffHours <= 12 && diffHours > 2) {
      const alreadySent = await hasReminderBeenSent(alloc.id, "return_12h", userId);
      if (!alreadySent) {
        await createNotification(
          userId,
          "Asset Return Reminder (12 Hours)",
          `Your allocation for asset ${alloc.asset.name} is due in 12 hours.`,
          "ALLOCATION",
          "REMINDER"
        );
        await markReminderAsSent(alloc.id, "return_12h", userId);
        await logReminderActivity(userId, "return_12h", "ALLOCATION");
        results.push(`Return 12h reminder sent to User ${userId}`);
      }
    }
    // 24 Hours Before
    else if (diffHours <= 24 && diffHours > 12) {
      const alreadySent = await hasReminderBeenSent(alloc.id, "return_24h", userId);
      if (!alreadySent) {
        await createNotification(
          userId,
          "Asset Return Reminder (24 Hours)",
          `Your allocation for asset ${alloc.asset.name} is due in 24 hours.`,
          "ALLOCATION",
          "REMINDER"
        );
        await markReminderAsSent(alloc.id, "return_24h", userId);
        await logReminderActivity(userId, "return_24h", "ALLOCATION");
        results.push(`Return 24h reminder sent to User ${userId}`);
      }
    }
  }

  // ==========================================
  // 2. BOOKING REMINDERS (24h, 2h, 30m, Expired)
  // ==========================================
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      status: "UPCOMING"
    },
    include: { asset: true, user: true }
  });

  for (const booking of upcomingBookings) {
    const userId = booking.userId;
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);
    
    // Check if ended
    if (endDate.getTime() <= now.getTime()) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "COMPLETED" }
      });
      await createNotification(
        userId,
        "Booking Completed",
        `Your reservation for ${booking.asset.name} has ended.`,
        "BOOKING",
        "SUCCESS"
      );
      await logReminderActivity(userId, "booking_expired", "BOOKING");
      results.push(`Booking expired and user ${userId} notified.`);
      continue;
    }

    const diffMs = startDate.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);

    // 30 Minutes Before
    if (diffMins <= 30 && diffMins > 0) {
      const alreadySent = await hasReminderBeenSent(booking.id, "booking_30m", userId);
      if (!alreadySent) {
        await createNotification(
          userId,
          "Upcoming Booking Reminder (30 Mins)",
          `Your reservation for ${booking.asset.name} starts in 30 minutes.`,
          "BOOKING",
          "WARNING"
        );
        await markReminderAsSent(booking.id, "booking_30m", userId);
        await logReminderActivity(userId, "booking_30m", "BOOKING");
        results.push(`Booking 30m reminder sent to User ${userId}`);
      }
    }
    // 2 Hours Before
    else if (diffMins <= 120 && diffMins > 30) {
      const alreadySent = await hasReminderBeenSent(booking.id, "booking_2h", userId);
      if (!alreadySent) {
        await createNotification(
          userId,
          "Upcoming Booking Reminder (2 Hours)",
          `Your reservation for ${booking.asset.name} starts in 2 hours.`,
          "BOOKING",
          "REMINDER"
        );
        await markReminderAsSent(booking.id, "booking_2h", userId);
        await logReminderActivity(userId, "booking_2h", "BOOKING");
        results.push(`Booking 2h reminder sent to User ${userId}`);
      }
    }
    // 24 Hours Before
    else if (diffMins <= 1440 && diffMins > 120) {
      const alreadySent = await hasReminderBeenSent(booking.id, "booking_24h", userId);
      if (!alreadySent) {
        await createNotification(
          userId,
          "Upcoming Booking Reminder (24 Hours)",
          `Your reservation for ${booking.asset.name} starts tomorrow at ${startDate.toLocaleTimeString()}.`,
          "BOOKING",
          "REMINDER"
        );
        await markReminderAsSent(booking.id, "booking_24h", userId);
        await logReminderActivity(userId, "booking_24h", "BOOKING");
        results.push(`Booking 24h reminder sent to User ${userId}`);
      }
    }
  }

  // ==========================================
  // 3. MAINTENANCE REMINDERS
  // ==========================================
  const pendingMaintenance = await prisma.maintenanceRequest.findMany({
    where: {
      status: "PENDING"
    },
    include: { asset: true, raisedBy: true }
  });

  // Notify asset managers about pending maintenance tickets
  const assetManagers = await prisma.user.findMany({
    where: { role: { in: ["ASSET_MANAGER", "ADMIN"] }, status: "ACTIVE" }
  });

  for (const ticket of pendingMaintenance) {
    for (const manager of assetManagers) {
      const alreadySent = await hasReminderBeenSent(ticket.id, "maintenance_pending", manager.id);
      if (!alreadySent) {
        await createNotification(
          manager.id,
          "Pending Maintenance Request",
          `A repair request for ${ticket.asset.name} is waiting for approval.`,
          "MAINTENANCE",
          "APPROVAL"
        );
        await markReminderAsSent(ticket.id, "maintenance_pending", manager.id);
        await logReminderActivity(manager.id, "maintenance_pending", "MAINTENANCE");
      }
    }
  }

  // ==========================================
  // 4. AUDIT CYCLE REMINDERS
  // ==========================================
  const activeAudits = await prisma.auditCycle.findMany({
    where: {
      status: "ACTIVE"
    }
  });

  for (const audit of activeAudits) {
    const endDate = new Date(audit.endDate);
    const startDate = new Date(audit.startDate);

    const diffEndMs = endDate.getTime() - now.getTime();
    const diffEndDays = diffEndMs / (1000 * 60 * 60 * 24);

    // Overdue Check
    if (diffEndDays < 0) {
      for (const manager of assetManagers) {
        const alreadySent = await hasReminderBeenSent(audit.id, "audit_overdue", manager.id);
        if (!alreadySent) {
          await createNotification(
            manager.id,
            "Audit Cycle Overdue",
            `The audit cycle "${audit.name}" has passed its end date.`,
            "AUDIT",
            "CRITICAL"
          );
          await markReminderAsSent(audit.id, "audit_overdue", manager.id);
          await logReminderActivity(manager.id, "audit_overdue", "AUDIT");
        }
      }
    }
    // Ends Tomorrow
    else if (diffEndDays <= 1) {
      for (const manager of assetManagers) {
        const alreadySent = await hasReminderBeenSent(audit.id, "audit_ends_tomorrow", manager.id);
        if (!alreadySent) {
          await createNotification(
            manager.id,
            "Audit Cycle Ending Tomorrow",
            `The audit cycle "${audit.name}" ends tomorrow. Please complete checking items.`,
            "AUDIT",
            "WARNING"
          );
          await markReminderAsSent(audit.id, "audit_ends_tomorrow", manager.id);
          await logReminderActivity(manager.id, "audit_ends_tomorrow", "AUDIT");
        }
      }
    }
  }

  return { success: true, count: results.length, logs: results };
}

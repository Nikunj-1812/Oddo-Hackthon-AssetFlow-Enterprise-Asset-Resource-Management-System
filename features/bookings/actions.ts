"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { BookingStatus } from "@prisma/client";

async function verifyUser() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  return session.user;
}

export async function createBooking(formData: FormData) {
  try {
    const user = await verifyUser();

    const assetId = formData.get("assetId") as string;
    const startTimeStr = formData.get("startTime") as string;
    const endTimeStr = formData.get("endTime") as string;

    if (!assetId || !startTimeStr || !endTimeStr) {
      return { error: "Resource and Time Slot are required." };
    }

    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return { error: "Invalid date format." };
    }

    if (startTime >= endTime) {
      return { error: "Start time must be before end time." };
    }

    if (startTime < new Date()) {
      return { error: "Cannot book slots in the past." };
    }

    // Overlap collision query (conflict rule)
    const result = await prisma.$transaction(async (tx) => {
      // Find bookable asset
      const asset = await tx.asset.findUnique({
        where: { id: assetId }
      });

      if (!asset || !asset.bookable) {
        throw new Error("Asset is not marked as a shared bookable resource.");
      }

      // Check collision
      const overlappingBookings = await tx.booking.findMany({
        where: {
          assetId,
          status: { in: ["UPCOMING", "ONGOING"] },
          // (StartA <= EndB) and (EndA >= StartB)
          startTime: { lt: endTime },
          endTime: { gt: startTime }
        },
        include: { user: true }
      });

      if (overlappingBookings.length > 0) {
        const clashingUser = overlappingBookings[0].user?.name || "another staff member";
        throw new Error(`Time Conflict: This resource is already reserved by ${clashingUser} during this slot.`);
      }

      // Save booking
      return await tx.booking.create({
        data: {
          assetId,
          userId: user.id!,
          startTime,
          endTime,
          status: "UPCOMING",
          bookForType: formData.get("bookForType") as string || "EMPLOYEE",
          departmentId: formData.get("departmentId") as string || null
        } as any,
        include: { asset: true }
      });
    });

    await createNotification(
      user.id!,
      "Resource Booking Confirmed",
      `Your reservation slot for asset ${result.asset.name} (${result.asset.tag}) has been successfully approved and scheduled.`,
      "BOOKING",
      "SUCCESS"
    );

    await logActivity({
      userId: user.id!,
      action: `Booked shared resource ${assetId} for ${startTimeStr} to ${endTimeStr}`,
      targetType: "Booking",
      targetId: result.id,
      newValue: result
    });

    return { success: true };
  } catch (error: any) {
    console.error("Create Booking Error:", error);
    try {
      const user = await verifyUser();
      const assetId = formData.get("assetId") as string;
      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      await createNotification(
        user.id!,
        "Booking Conflict Warning",
        `Failed to reserve ${asset?.name || "resource"}: Time slot overlaps with an existing reservation.`,
        "BOOKING",
        "WARNING"
      );
    } catch (_) {}
    return { error: error.message || "Failed to create booking." };
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const user = await verifyUser();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { asset: true }
    });

    if (!booking) return { error: "Booking not found." };

    // Update status
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" }
    });

    await createNotification(
      booking.userId,
      "Resource Reservation Cancelled",
      `Your reservation slot for asset ${booking.asset.name} (${booking.asset.tag}) has been marked cancelled.`,
      "BOOKING",
      "WARNING"
    );

    await logActivity({
      userId: user.id!,
      action: `Cancelled reservation`,
      targetType: "Booking",
      targetId: bookingId,
      oldValue: { status: booking.status },
      newValue: { status: "CANCELLED" }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Cancel Booking Error:", error);
    return { error: error.message || "Failed to cancel booking." };
  }
}

export async function rescheduleBooking(bookingId: string, startTimeStr: string, endTimeStr: string) {
  try {
    const user = await verifyUser();
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    if (startTime >= endTime) return { error: "Start time must be before end time." };
    if (startTime < new Date()) return { error: "Cannot reschedule slots to the past." };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { asset: true }
    });
    if (!booking) return { error: "Booking not found." };

    // Check collision excluding current booking
    const overlapping = await prisma.booking.findMany({
      where: {
        id: { not: bookingId },
        assetId: booking.assetId,
        status: { in: ["UPCOMING", "ONGOING"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      },
      include: { user: true }
    });

    if (overlapping.length > 0) {
      const clashingUser = overlapping[0].user?.name || "another staff member";
      return { error: `Reschedule Conflict: This resource is already reserved by ${clashingUser} during this slot.` };
    }

    // Save reschedule update
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        startTime,
        endTime,
        status: "UPCOMING"
      }
    });

    // Notify user
    await createNotification(
      booking.userId,
      "Resource Booking Rescheduled",
      `Your reservation slot for asset ${booking.asset.name} has been rescheduled to ${startTime.toLocaleString()} - ${endTime.toLocaleString()}.`,
      "BOOKING",
      "INFO"
    );

    await logActivity({
      userId: user.id!,
      action: `Rescheduled booking from ${booking.startTime.toLocaleString()} to ${startTime.toLocaleString()}`,
      targetType: "Booking",
      targetId: bookingId,
      oldValue: booking,
      newValue: updated
    });

    return { success: true };
  } catch (error: any) {
    console.error("Reschedule Booking Error:", error);
    return { error: error.message || "Failed to reschedule booking." };
  }
}

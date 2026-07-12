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
          status: "UPCOMING"
        }
      });
    });

    await createNotification(
      user.id!,
      "Resource Booking Confirmed",
      `Your reservation slot for bookable asset has been successfully approved and scheduled.`,
      "BOOKING"
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
    return { error: error.message || "Failed to create booking." };
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const user = await verifyUser();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
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
      `Your reservation slot for asset Tag AF-${booking.assetId.substring(0,4)} has been marked cancelled.`,
      "BOOKING"
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

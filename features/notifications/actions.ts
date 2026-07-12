"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function verifyUser() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  return session.user;
}

export async function getNotificationsAction() {
  try {
    const user = await verifyUser();
    return await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (error: any) {
    console.error("Get Notifications Error:", error);
    return [];
  }
}

export async function markAsReadAction(id: string) {
  try {
    const user = await verifyUser();
    await prisma.notification.update({
      where: { id, userId: user.id },
      data: { read: true },
    });
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
    return { success: true };
  } catch (error: any) {
    console.error("Mark All Read Error:", error);
    return { error: error.message };
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const user = await verifyUser();
    await prisma.notification.delete({
      where: { id, userId: user.id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Delete Notification Error:", error);
    return { error: error.message };
  }
}

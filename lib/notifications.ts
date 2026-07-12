import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  category: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        category,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification record:", error);
    return null;
  }
}

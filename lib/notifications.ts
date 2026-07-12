import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  category: string,
  priority: string = "INFO"
) {
  const data: any = {
    userId,
    title,
    message,
    category,
    priority,
  };
  try {
    return await prisma.notification.create({ data });
  } catch (error: any) {
    if (error.message?.includes("priority") || error.message?.includes("Unknown argument")) {
      delete data.priority;
      try {
        return await prisma.notification.create({ data });
      } catch (innerError) {
        console.error("Error creating fallback notification record:", innerError);
        return null;
      }
    }
    console.error("Error creating notification record:", error);
    return null;
  }
}

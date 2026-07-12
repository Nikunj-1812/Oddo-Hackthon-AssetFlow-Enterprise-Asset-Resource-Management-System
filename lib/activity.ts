import { prisma } from "./prisma";

export async function logActivity({
  userId,
  action,
  targetType,
  targetId,
  oldValue,
  newValue,
}: {
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  oldValue?: any;
  newValue?: any;
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

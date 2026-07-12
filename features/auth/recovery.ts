"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function forgotPasswordAction(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    if (!email) return { error: "Email is required." };

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Security best practice: do not reveal if user email exists
      return { success: true };
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour validity

    // Store in DB
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires
      }
    });

    // Mock dispatch - Output reset link to terminal log
    console.log("\n========================================================");
    console.log("🔑 PASSWORD RECOVERY INITIATED FOR:", email);
    console.log(`🔗 RESET LINK: http://localhost:3000/reset-password?token=${token}`);
    console.log("========================================================\n");

    return { success: true };
  } catch (error: any) {
    console.error("Forgot Password Action Error:", error);
    return { error: "Failed to process forgot password request." };
  }
}

export async function resetPasswordAction(formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;

    if (!token || !password) {
      return { error: "Token and new password are required." };
    }

    if (password.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    // Verify token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return { error: "Token is invalid or has expired." };
    }

    // Hash and update
    const passwordHash = bcrypt.hashSync(password, 10);
    
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })
    ]);

    return { success: true };
  } catch (error: any) {
    console.error("Reset Password Action Error:", error);
    return { error: "Failed to reset password." };
  }
}

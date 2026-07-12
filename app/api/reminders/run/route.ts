/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { runReminderEngine } from "@/features/notifications/reminder-engine";

export async function GET(request: Request) {
  try {
    // Optional basic authentication token verification
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const cronSecret = process.env.CRON_SECRET || "default_reminder_secret";

    if (token !== cronSecret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await runReminderEngine();
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Reminder execution failed:", error);
    return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 });
  }
}

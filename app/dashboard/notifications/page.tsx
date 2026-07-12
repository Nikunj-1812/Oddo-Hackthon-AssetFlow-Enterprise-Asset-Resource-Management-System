import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationsClient from "./notifications-client";
import { getNotificationsAction } from "@/features/notifications/actions";

export const metadata = {
  title: "Notification Center | AssetFlow",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Load initial notifications (first 50)
  const initialData = await getNotificationsAction({ page: 1, limit: 50 });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Notification Center
        </h1>
        <p className="text-[#6B7280] mt-1">
          Manage system alerts, reminders, and requests.
        </p>
      </div>

      <NotificationsClient initialData={initialData} />
    </div>
  );
}

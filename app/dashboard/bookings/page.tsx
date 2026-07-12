import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingsClient from "./bookings-client";

export default async function BookingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch bookable items and current calendar logs
  const [bookableAssets, bookings] = await Promise.all([
    prisma.asset.findMany({
      where: { bookable: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      include: {
        asset: true,
        user: true,
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
          Shared Resource Bookings
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
          Reserve meeting spaces, company vehicles, and labs without overlap conflicts.
        </p>
      </div>

      <BookingsClient
        bookableAssets={bookableAssets}
        initialBookings={bookings}
      />
    </div>
  );
}

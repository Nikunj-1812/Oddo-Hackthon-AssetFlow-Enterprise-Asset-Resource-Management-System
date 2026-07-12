import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AvailabilityClient from "./availability-client";

export default async function AvailabilityPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch all assets, bookings, categories, and departments
  const [assets, bookings, categories, departments] = await Promise.all([
    prisma.asset.findMany({
      include: {
        category: true,
        allocations: {
          where: { status: "APPROVED", actualReturnDate: null },
          include: { department: true }
        }
      },
      orderBy: { tag: "asc" }
    }),
    prisma.booking.findMany({
      where: { status: { in: ["UPCOMING", "ONGOING"] } },
      include: { asset: true, user: true }
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
          Resource Availability Timeline
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
          Check real-time stock levels, live bookings, active handovers, and upcoming reservations.
        </p>
      </div>

      <AvailabilityClient
        assets={assets}
        bookings={bookings}
        categories={categories}
        departments={departments}
      />
    </div>
  );
}

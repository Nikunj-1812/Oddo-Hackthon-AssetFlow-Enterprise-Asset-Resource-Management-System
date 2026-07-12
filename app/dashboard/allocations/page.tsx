import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AllocationsClient from "./allocations-client";

export default async function AllocationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch data
  const [activeAllocations, assets, users, departments] = await Promise.all([
    prisma.allocation.findMany({
      where: {
        status: "APPROVED",
        actualReturnDate: null,
      },
      include: {
        asset: true,
        user: true,
        department: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.findMany({
      orderBy: { tag: "asc" },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
          Asset Allocations
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
          Assign assets, manage active handovers, monitor return dates, and record physical checks.
        </p>
      </div>

      <AllocationsClient
        initialAllocations={activeAllocations}
        assets={assets}
        users={users}
        departments={departments}
      />
    </div>
  );
}

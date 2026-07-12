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
      include: {
        allocations: {
          where: { status: "APPROVED", actualReturnDate: null },
          include: { user: true, department: true }
        }
      }
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Asset Allocations
        </h1>
        <p className="text-[#6B7280] mt-2">
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

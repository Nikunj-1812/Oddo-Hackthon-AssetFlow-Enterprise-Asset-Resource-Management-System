import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AuditsClient from "./audits-client";

export default async function AuditsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const role = (user as any).role || "EMPLOYEE";
  if (role !== "ADMIN" && role !== "ASSET_MANAGER") {
    redirect("/dashboard");
  }

  // Fetch cycles and locations for scoping
  const [cycles, assets] = await Promise.all([
    prisma.auditCycle.findMany({
      include: {
        items: {
          include: {
            asset: true,
            verifiedBy: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.findMany({
      select: { location: true },
      distinct: ["location"],
    }),
  ]);

  const locations = assets.map((a) => a.location);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
          Asset Audit Verification
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
          Start audit cycles, assign verification checkers, log stock condition, and generate discrepancy logs.
        </p>
      </div>

      <AuditsClient
        cycles={cycles}
        locations={locations}
      />
    </div>
  );
}

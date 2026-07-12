import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MaintenanceClient from "./maintenance-client";

export default async function MaintenancePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const role = (user as any).role || "EMPLOYEE";
  const isManager = role === "ADMIN" || role === "ASSET_MANAGER";

  // Fetch registered assets & tickets
  const [assets, requests] = await Promise.all([
    prisma.asset.findMany({
      orderBy: { tag: "asc" },
    }),
    prisma.maintenanceRequest.findMany({
      include: {
        asset: true,
        raisedBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
          Maintenance Workflow
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
          File equipment defect reports, route requests through approvals, assign technicians, and track repairs.
        </p>
      </div>

      <MaintenanceClient
        assets={assets}
        initialRequests={requests}
        isManager={isManager}
      />
    </div>
  );
}

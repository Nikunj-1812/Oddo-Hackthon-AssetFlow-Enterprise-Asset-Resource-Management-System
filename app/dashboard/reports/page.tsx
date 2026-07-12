import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./reports-client";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const role = (user as any).role || "EMPLOYEE";
  if (role !== "ADMIN" && role !== "ASSET_MANAGER") {
    redirect("/dashboard");
  }

  // Query live relational records
  const [
    assetsList,
    categoriesList,
    departmentsList,
    maintenanceList,
    overdueAllocations,
    idleAssets,
  ] = await Promise.all([
    // All assets for status, cost and acquisition data
    prisma.asset.findMany({
      include: { category: true },
    }),
    // Categories with costs
    prisma.category.findMany({
      include: {
        assets: {
          select: { cost: true },
        },
      },
    }),
    // Departments with allocation counts
    prisma.department.findMany({
      include: {
        allocations: {
          where: { status: "APPROVED" },
        },
        employees: true,
      },
    }),
    // Maintenance status counts
    prisma.maintenanceRequest.findMany({
      select: { status: true, priority: true },
    }),
    // Overdue allocations
    prisma.allocation.findMany({
      where: {
        status: "APPROVED",
        expectedReturnDate: { lt: new Date() },
      },
      include: {
        asset: true,
        user: true,
      },
    }),
    // Idle assets (available)
    prisma.asset.findMany({
      where: { status: "AVAILABLE" },
      take: 5,
    }),
  ]);

  // Aggregate Data for Charts in JS
  // 1. Asset status distribution
  const statusCounts: Record<string, number> = {};
  assetsList.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));

  // 2. Cost per Category
  const categoryCostData = categoriesList.map((cat) => {
    const totalCost = cat.assets.reduce((sum, a) => sum + a.cost, 0);
    return {
      name: cat.name,
      value: totalCost,
      count: cat.assets.length,
    };
  });

  // 3. Department assets and headcount
  const departmentData = departmentsList.map((dept) => ({
    name: dept.name,
    assets: dept.allocations.length,
    personnel: dept.employees.length,
  }));

  // 4. Maintenance priority trends
  const priorityCounts: Record<string, number> = {};
  maintenanceList.forEach((req) => {
    priorityCounts[req.priority] = (priorityCounts[req.priority] || 0) + 1;
  });
  const maintenancePriorityData = Object.entries(priorityCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 5. Monthly acquisitions timeline
  const monthlyCounts: Record<string, { count: number; cost: number }> = {};
  assetsList.forEach((a) => {
    const date = new Date(a.acquisitionDate);
    const label = date.toLocaleString("default", { month: "short", year: "numeric" });
    if (!monthlyCounts[label]) {
      monthlyCounts[label] = { count: 0, cost: 0 };
    }
    monthlyCounts[label].count += 1;
    monthlyCounts[label].cost += a.cost;
  });
  const growthData = Object.entries(monthlyCounts).map(([month, data]) => ({
    month,
    assetsAdded: data.count,
    costAdded: data.cost,
  })).slice(-6); // show past 6 months

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>
          Reports & Analytics Desk
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
          Comprehensive operations intelligence charts, category cost distributions, and inventory depreciation audit checklists.
        </p>
      </div>

      <ReportsClient
        statusData={statusData}
        categoryCostData={categoryCostData}
        departmentData={departmentData}
        maintenancePriorityData={maintenancePriorityData}
        growthData={growthData}
        overdueAllocations={overdueAllocations}
        idleAssets={idleAssets}
      />
    </div>
  );
}

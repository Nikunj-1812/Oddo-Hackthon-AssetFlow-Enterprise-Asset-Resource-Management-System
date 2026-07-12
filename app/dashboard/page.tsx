import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "./admin-dashboard";
import ManagerDashboard from "./manager-dashboard";
import DepartmentHeadDashboard from "./head-dashboard";
import EmployeeDashboard from "./employee-dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userName = session.user.name || "User";
  const userRole = (session.user as any).role || "EMPLOYEE";
  const departmentId = (session.user as any).departmentId || null;

  // 1. ADMIN DASHBOARD DATA
  if (userRole === "ADMIN") {
    const [
      totalAssets,
      totalEmployees,
      departmentsCount,
      categoriesCount,
      activeBookingsCount,
      activeAuditsCount,
      pendingPromotionsCount,
      pendingMaintenanceCount,
      recentActivity,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.user.count(),
      prisma.department.count(),
      prisma.category.count(),
      prisma.booking.count({ where: { status: "UPCOMING" } }),
      prisma.auditCycle.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.maintenanceRequest.count({ where: { status: "PENDING" } }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { timestamp: "desc" },
      }),
    ]);

    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>
            Welcome back, {userName}!
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
            Administrator Operations Control Console
          </p>
        </div>
        <AdminDashboard
          stats={{
            totalAssets,
            totalEmployees,
            departmentsCount,
            categoriesCount,
            activeBookingsCount,
            activeAuditsCount,
            pendingPromotionsCount,
            pendingMaintenanceCount,
          }}
          recentActivity={recentActivity}
        />
      </div>
    );
  }

  // 2. ASSET MANAGER DASHBOARD DATA
  if (userRole === "ASSET_MANAGER") {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const [
      availableAssets,
      allocatedAssets,
      pendingTransfers,
      pendingReturns,
      pendingMaintenanceCount,
      assetsNearRetirementCount,
      nearRetirementList,
    ] = await Promise.all([
      prisma.asset.count({ where: { status: "AVAILABLE" } }),
      prisma.asset.count({ where: { status: "ALLOCATED" } }),
      prisma.allocation.count({ where: { status: "PENDING" } }),
      prisma.allocation.count({
        where: {
          status: "APPROVED",
          expectedReturnDate: { lt: new Date() },
        },
      }),
      prisma.maintenanceRequest.count({ where: { status: "PENDING" } }),
      prisma.asset.count({
        where: {
          OR: [
            { condition: { in: ["POOR", "DAMAGED"] } },
            { acquisitionDate: { lt: threeYearsAgo } },
          ],
        },
      }),
      prisma.asset.findMany({
        where: {
          OR: [
            { condition: { in: ["POOR", "DAMAGED"] } },
            { acquisitionDate: { lt: threeYearsAgo } },
          ],
        },
        take: 5,
        orderBy: { acquisitionDate: "asc" },
      }),
    ]);

    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>
            Welcome back, {userName}!
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
            Asset Manager Overview Desk
          </p>
        </div>
        <ManagerDashboard
          stats={{
            availableAssets,
            allocatedAssets,
            pendingTransfers,
            pendingReturns,
            pendingMaintenanceCount,
            assetsNearRetirementCount,
          }}
          nearRetirementList={nearRetirementList}
        />
      </div>
    );
  }

  // 3. DEPARTMENT HEAD DASHBOARD DATA
  if (userRole === "DEPARTMENT_HEAD" && departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        employees: true,
      },
    });

    const deptName = dept?.name || "Department";
    const employeesCount = dept?.employees.length || 0;
    const employeeIds = dept?.employees.map((e) => e.id) || [];

    const [
      departmentAssets,
      activeRequestsCount,
      upcomingReturnsCount,
      bookingOverviewCount,
    ] = await Promise.all([
      prisma.asset.findMany({
        where: {
          allocations: {
            some: {
              status: "APPROVED",
              OR: [
                { departmentId: departmentId },
                { userId: { in: employeeIds } },
              ],
            },
          },
        },
        include: { category: true },
      }),
      prisma.maintenanceRequest.count({
        where: {
          status: "PENDING",
          userId: { in: employeeIds },
        },
      }),
      prisma.allocation.count({
        where: {
          status: "APPROVED",
          OR: [
            { departmentId: departmentId },
            { userId: { in: employeeIds } },
          ],
          expectedReturnDate: {
            gte: new Date(),
            lte: new Date(new Date().setDate(new Date().getDate() + 7)),
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: { in: ["UPCOMING", "ONGOING"] },
          userId: { in: employeeIds },
        },
      }),
    ]);

    const totalAssetsCost = departmentAssets.reduce((sum, a) => sum + a.cost, 0);

    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>
            Welcome back, {userName}!
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
            Departmental Asset Manager Portal
          </p>
        </div>
        <DepartmentHeadDashboard
          deptName={deptName}
          stats={{
            totalAssetsCost,
            departmentAssetsCount: departmentAssets.length,
            employeesCount,
            activeRequestsCount,
            upcomingReturnsCount,
            bookingOverviewCount,
          }}
          assets={departmentAssets}
          employees={dept?.employees || []}
        />
      </div>
    );
  }

  // 4. EMPLOYEE DASHBOARD DATA (DEFAULT)
  const [
    myAssets,
    myBookings,
    myRequests,
    myAssetsCount,
    myBookingsCount,
    myRequestsCount,
    upcomingReturnsCount,
  ] = await Promise.all([
    prisma.allocation.findMany({
      where: { userId, status: "APPROVED" },
      include: { asset: true },
    }),
    prisma.booking.findMany({
      where: { userId, status: "UPCOMING" },
      include: { asset: true },
      take: 5,
      orderBy: { startTime: "asc" },
    }),
    prisma.maintenanceRequest.findMany({
      where: { userId },
      include: { asset: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.allocation.count({ where: { userId, status: "APPROVED" } }),
    prisma.booking.count({ where: { userId, status: "UPCOMING" } }),
    prisma.maintenanceRequest.count({ where: { userId, status: "PENDING" } }),
    prisma.allocation.count({
      where: {
        userId,
        status: "APPROVED",
        expectedReturnDate: { not: null },
      },
    }),
  ]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>
          Welcome back, {userName}!
        </h1>
        <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
          Unified Employee Portal Dashboard
        </p>
      </div>
      <EmployeeDashboard
        stats={{
          myAssetsCount,
          myBookingsCount,
          myRequestsCount,
          upcomingReturnsCount,
        }}
        myAssets={myAssets}
        myBookings={myBookings}
        myRequests={myRequests}
      />
    </div>
  );
}

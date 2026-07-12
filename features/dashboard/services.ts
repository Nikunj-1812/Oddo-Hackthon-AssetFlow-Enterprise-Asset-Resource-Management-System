import { prisma } from "@/lib/prisma";

export class DashboardService {
  static async getAdminData() {
    const [
      totalAssets,
      totalEmployees,
      departmentsCount,
      categoriesCount,
      activeBookingsCount,
      activeAuditsCount,
      pendingPromotionsCount,
      pendingMaintenanceCount,
      pendingTransfersCount,
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
      (prisma as any).transferRequest?.count({ where: { status: "DEPARTMENT_APPROVED" } }) || Promise.resolve(0),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { timestamp: "desc" },
      }),
    ]);

    return {
      stats: {
        totalAssets,
        totalEmployees,
        departmentsCount,
        categoriesCount,
        activeBookingsCount,
        activeAuditsCount,
        pendingPromotionsCount,
        pendingMaintenanceCount,
        pendingTransfersCount,
      },
      recentActivity,
    };
  }

  static async getAssetManagerData() {
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

    return {
      stats: {
        availableAssets,
        allocatedAssets,
        pendingTransfers,
        pendingReturns,
        pendingMaintenanceCount,
        assetsNearRetirementCount,
      },
      nearRetirementList,
    };
  }

  static async getDepartmentHeadData(departmentId: string) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { employees: true },
    });

    const deptName = dept?.name || "Department";
    const employeesCount = dept?.employees.length || 0;
    const employeeIds = dept?.employees.map((e) => e.id) || [];

    const [
      departmentAssets,
      activeRequestsCount,
      upcomingReturnsCount,
      bookingOverviewCount,
      pendingTransfersCount,
      recentActivity,
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
        where: { status: "PENDING", asset: { allocations: { some: { departmentId, actualReturnDate: null } } } } 
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
      (prisma as any).transferRequest?.count({ where: { status: "PENDING", requestedDepartmentId: departmentId } }) || Promise.resolve(0),
      prisma.activityLog.findMany({
        where: { targetType: { in: ["Department", "User", "Allocation"] } },
        take: 5,
        orderBy: { timestamp: "desc" }
      }),
    ]);

    const totalAssetsCost = departmentAssets.reduce((sum, a) => sum + a.cost, 0);

    return {
      deptName,
      employees: dept?.employees || [],
      stats: {
        totalAssetsCost,
        departmentAssetsCount: departmentAssets.length,
        employeesCount,
        activeRequestsCount,
        upcomingReturnsCount,
        bookingOverviewCount,
      },
      assets: departmentAssets,
    };
  }

  static async getEmployeeData(userId: string) {
    const [
      myAssets,
      myBookings,
      myRequests,
      myAssetsCount,
      myBookingsCount,
      myRequestsCount,
      upcomingReturnsCount,
      pendingTransfersCount,
      recentActivity,
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
      (prisma as any).transferRequest?.count({ where: { requestedById: userId, status: { in: ["PENDING", "DEPARTMENT_APPROVED"] } } }) || Promise.resolve(0),
      prisma.activityLog.findMany({
        where: { userId },
        take: 5,
        orderBy: { timestamp: "desc" }
      }),
    ]);

    return {
      stats: {
        myAssetsCount,
        myBookingsCount,
        myRequestsCount,
        upcomingReturnsCount,
      },
      myAssets,
      myBookings,
      myRequests,
    };
  }
}

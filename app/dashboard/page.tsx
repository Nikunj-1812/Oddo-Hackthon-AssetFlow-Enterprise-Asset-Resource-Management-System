import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "./admin-dashboard";
import ManagerDashboard from "./manager-dashboard";
import DepartmentHeadDashboard from "./head-dashboard";
import EmployeeDashboard from "./employee-dashboard";
import DashboardAlerts from "./components/dashboard-alerts";
import { DashboardService } from "@/features/dashboard/services";

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
    const data = await DashboardService.getAdminData();

    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#9CA3AF] uppercase mb-1">
            Administrator Console
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Welcome back, {userName}
          </h1>
          <p className="text-[#6B7280] mt-2">
            Complete system overview across all departments
          </p>
        </div>
        <DashboardAlerts />
        <AdminDashboard
          stats={data.stats}
          recentActivity={data.recentActivity}
        />
      </div>
    );
  }

  // 2. ASSET MANAGER DASHBOARD DATA
  if (userRole === "ASSET_MANAGER") {
    const data = await DashboardService.getAssetManagerData();

    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#9CA3AF] uppercase mb-1">
            Asset Manager Overview
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Welcome back, {userName}
          </h1>
          <p className="text-[#6B7280] mt-2">
            Manage asset lifecycles, monitor allocations, and approve maintenance requests.
          </p>
        </div>
        <DashboardAlerts />
        <ManagerDashboard
          stats={data.stats}
          nearRetirementList={data.nearRetirementList}
        />
      </div>
    );
  }

  // 3. DEPARTMENT HEAD DASHBOARD DATA
  if (userRole === "DEPARTMENT_HEAD" && departmentId) {
    const data = await DashboardService.getDepartmentHeadData(departmentId);

    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#9CA3AF] uppercase mb-1">
            Department Head Portal
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Welcome back, {userName}
          </h1>
          <p className="text-[#6B7280] mt-2">
            Overview of all hardware and resources currently assigned to your team.
          </p>
        </div>
        <DashboardAlerts />
        <DepartmentHeadDashboard
          deptName={data.deptName}
          stats={data.stats}
          assets={data.assets}
          employees={data.employees}
        />
      </div>
    );
  }

  // 4. EMPLOYEE DASHBOARD DATA (DEFAULT)
  const data = await DashboardService.getEmployeeData(userId);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-bold tracking-widest text-[#9CA3AF] uppercase mb-1">
          Employee Portal
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Welcome back, {userName}
        </h1>
        <p className="text-[#6B7280] mt-2">
          Your active hardware assignments, upcoming bookings, and IT requests.
        </p>
      </div>
      <DashboardAlerts />
      <EmployeeDashboard
        stats={data.stats}
        myAssets={data.myAssets}
        myBookings={data.myBookings}
        myRequests={data.myRequests}
      />
    </div>
  );
}

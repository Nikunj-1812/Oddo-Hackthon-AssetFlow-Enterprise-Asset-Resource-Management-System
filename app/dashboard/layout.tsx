import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import HeaderActions from "./header-actions";
import SidebarNavClient from "./sidebar-nav-client";
import SearchBar from "./components/search-bar";
import {
  LayoutDashboard,
  Boxes,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  Building2,
  LogOut,
  Activity,
  FileBarChart,
  Zap,
  Search,
  ArrowRightLeft,
  Bell,
  Scan,
  RotateCcw,
} from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  iconName: string;
  roles: string[];
  section?: string;
}

const sidebarLinks: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    iconName: "LayoutDashboard",
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Overview",
  },
  {
    href: "/dashboard/assets",
    label: "Asset Directory",
    icon: Boxes,
    iconName: "Boxes",
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/bookings",
    label: "Resource Bookings",
    icon: CalendarDays,
    iconName: "CalendarDays",
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/maintenance",
    label: "Maintenance",
    icon: Wrench,
    iconName: "Wrench",
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/allocations",
    label: "Allocations",
    icon: ClipboardCheck,
    iconName: "ClipboardCheck",
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/transfers",
    label: "Transfer Requests",
    icon: ArrowRightLeft,
    iconName: "ArrowRightLeft",
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/scanner",
    label: "QR Scanner",
    icon: Scan,
    iconName: "Scan",
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/return-requests",
    label: "Return Requests",
    icon: RotateCcw,
    iconName: "RotateCcw",
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/audits",
    label: "Audit Cycles",
    icon: ClipboardCheck,
    iconName: "ClipboardCheck",
    roles: ["ADMIN", "ASSET_MANAGER"],
    section: "Management",
  },
  {
    href: "/dashboard/reports",
    label: "Reports & Analytics",
    icon: FileBarChart,
    iconName: "FileBarChart",
    roles: ["ADMIN", "ASSET_MANAGER"],
    section: "Management",
  },
  {
    href: "/dashboard/organization",
    label: "Organization",
    icon: Building2,
    iconName: "Building2",
    roles: ["ADMIN", "ASSET_MANAGER"],
    section: "Management",
  },
  {
    href: "/dashboard/activity-logs",
    label: "Activity Logs",
    icon: Activity,
    iconName: "Activity",
    roles: ["ADMIN"],
    section: "Management",
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role || "EMPLOYEE";
  const userName = session.user.name || "User";

  const filteredLinks = sidebarLinks.filter((link) =>
    link.roles.includes(userRole)
  );

  const sections = Array.from(new Set(filteredLinks.map((l) => l.section)));

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrator",
    ASSET_MANAGER: "Asset Manager",
    DEPARTMENT_HEAD: "Dept. Head",
    EMPLOYEE: "Employee",
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans text-[#111827]">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 border-r border-[#E5E7EB] bg-white flex flex-col fixed inset-y-0 z-20">
        {/* Logo */}
        <Link href="/dashboard" className="h-16 flex items-center gap-2 px-6 border-b border-[#E5E7EB] hover:bg-[#FAFAFA] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-[#6ecfa3] flex items-center justify-center shadow-sm">
            <Zap size={18} className="text-[#111827] fill-[#111827]" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#111827]">AssetFlow</span>
        </Link>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          <SidebarNavClient
            links={filteredLinks.map((l) => ({
              href: l.href,
              label: l.label,
              iconName: l.iconName,
              section: l.section,
            }))}
            sections={sections as string[]}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] p-4 bg-[#FAFAFA]/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6ecfa3] to-[#3b82f6] flex items-center justify-center text-black font-bold text-sm shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-[#111827] truncate">
                {userName}
              </span>
              <span className="text-xs text-[#6B7280] font-medium truncate">
                {roleLabel[userRole] || userRole}
              </span>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm shadow-black/5">
          <SearchBar />

          <HeaderActions />
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

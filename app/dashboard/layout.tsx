import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import HeaderActions from "./header-actions";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
  section?: string;
}

const sidebarLinks: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Overview",
  },
  {
    href: "/dashboard/assets",
    label: "Asset Directory",
    icon: Boxes,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/bookings",
    label: "Resource Bookings",
    icon: CalendarDays,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/maintenance",
    label: "Maintenance",
    icon: Wrench,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/allocations",
    label: "Allocations",
    icon: ClipboardCheck,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
    section: "Operations",
  },
  {
    href: "/dashboard/audits",
    label: "Audit Cycles",
    icon: ClipboardCheck,
    roles: ["ADMIN", "ASSET_MANAGER"],
    section: "Management",
  },
  {
    href: "/dashboard/reports",
    label: "Reports & Analytics",
    icon: FileBarChart,
    roles: ["ADMIN", "ASSET_MANAGER"],
    section: "Management",
  },
  {
    href: "/dashboard/organization",
    label: "Organization",
    icon: Building2,
    roles: ["ADMIN", "ASSET_MANAGER"],
    section: "Management",
  },
  {
    href: "/dashboard/activity-logs",
    label: "Activity Logs",
    icon: Activity,
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
  const userEmail = session.user.email || "";

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
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa" }}>

      {/* ── SIDEBAR ── */}
      <aside className="erp-sidebar" id="erp-sidebar">

        {/* Logo */}
        <Link href="/dashboard" className="erp-sidebar-logo">
          <div className="erp-sidebar-logo-mark">
            <Zap size={17} fill="#1a4a2e" color="#1a4a2e" />
          </div>
          <span className="erp-sidebar-logo-text">AssetFlow ERP</span>
        </Link>

        {/* Navigation */}
        <nav className="erp-sidebar-nav">
          {sections.map((section) => (
            <div key={section}>
              <div className="erp-nav-section-label">{section}</div>
              {filteredLinks
                .filter((l) => l.section === section)
                .map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="erp-nav-link"
                      id={`nav-${link.href.replace(/\//g, "-")}`}
                    >
                      <Icon size={16} className="nav-icon" />
                      <span className="erp-nav-link-label">{link.label}</span>
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="erp-sidebar-footer">
          <div className="erp-user-card">
            <div className="erp-user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="erp-user-info">
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userName}
              </span>
              <span style={{ fontSize: "0.68rem", color: "#6b7280", fontWeight: 600 }}>
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
              className="erp-collapse-btn"
              style={{ color: "#ef4444", borderColor: "#fee2e2" }}
            >
              <LogOut size={13} />
              <span className="erp-nav-link-label">Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top Bar */}
        <header className="erp-topbar">
          <div className="erp-search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search assets, staff, bookings..."
              id="global-search"
              readOnly
              style={{ cursor: "text" }}
            />
            <span style={{ fontSize: "0.65rem", color: "#c4c9d0", background: "#f0f0f0", padding: "2px 6px", borderRadius: "5px", whiteSpace: "nowrap", fontWeight: 600 }}>
              ⌘K
            </span>
          </div>

          <HeaderActions />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", overflowX: "hidden" }}>
          <style>{`
            .erp-nav-link.active {
              background: #e8faf3;
              color: #1a7a4e;
              font-weight: 600;
            }
            .erp-nav-link.active::before {
              opacity: 1;
            }
            .erp-nav-link.active .nav-icon {
              color: #1a7a4e;
            }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
}

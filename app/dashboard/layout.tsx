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
  User,
  Activity,
  FileBarChart,
  Zap,
} from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const sidebarLinks: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard Portal",
    icon: LayoutDashboard,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
  },
  {
    href: "/dashboard/assets",
    label: "Assets Directory",
    icon: Boxes,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
  },
  {
    href: "/dashboard/bookings",
    label: "Resource Bookings",
    icon: CalendarDays,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
  },
  {
    href: "/dashboard/maintenance",
    label: "Maintenance Requests",
    icon: Wrench,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"],
  },
  {
    href: "/dashboard/audits",
    label: "Audit Cycles",
    icon: ClipboardCheck,
    roles: ["ADMIN", "ASSET_MANAGER"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports & Analytics",
    icon: FileBarChart,
    roles: ["ADMIN", "ASSET_MANAGER"],
  },
  {
    href: "/dashboard/organization",
    label: "Organization Setup",
    icon: Building2,
    roles: ["ADMIN", "ASSET_MANAGER"],
  },
  {
    href: "/dashboard/activity-logs",
    label: "Activity Logs",
    icon: Activity,
    roles: ["ADMIN"],
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fafafa" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #e5e7eb",
          fontFamily: "'Inter', sans-serif",
          boxShadow: "1px 0 10px rgba(0,0,0,0.01)",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            padding: "24px",
            fontSize: "1.1rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#111827",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#92E4BA", color: "#111827" }}>
            <Zap size={18} fill="#111827" />
          </div>
          AssetFlow ERP
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  color: "#4b5563",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  borderLeft: "3px solid transparent",
                }}
                className="sidebar-nav-link"
              >
                <Icon size={16} style={{ color: "#9ca3af" }} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE INFO PANEL */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#92E4BA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {userName}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>
                {userRole.replace("_", " ")}
              </span>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut();
            }}
            style={{ width: "100%" }}
          >
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                color: "#ef4444",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* TOP BAR HEADER */}
        <header
          style={{
            height: "64px",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span style={{ fontSize: "0.825rem", color: "#6b7280", fontWeight: 600 }}>
            AssetFlow Overview Portal
          </span>

          <HeaderActions />
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

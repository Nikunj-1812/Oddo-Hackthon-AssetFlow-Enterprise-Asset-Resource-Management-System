"use client";

import Link from "next/link";
import { 
  Boxes, Users, Building2, LayoutGrid, CalendarCheck, 
  Search, ShieldCheck, AlertCircle, ArrowRight, UserPlus, 
  ClipboardCheck, Clock
} from "lucide-react";

interface Props {
  stats: {
    totalAssets: number;
    totalEmployees: number;
    departmentsCount: number;
    categoriesCount: number;
    activeBookingsCount: number;
    activeAuditsCount: number;
    pendingPromotionsCount: number;
    pendingMaintenanceCount: number;
  };
  recentActivity: any[];
}

export default function AdminDashboard({ stats, recentActivity }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontFamily: "'Inter', sans-serif" }}>
      {/* Welcome & Health banner */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          backgroundColor: "#ffffff", 
          padding: "1.5rem 2rem", 
          borderRadius: "16px", 
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#111827" }}>
            Operational Console Desk
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
            System-level control, hierarchy assignments, security audit streams, and deployment health.
          </p>
        </div>
        <div 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            backgroundColor: "#ecfdf5", 
            color: "#065f46", 
            padding: "8px 16px", 
            borderRadius: "20px", 
            fontSize: "0.75rem", 
            fontWeight: 700 
          }}
        >
          <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
          DB Service Connected
        </div>
      </div>

      {/* KPI Grid */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
          gap: "1.5rem" 
        }}
      >
        {[
          { title: "Total Assets", val: stats.totalAssets, icon: Boxes, color: "#92E4BA" },
          { title: "Registered Employees", val: stats.totalEmployees, icon: Users, color: "#7cd4a5" },
          { title: "Active Departments", val: stats.departmentsCount, icon: Building2, color: "#6366f1" },
          { title: "Asset Classifications", val: stats.categoriesCount, icon: LayoutGrid, color: "#f59e0b" },
          { title: "Active Bookings", val: stats.activeBookingsCount, icon: CalendarCheck, color: "#ec4899" },
          { title: "Ongoing Audits", val: stats.activeAuditsCount, icon: ClipboardCheck, color: "#06b6d4" },
          { title: "Pending Promotions", val: stats.pendingPromotionsCount, icon: UserPlus, color: "#8b5cf6" },
          { title: "Pending Maintenance", val: stats.pendingMaintenanceCount, icon: AlertCircle, color: "#ef4444" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              style={{ 
                backgroundColor: "#ffffff", 
                border: "1px solid #e5e7eb", 
                borderRadius: "14px", 
                padding: "1.5rem", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01)",
                transition: "all 0.2s ease"
              }}
              className="kpi-card-hover"
            >
              <div>
                <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>
                  {kpi.title}
                </span>
                <h3 style={{ margin: "6px 0 0 0", fontSize: "1.6rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                  {kpi.val}
                </h3>
              </div>
              <div 
                style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  backgroundColor: `${kpi.color}15`, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}
              >
                <Icon size={22} style={{ color: kpi.color === "#92E4BA" ? "#1e293b" : kpi.color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "2rem" }}>
        {/* Quick actions panel */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Quick Operations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link 
              href="/dashboard/organization" 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><Building2 size={16} style={{ color: "#7cd4a5" }} /> Setup Departments & Classifications</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
            <Link 
              href="/dashboard/organization" 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><UserPlus size={16} style={{ color: "#7cd4a5" }} /> Promote Employee Role</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
            <Link 
              href="/dashboard/audits" 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><ClipboardCheck size={16} style={{ color: "#7cd4a5" }} /> Start Location Audit Cycle</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
            <Link 
              href="/dashboard/reports" 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><Search size={16} style={{ color: "#7cd4a5" }} /> System Reports Panel</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
          </div>
        </div>

        {/* Security / System Log Trail */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Compliance Activity Feed</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "#9ca3af", fontSize: "0.8rem" }}>
                No active audit logs.
              </div>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#92E4BA", marginTop: "6px" }} />
                  <div>
                    <span style={{ fontSize: "0.825rem", color: "#374151", fontWeight: 600 }}>
                      {log.action}
                    </span>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

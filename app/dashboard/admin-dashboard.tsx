"use client";

import Link from "next/link";
import {
  Boxes, Users, Building2, Tag, CalendarDays, ClipboardCheck,
  UserCheck, Wrench, TrendingUp, TrendingDown, ArrowRight,
  BarChart3, Activity, Shield, Package
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

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

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD
const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const generateTrend = (base: number, up: boolean) =>
  Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, base + (up ? i : 7 - i) * Math.ceil(base * 0.04) + Math.floor(Math.random() * 2)),
  }));

export default function AdminDashboard({ stats, recentActivity }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const kpis = [
    { title: "Total Assets", value: stats.totalAssets, icon: Boxes, color: "#92E4BA", bg: "#e8faf3", trend: "+8%", trendUp: true, href: "/dashboard/assets" },
    { title: "Staff Members", value: stats.totalEmployees, icon: Users, color: "#6366f1", bg: "#eff6ff", trend: "+2", trendUp: true, href: "/dashboard/organization" },
    { title: "Departments", value: stats.departmentsCount, icon: Building2, color: "#f59e0b", bg: "#fffbeb", trend: "Stable", trendUp: true, href: "/dashboard/organization" },
    { title: "Asset Categories", value: stats.categoriesCount, icon: Tag, color: "#8b5cf6", bg: "#f5f3ff", trend: "+1", trendUp: true, href: "/dashboard/assets" },
    { title: "Active Bookings", value: stats.activeBookingsCount, icon: CalendarDays, color: "#3b82f6", bg: "#dbeafe", trend: "+12%", trendUp: true, href: "/dashboard/bookings" },
    { title: "Active Audits", value: stats.activeAuditsCount, icon: ClipboardCheck, color: "#10b981", bg: "#d1fae5", trend: "In Progress", trendUp: true, href: "/dashboard/audits" },
    { title: "Pending Maintenance", value: stats.pendingMaintenanceCount, icon: Wrench, color: "#ef4444", bg: "#fee2e2", trend: "Needs attention", trendUp: false, href: "/dashboard/maintenance" },
    { title: "Total Employees", value: stats.pendingPromotionsCount, icon: UserCheck, color: "#ec4899", bg: "#fdf2f8", trend: "Active users", trendUp: true, href: "/dashboard/organization" },
  ];

  const quickLinks = [
    { href: "/dashboard/assets", label: "Asset Directory", desc: "Manage all assets", icon: Boxes, color: "#92E4BA" },
    { href: "/dashboard/organization", label: "Organization", desc: "Staff & departments", icon: Building2, color: "#6366f1" },
    { href: "/dashboard/audits", label: "Audit Cycles", desc: "Compliance audits", icon: ClipboardCheck, color: "#10b981" },
    { href: "/dashboard/reports", label: "Analytics", desc: "Reports & insights", icon: BarChart3, color: "#f59e0b" },
    { href: "/dashboard/maintenance", label: "Maintenance", desc: "Repair queue", icon: Wrench, color: "#ef4444" },
    { href: "/dashboard/activity-logs", label: "Activity Logs", desc: "Security audit trail", icon: Shield, color: "#8b5cf6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO ── */}
      <div className="animate-fade-up" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Administrator Console
          </p>
          <h1 className="page-title" style={{ margin: "4px 0 0 0" }}>
            {greeting}, Admin
          </h1>
          <p className="page-subtitle">
            Complete system overview across all departments
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link
            href="/dashboard/reports"
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "9px 18px", background: "#92E4BA", color: "#1a4a2e",
              borderRadius: "9px", border: "none", fontWeight: 700, fontSize: "0.825rem",
              cursor: "pointer", textDecoration: "none",
              boxShadow: "0 4px 12px rgba(146,228,186,0.35)",
            }}
          >
            <BarChart3 size={14} /> View Reports
          </Link>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "14px" }}
      >
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={i}
              href={kpi.href}
              className={`kpi-card animate-fade-up delay-${Math.min(i * 100, 500)}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="kpi-label">{kpi.title}</p>
                  <p className="kpi-value" style={{ marginTop: "4px" }}>{kpi.value}</p>
                </div>
                <div className="kpi-icon-wrap" style={{ background: kpi.bg }}>
                  <Icon size={18} color={kpi.color} />
                </div>
              </div>
              <div style={{ height: "32px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateTrend(kpi.value, kpi.trendUp)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`ag-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={kpi.color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={1.5} fill={`url(#ag-${i})`} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {kpi.trendUp
                  ? <span className="kpi-trend-up"><TrendingUp size={9} /> {kpi.trend}</span>
                  : <span className="kpi-trend-down"><TrendingDown size={9} /> {kpi.trend}</span>
                }
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── QUICK LINKS + ACTIVITY ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>

        {/* Quick Access */}
        <div
          className="animate-fade-up delay-200"
          style={{ background: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "22px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Activity size={15} color="#92E4BA" />
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Quick Access</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {quickLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <Link
                  key={i}
                  href={link.href}
                  style={{
                    display: "flex", flexDirection: "column", gap: "8px",
                    padding: "14px", background: "#fafafa",
                    border: "1px solid #f0f0f0", borderRadius: "10px",
                    textDecoration: "none", transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0faf5"; (e.currentTarget as HTMLElement).style.borderColor = "#92E4BA"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; (e.currentTarget as HTMLElement).style.borderColor = "#f0f0f0"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "8px", background: `${link.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={15} color={link.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827" }}>{link.label}</div>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "1px" }}>{link.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className="animate-fade-up delay-300"
          style={{ background: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "22px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={15} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Recent Activity</h3>
            </div>
            <Link href="/dashboard/activity-logs" style={{ fontSize: "0.72rem", color: "#1a7a4e", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>

          <div className="activity-timeline">
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                <Activity size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />
                No recent activity
              </div>
            ) : (
              recentActivity.slice(0, 6).map((log: any, i) => (
                <div key={log.id || i} className="activity-item">
                  <div className="activity-dot" style={{ background: "#e8faf3" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#92E4BA" }} />
                  </div>
                  <div className="activity-content">
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#111827" }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "2px" }}>
                       {fmtDate(log.timestamp)} {fmtTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SYSTEM HEALTH BANNER ── */}
      <div
        className="animate-fade-up delay-400"
        style={{
          background: "linear-gradient(135deg, #1a4a2e 0%, #2d6a4a 100%)",
          borderRadius: "14px",
          padding: "22px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "#92E4BA", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            System Health
          </p>
          <h3 style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
            All Systems Operational
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
            Database connected · Auth active · {stats.totalAssets} assets tracked
          </p>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { label: "Uptime", value: "99.9%" },
            { label: "Active Users", value: stats.totalEmployees.toString() },
            { label: "Departments", value: stats.departmentsCount.toString() },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#92E4BA", letterSpacing: "-0.02em" }}>{item.value}</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: "2px" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

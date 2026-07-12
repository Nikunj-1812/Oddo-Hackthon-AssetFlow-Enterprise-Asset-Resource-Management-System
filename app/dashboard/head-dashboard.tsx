"use client";

import Link from "next/link";
import {
  Boxes, Users, Wrench, Calendar, DollarSign,
  ArrowRight, TrendingUp, Building2, Package, AlertTriangle
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Props {
  deptName: string;
  stats: {
    totalAssetsCost: number;
    departmentAssetsCount: number;
    employeesCount: number;
    activeRequestsCount: number;
    upcomingReturnsCount: number;
    bookingOverviewCount: number;
  };
  assets: any[];
  employees: any[];
}

const generateTrend = (base: number) =>
  Array.from({ length: 7 }, () => ({ v: Math.max(0, base + Math.floor(Math.random() * 4) - 2) }));

export default function DepartmentHeadDashboard({ deptName, stats, assets, employees }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const kpis = [
    { title: "Dept. Assets", value: stats.departmentAssetsCount, icon: Boxes, color: "#92E4BA", bg: "#e8faf3", href: "/dashboard/assets" },
    { title: "Total Staff", value: stats.employeesCount, icon: Users, color: "#6366f1", bg: "#eff6ff", href: "/dashboard/organization" },
    { title: "Asset Value", value: `$${stats.totalAssetsCost.toLocaleString()}`, icon: DollarSign, color: "#f59e0b", bg: "#fffbeb", href: "/dashboard/assets" },
    { title: "Open Requests", value: stats.activeRequestsCount, icon: Wrench, color: "#ef4444", bg: "#fef2f2", href: "/dashboard/maintenance" },
    { title: "Upcoming Returns", value: stats.upcomingReturnsCount, icon: AlertTriangle, color: "#8b5cf6", bg: "#f5f3ff", href: "/dashboard/allocations" },
    { title: "Active Bookings", value: stats.bookingOverviewCount, icon: Calendar, color: "#3b82f6", bg: "#dbeafe", href: "/dashboard/bookings" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "'Inter', sans-serif" }}>

      {/* Hero */}
      <div className="animate-fade-up" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Building2 size={14} color="#9ca3af" />
            <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {deptName} Department
            </span>
          </div>
          <h1 className="page-title">{greeting}, Head</h1>
          <p className="page-subtitle">Department asset overview and team activity</p>
        </div>
        <Link
          href="/dashboard/assets"
          style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            padding: "9px 18px", background: "#92E4BA", color: "#1a4a2e",
            borderRadius: "9px", textDecoration: "none", fontWeight: 700, fontSize: "0.825rem",
            boxShadow: "0 4px 12px rgba(146,228,186,0.35)",
          }}
        >
          <Boxes size={14} /> View Assets
        </Link>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={i}
              href={kpi.href}
              className={`kpi-card animate-fade-up delay-${i * 100}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="kpi-label">{kpi.title}</p>
                  <p className="kpi-value" style={{ marginTop: "4px", fontSize: typeof kpi.value === "string" ? "1.35rem" : "2rem" }}>
                    {kpi.value}
                  </p>
                </div>
                <div className="kpi-icon-wrap" style={{ background: kpi.bg }}>
                  <Icon size={18} color={kpi.color} />
                </div>
              </div>
              <div style={{ height: "32px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateTrend(typeof kpi.value === "number" ? kpi.value : 5)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`hg-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={kpi.color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={1.5} fill={`url(#hg-${i})`} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <span className="kpi-trend-up"><TrendingUp size={9} /> Department view</span>
            </Link>
          );
        })}
      </div>

      {/* Assets + Team */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>

        {/* Department Assets */}
        <div
          className="animate-fade-up delay-200"
          style={{ background: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "22px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Boxes size={15} color="#92E4BA" />
              <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Dept. Assets</h3>
            </div>
            <Link href="/dashboard/assets" style={{ fontSize: "0.72rem", color: "#1a7a4e", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                <Package size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />
                No assets allocated to this department
              </div>
            ) : (
              assets.slice(0, 5).map((asset: any) => (
                <div
                  key={asset.id}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "#fafafa", borderRadius: "9px", border: "1px solid #f0f0f0" }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#e8faf3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Boxes size={14} color="#1a7a4e" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{asset.category?.name} · {asset.tag}</div>
                  </div>
                  <span className="status-badge status-allocated">Active</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Members */}
        <div
          className="animate-fade-up delay-300"
          style={{ background: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "22px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={15} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Team Members</h3>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{stats.employeesCount} total</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {employees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                <Users size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />
                No team members found
              </div>
            ) : (
              employees.slice(0, 6).map((emp: any) => (
                <div
                  key={emp.id}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 12px", background: "#fafafa", borderRadius: "9px", border: "1px solid #f0f0f0" }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#92E4BA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#1a4a2e", flexShrink: 0 }}>
                    {emp.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</div>
                  </div>
                  <span style={{ fontSize: "0.68rem", color: "#6366f1", background: "#eff6ff", padding: "2px 7px", borderRadius: "20px", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {emp.role?.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

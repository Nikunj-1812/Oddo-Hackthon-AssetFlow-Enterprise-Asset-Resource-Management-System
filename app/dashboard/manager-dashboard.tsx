"use client";

import Link from "next/link";
import {
  Boxes, BadgeCheck, AlertTriangle, RefreshCw, Wrench,
  Trash2, ArrowRight, PlusCircle, TrendingUp, TrendingDown,
  Activity, Clock, Package
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  stats: {
    availableAssets: number;
    allocatedAssets: number;
    pendingTransfers: number;
    pendingReturns: number;
    pendingMaintenanceCount: number;
    assetsNearRetirementCount: number;
  };
  nearRetirementList: any[];
}

// Sparkline data (synthetic trend data for visual)
const generateTrend = (base: number, up: boolean) =>
  Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, base + (up ? i : -i) * Math.ceil(base * 0.05) + Math.floor(Math.random() * 3)),
  }));

const kpiConfig = (stats: Props["stats"]) => [
  {
    title: "Available Stock",
    value: stats.availableAssets,
    icon: Boxes,
    color: "#92E4BA",
    bg: "#e8faf3",
    trend: "+12%",
    trendUp: true,
    data: generateTrend(stats.availableAssets, true),
  },
  {
    title: "Allocated Assets",
    value: stats.allocatedAssets,
    icon: BadgeCheck,
    color: "#6366f1",
    bg: "#eff6ff",
    trend: "+5%",
    trendUp: true,
    data: generateTrend(stats.allocatedAssets, true),
  },
  {
    title: "Pending Handovers",
    value: stats.pendingTransfers,
    icon: RefreshCw,
    color: "#f59e0b",
    bg: "#fffbeb",
    trend: "−3%",
    trendUp: false,
    data: generateTrend(stats.pendingTransfers, false),
  },
  {
    title: "Overdue Returns",
    value: stats.pendingReturns,
    icon: AlertTriangle,
    color: "#ef4444",
    bg: "#fef2f2",
    trend: "+8%",
    trendUp: false,
    data: generateTrend(stats.pendingReturns, false),
  },
  {
    title: "Active Maintenance",
    value: stats.pendingMaintenanceCount,
    icon: Wrench,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    trend: "−2%",
    trendUp: false,
    data: generateTrend(stats.pendingMaintenanceCount, false),
  },
  {
    title: "Near Retirement",
    value: stats.assetsNearRetirementCount,
    icon: Trash2,
    color: "#ec4899",
    bg: "#fdf2f8",
    trend: "+1",
    trendUp: false,
    data: generateTrend(stats.assetsNearRetirementCount, false),
  },
];

const quickActions = [
  { href: "/dashboard/assets", label: "Register New Asset", desc: "Add asset to inventory", icon: PlusCircle, color: "#92E4BA" },
  { href: "/dashboard/allocations", label: "Allocate Asset", desc: "Assign to staff or dept", icon: BadgeCheck, color: "#6366f1" },
  { href: "/dashboard/allocations", label: "Process Return", desc: "Mark asset as returned", icon: RefreshCw, color: "#f59e0b" },
  { href: "/dashboard/maintenance", label: "Approve Maintenance", desc: "Review pending tickets", icon: Wrench, color: "#8b5cf6" },
];

export default function ManagerDashboard({ stats, nearRetirementList }: Props) {
  const kpis = kpiConfig(stats);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO GREETING ── */}
      <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Asset Manager Portal
          </p>
          <h1 className="page-title" style={{ margin: "4px 0 0 0" }}>
            {greeting}, Manager
          </h1>
          <p className="page-subtitle">
            Here's your inventory overview for today
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/dashboard/assets"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 16px",
              background: "#92E4BA",
              color: "#1a4a2e",
              borderRadius: "9px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.825rem",
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.18s ease",
              boxShadow: "0 4px 12px rgba(146,228,186,0.3)",
            }}
          >
            <PlusCircle size={14} />
            New Asset
          </Link>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`kpi-card animate-fade-up delay-${Math.min(i * 100, 500)}`}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p className="kpi-label">{kpi.title}</p>
                  <p className="kpi-value" style={{ marginTop: "4px" }}>{kpi.value}</p>
                </div>
                <div className="kpi-icon-wrap" style={{ background: kpi.bg }}>
                  <Icon size={19} color={kpi.color} />
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ height: "40px", marginLeft: "-4px", marginRight: "-4px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpi.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={kpi.color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={kpi.color}
                      strokeWidth={1.5}
                      fill={`url(#grad-${i})`}
                      dot={false}
                      activeDot={false}
                    />
                    <Tooltip
                      contentStyle={{ display: "none" }}
                      cursor={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div>
                {kpi.trendUp ? (
                  <span className="kpi-trend-up">
                    <TrendingUp size={10} /> {kpi.trend} this week
                  </span>
                ) : (
                  <span className="kpi-trend-down">
                    <TrendingDown size={10} /> {kpi.trend} this week
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── QUICK ACTIONS + RETIREMENT ALERTS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>

        {/* Quick Actions */}
        <div
          className="animate-fade-up delay-200"
          style={{
            background: "#ffffff",
            border: "1px solid #f0f0f0",
            borderRadius: "14px",
            padding: "22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Activity size={16} color="#92E4BA" />
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>
              Quick Actions
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  href={action.href}
                  className="quick-action-card"
                >
                  <div className="quick-action-icon" style={{ background: `${action.color}18` }}>
                    <Icon size={16} color={action.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.825rem" }}>{action.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "1px" }}>{action.desc}</div>
                  </div>
                  <ArrowRight size={13} color="#d1d5db" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Depreciation Alert Board */}
        <div
          className="animate-fade-up delay-300"
          style={{
            background: "#ffffff",
            border: "1px solid #f0f0f0",
            borderRadius: "14px",
            padding: "22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <AlertTriangle size={16} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>
              Depreciation Alerts
            </h3>
            {nearRetirementList.length > 0 && (
              <span className="status-badge status-lost" style={{ marginLeft: "auto" }}>
                {nearRetirementList.length} at risk
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {nearRetirementList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                <Package size={28} color="#e5e7eb" style={{ margin: "0 auto 8px auto", display: "block" }} />
                All assets are in optimal condition
              </div>
            ) : (
              nearRetirementList.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#111827" }}>
                      [{asset.tag}] {asset.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#991b1b", marginTop: "1px" }}>
                      Condition: {asset.condition}
                    </div>
                  </div>
                  <Link
                    href="/dashboard/assets"
                    style={{ fontSize: "0.72rem", color: "#b91c1c", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
                  >
                    View →
                  </Link>
                </div>
              ))
            )}
          </div>

          {nearRetirementList.length > 0 && (
            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <Link
                href="/dashboard/assets"
                style={{ fontSize: "0.775rem", color: "#1a7a4e", fontWeight: 600, textDecoration: "none" }}
              >
                View all in Asset Directory →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── OVERVIEW STATS ROW ── */}
      <div
        className="animate-fade-up delay-400"
        style={{
          background: "linear-gradient(135deg, #92E4BA 0%, #6ecfa3 100%)",
          borderRadius: "14px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#1a4a2e", fontWeight: 600, opacity: 0.8 }}>
            Inventory Utilization
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "1.5rem", fontWeight: 800, color: "#1a4a2e", letterSpacing: "-0.02em" }}>
            {stats.availableAssets + stats.allocatedAssets > 0
              ? Math.round((stats.allocatedAssets / (stats.availableAssets + stats.allocatedAssets)) * 100)
              : 0}%
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#1a4a2e", opacity: 0.75 }}>
            of total inventory deployed
          </p>
        </div>
        <div style={{ display: "flex", gap: "32px" }}>
          {[
            { label: "Total Assets", val: stats.availableAssets + stats.allocatedAssets },
            { label: "In Use", val: stats.allocatedAssets },
            { label: "Available", val: stats.availableAssets },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#1a4a2e", letterSpacing: "-0.02em" }}>
                {item.val}
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "#1a4a2e", opacity: 0.75, fontWeight: 500 }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/dashboard/reports"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            background: "rgba(255,255,255,0.3)",
            backdropFilter: "blur(8px)",
            color: "#1a4a2e",
            border: "1.5px solid rgba(255,255,255,0.5)",
            borderRadius: "9px",
            fontWeight: 700,
            fontSize: "0.825rem",
            cursor: "pointer",
            textDecoration: "none",
            transition: "all 0.18s ease",
          }}
        >
          Full Analytics <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

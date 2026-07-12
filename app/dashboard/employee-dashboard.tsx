"use client";

import Link from "next/link";
import {
  Boxes, Calendar, Wrench, Clock, ArrowRight,
  TrendingUp, CheckCircle2, AlertCircle, Package
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Props {
  stats: {
    myAssetsCount: number;
    myBookingsCount: number;
    myRequestsCount: number;
    upcomingReturnsCount: number;
  };
  myAssets: any[];
  myBookings: any[];
  myRequests: any[];
}

const generateTrend = (base: number) =>
  Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, base + Math.floor(Math.random() * 3) - 1),
  }));

export default function EmployeeDashboard({ stats, myAssets, myBookings, myRequests }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const kpis = [
    {
      title: "My Assets",
      value: stats.myAssetsCount,
      icon: Boxes,
      color: "#92E4BA",
      bg: "#e8faf3",
      href: "/dashboard/assets",
      data: generateTrend(stats.myAssetsCount),
    },
    {
      title: "Upcoming Bookings",
      value: stats.myBookingsCount,
      icon: Calendar,
      color: "#6366f1",
      bg: "#eff6ff",
      href: "/dashboard/bookings",
      data: generateTrend(stats.myBookingsCount),
    },
    {
      title: "Active Requests",
      value: stats.myRequestsCount,
      icon: Wrench,
      color: "#f59e0b",
      bg: "#fffbeb",
      href: "/dashboard/maintenance",
      data: generateTrend(stats.myRequestsCount),
    },
    {
      title: "Pending Returns",
      value: stats.upcomingReturnsCount,
      icon: Clock,
      color: "#ef4444",
      bg: "#fef2f2",
      href: "/dashboard/allocations",
      data: generateTrend(stats.upcomingReturnsCount),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "'Inter', sans-serif" }}>

      {/* Hero */}
      <div className="animate-fade-up">
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Employee Portal
        </p>
        <h1 className="page-title" style={{ margin: "4px 0 0 0" }}>{greeting}</h1>
        <p className="page-subtitle">Here's everything assigned to you right now</p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={i}
              href={kpi.href}
              className={`kpi-card animate-fade-up delay-${i * 100}`}
              style={{ textDecoration: "none" }}
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
              <div style={{ height: "36px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpi.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`eg-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={kpi.color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={1.5} fill={`url(#eg-${i})`} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Tap to view</span>
                <ArrowRight size={11} color="#d1d5db" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* My Assets + Bookings */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>

        {/* My Assigned Assets */}
        <div
          className="animate-fade-up delay-200"
          style={{ background: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "22px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Boxes size={15} color="#92E4BA" />
              <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>My Assets</h3>
            </div>
            <Link href="/dashboard/assets" style={{ fontSize: "0.72rem", color: "#1a7a4e", fontWeight: 600, textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {myAssets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                <Package size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />
                No assets assigned to you
              </div>
            ) : (
              myAssets.slice(0, 4).map((alloc: any) => (
                <div
                  key={alloc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    background: "#fafafa",
                    borderRadius: "9px",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#e8faf3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Boxes size={14} color="#1a7a4e" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {alloc.asset?.name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "1px" }}>
                      {alloc.asset?.tag}
                    </div>
                  </div>
                  <span className="status-badge status-approved">Active</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div
          className="animate-fade-up delay-300"
          style={{ background: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "22px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={15} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Upcoming Bookings</h3>
            </div>
            <Link href="/dashboard/bookings" style={{ fontSize: "0.72rem", color: "#1a7a4e", fontWeight: 600, textDecoration: "none" }}>
              Manage →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {myBookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                <Calendar size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />
                No upcoming bookings
              </div>
            ) : (
              myBookings.slice(0, 4).map((booking: any) => (
                <div
                  key={booking.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    background: "#fafafa",
                    borderRadius: "9px",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={14} color="#6366f1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {booking.asset?.name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "1px" }}>
                      {new Date(booking.startTime).toLocaleDateString()} — {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className="status-badge status-upcoming">Soon</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Requests */}
      <div
        className="animate-fade-up delay-400"
        style={{ background: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "22px" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Wrench size={15} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>My Maintenance Requests</h3>
          </div>
          <Link href="/dashboard/maintenance" style={{ fontSize: "0.72rem", color: "#1a7a4e", fontWeight: 600, textDecoration: "none" }}>
            File new request →
          </Link>
        </div>
        {myRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.825rem" }}>
            <CheckCircle2 size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />
            No open maintenance requests
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
            {myRequests.slice(0, 4).map((req: any) => (
              <div
                key={req.id}
                style={{
                  padding: "12px 14px",
                  background: "#fafafa",
                  borderRadius: "10px",
                  border: "1px solid #f0f0f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#111827" }}>
                    {req.asset?.name}
                  </span>
                  <span className={`status-badge priority-${req.priority?.toLowerCase()}`}>
                    {req.priority}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.4 }}>
                  {req.description?.slice(0, 80)}{req.description?.length > 80 ? "..." : ""}
                </p>
                <span className={`status-badge status-${req.status?.toLowerCase()}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

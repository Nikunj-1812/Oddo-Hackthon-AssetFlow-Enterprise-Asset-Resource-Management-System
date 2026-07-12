"use client";

import Link from "next/link";
import { 
  Building2, Users, Boxes, AlertCircle, CalendarDays, 
  ArrowRight, BadgeInfo, CheckCircle
} from "lucide-react";

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

export default function DepartmentHeadDashboard({ deptName, stats, assets, employees }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontFamily: "'Inter', sans-serif" }}>
      {/* Overview Banner */}
      <div 
        style={{ 
          backgroundColor: "#ffffff", 
          padding: "1.5rem 2rem", 
          borderRadius: "16px", 
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#111827" }}>
          Department Head Portal: {deptName}
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
          Monitor your department's active equipment footprint, allocate team schedules, and review defect ticket requests.
        </p>
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
          { title: "Allocated Department Assets", val: stats.departmentAssetsCount, icon: Boxes, color: "#92E4BA" },
          { title: "Total Inventory Value", val: `$${stats.totalAssetsCost.toLocaleString()}`, icon: Building2, color: "#10b981" },
          { title: "Department Personnel", val: stats.employeesCount, icon: Users, color: "#3b82f6" },
          { title: "Active Department Requests", val: stats.activeRequestsCount, icon: AlertCircle, color: "#ef4444" },
          { title: "Upcoming Return Cycles", val: stats.upcomingReturnsCount, icon: CalendarDays, color: "#f59e0b" },
          { title: "Active Personnel Bookings", val: stats.bookingOverviewCount, icon: CalendarDays, color: "#8b5cf6" },
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
                <h3 style={{ margin: "6px 0 0 0", fontSize: "1.4rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
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
        {/* Department Inventory List */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Department Equipment</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {assets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "#9ca3af", fontSize: "0.8rem" }}>
                No assets currently allocated to this department.
              </div>
            ) : (
              assets.slice(0, 5).map((asset) => (
                <div key={asset.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>[{asset.tag}] {asset.name}</span>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>Condition: {asset.condition}</div>
                  </div>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "#e0e7ff", color: "#3730a3", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>
                    {asset.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Members List */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Department Roster</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {employees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "#9ca3af", fontSize: "0.8rem" }}>
                No team personnel assigned yet.
              </div>
            ) : (
              employees.slice(0, 5).map((emp) => (
                <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{emp.name}</span>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>{emp.email}</div>
                  </div>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "#ecfdf5", color: "#065f46", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>
                    {emp.role.replace("_", " ")}
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

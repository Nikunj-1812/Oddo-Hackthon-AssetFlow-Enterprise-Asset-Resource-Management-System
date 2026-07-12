"use client";

import Link from "next/link";
import { 
  Boxes, CalendarCheck, Wrench, AlertTriangle, 
  ArrowRight, PlusCircle, CalendarDays, Clock
} from "lucide-react";

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

export default function EmployeeDashboard({ stats, myAssets, myBookings, myRequests }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontFamily: "'Inter', sans-serif" }}>
      {/* Welcome Banner */}
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
          Employee Operations Desk
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
          Manage your assigned hardware workspace checklist, schedule resources, and report broken gear.
        </p>
      </div>

      {/* KPI Grid */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
          gap: "1.5rem" 
        }}
      >
        {[
          { title: "My Assigned Assets", val: stats.myAssetsCount, icon: Boxes, color: "#92E4BA" },
          { title: "My Resource Bookings", val: stats.myBookingsCount, icon: CalendarCheck, color: "#10b981" },
          { title: "My Defect Tickets", val: stats.myRequestsCount, icon: Wrench, color: "#8b5cf6" },
          { title: "Upcoming Return Handbacks", val: stats.upcomingReturnsCount, icon: AlertTriangle, color: "#f59e0b" },
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
                <h3 style={{ margin: "6px 0 0 0", fontSize: "1.5rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
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
        {/* Quick Operations */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Quick Operations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link 
              href="/dashboard/bookings" 
              style={{ display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><CalendarDays size={16} style={{ color: "#7cd4a5" }} /> Book Shared Workspace / Vehicle</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
            <Link 
              href="/dashboard/maintenance" 
              style={{ display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><Wrench size={16} style={{ color: "#7cd4a5" }} /> File Defect Report</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
          </div>
        </div>

        {/* My Assets */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>My Assigned Inventory</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {myAssets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "#9ca3af", fontSize: "0.8rem" }}>
                No assets currently assigned to you.
              </div>
            ) : (
              myAssets.map((alloc) => (
                <div key={alloc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>[{alloc.asset.tag}] {alloc.asset.name}</span>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>
                      Expected Return: {alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : "Indefinite"}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "#ecfdf5", color: "#047857", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>
                    Active
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

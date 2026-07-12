"use client";

import Link from "next/link";
import { 
  Boxes, BadgeCheck, AlertTriangle, RefreshCw, Wrench, 
  Trash2, ArrowRight, PlusCircle, CheckCircle
} from "lucide-react";

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

export default function ManagerDashboard({ stats, nearRetirementList }: Props) {
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
          Inventory Management Operations
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
          Track warehouse check-outs, schedule preventative repair runs, and dispose of depreciated assets.
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
          { title: "Available Inventory", val: stats.availableAssets, icon: Boxes, color: "#92E4BA" },
          { title: "Allocated Stock", val: stats.allocatedAssets, icon: BadgeCheck, color: "#3b82f6" },
          { title: "Pending Handovers", val: stats.pendingTransfers, icon: RefreshCw, color: "#6366f1" },
          { title: "Pending Returns", val: stats.pendingReturns, icon: AlertTriangle, color: "#f59e0b" },
          { title: "Active Maintenance Runs", val: stats.pendingMaintenanceCount, icon: Wrench, color: "#8b5cf6" },
          { title: "Near Retirement", val: stats.assetsNearRetirementCount, icon: Trash2, color: "#ef4444" },
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
        {/* Quick Operations */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Quick Operations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link 
              href="/dashboard/assets" 
              style={{ display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><PlusCircle size={16} style={{ color: "#7cd4a5" }} /> Register New Asset</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
            <Link 
              href="/dashboard/allocations" 
              style={{ display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><BadgeCheck size={16} style={{ color: "#7cd4a5" }} /> Allocate Asset to Staff</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
            <Link 
              href="/dashboard/allocations" 
              style={{ display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><RefreshCw size={16} style={{ color: "#7cd4a5" }} /> Process Return Condition Checks</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
            <Link 
              href="/dashboard/maintenance" 
              style={{ display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "10px", textDecoration: "none", color: "#374151", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "#fafafa", transition: "all 0.2s" }}
              className="quick-action-link"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}><Wrench size={16} style={{ color: "#7cd4a5" }} /> Approve Maintenance & Assign Techs</span>
              <ArrowRight size={14} style={{ color: "#6b7280" }} />
            </Link>
          </div>
        </div>

        {/* Depreciated / Near Retirement Watchlist */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Depreciation Alert board</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {nearRetirementList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "#9ca3af", fontSize: "0.8rem" }}>
                All active inventory is in optimal condition.
              </div>
            ) : (
              nearRetirementList.map((asset) => (
                <div 
                  key={asset.id} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "10px 14px", 
                    backgroundColor: "#fef2f2", 
                    border: "1px solid #fee2e2", 
                    borderRadius: "10px",
                    fontSize: "0.825rem"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: "#b91c1c" }}>[{asset.tag}]</span> <strong style={{ color: "#111827" }}>{asset.name}</strong>
                    <div style={{ fontSize: "0.72rem", color: "#991b1b", marginTop: "2px" }}>Condition: {asset.condition}</div>
                  </div>
                  <Link href="/dashboard/assets" style={{ fontSize: "0.78rem", color: "#b91c1c", fontWeight: 700, textDecoration: "none" }}>
                    Lifecycle History →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

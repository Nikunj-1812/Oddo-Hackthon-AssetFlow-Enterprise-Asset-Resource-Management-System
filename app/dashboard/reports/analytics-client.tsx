"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  TrendingUp, TrendingDown, ClipboardCheck, AlertOctagon, Boxes, Wrench, ShieldCheck,
  CalendarDays, Download, Printer, Search, ArrowRight, ShieldAlert,
  Building2, MapPin, Tag, Briefcase, UserCheck, RefreshCw, BarChart2, Activity,
  Filter, Calendar, DollarSign, FileSpreadsheet, Sparkles,
  Inbox, Award, ShieldX, Hourglass, Clock
} from "lucide-react";

const getInsightIcon = (id: string) => {
  const size = 15;
  switch (id) {
    case "idle":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#f3f4f6", color: "#4b5563" }}>
          <Inbox size={size} />
        </div>
      );
    case "warranty30":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#fff7ed", color: "#ea580c" }}>
          <Clock size={size} />
        </div>
      );
    case "warrantyExp":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#fef2f2", color: "#ef4444" }}>
          <ShieldX size={size} />
        </div>
      );
    case "mntSpike":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#fff7ed", color: "#ea580c" }}>
          <TrendingUp size={size} />
        </div>
      );
    case "overdue":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#fef2f2", color: "#ef4444" }}>
          <Hourglass size={size} />
        </div>
      );
    case "nearRet":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb" }}>
          <TrendingDown size={size} />
        </div>
      );
    case "critMnt":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#fef2f2", color: "#dc2626" }}>
          <AlertOctagon size={size} />
        </div>
      );
    case "topDept":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#e8faf3", color: "#10b981" }}>
          <Award size={size} />
        </div>
      );
    default:
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#f3f4f6", color: "#6b7280" }}>
          <Activity size={size} />
        </div>
      );
  }
};

interface Props {
  totalAssets: number;
  availableAssets: number;
  allocatedAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  disposedAssets: number;
  lostAssets: number;
  nearRetirementCount: number;
  totalAssetValue: number;
  totalOriginalValue: number;
  totalDepreciated: number;
  openMaintenanceCount: number;
  pendingMaintenance: number;
  inProgressMaintenance: number;
  maintenanceThisMonth: number;
  maintenancePct: number;
  bookingsToday: number;
  bookingsThisMonth: number;
  bookingsPct: number;
  pendingTransfers: number;
  transfersToday: number;
  activeAudits: number;
  warrantyExpired: number;
  warrantyExpiring30: number;
  warrantyExpiring90: number;
  warrantyActive: number;

  registrationTrend: any[];
  allocationTrend: any[];
  maintenanceTrend: any[];
  bookingsTrend: any[];
  transferTrend: any[];

  statusDistribution: any[];
  categoryBreakdown: any[];
  conditionBreakdown: any[];
  warrantyBreakdown: any[];
  departmentPerformance: any[];
  vendorBreakdown: any[];
  locationBreakdown: any[];
  ageDistribution: any[];
  maintenancePriorityBreakdown: any[];
  transferStatusBreakdown: any[];
  topBookedAssets: any[];
  topMaintainedAssets: any[];

  sparkAssets: any[];
  sparkMaintenance: any[];
  sparkBookings: any[];

  aiInsights: any[];
  combinedTimeline: any[];
  overdueAllocations: any[];
}

const COLORS = ["#6ecfa3", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#10b981", "#3b82f6"];

export default function AnalyticsClient(props: Props) {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "comparison" | "timeline" | "reports">("overview");
  const [compType, setCompType] = useState<"dept" | "cat" | "vendor">("dept");
  const [activeReport, setActiveReport] = useState<"summary" | "maintenance" | "financial" | "warranty">("summary");

  const filteredRegTrend = useMemo(() => {
    if (dateRange === "6m") return props.registrationTrend.slice(-6);
    if (dateRange === "3m") return props.registrationTrend.slice(-3);
    return props.registrationTrend;
  }, [props.registrationTrend, dateRange]);

  const filteredMntTrend = useMemo(() => {
    if (dateRange === "6m") return props.maintenanceTrend.slice(-6);
    if (dateRange === "3m") return props.maintenanceTrend.slice(-3);
    return props.maintenanceTrend;
  }, [props.maintenanceTrend, dateRange]);

  const filteredCategories = useMemo(() => {
    return props.categoryBreakdown.filter(cat => 
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [props.categoryBreakdown, search]);

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...data.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => { window.print(); };

  const cardStyle = {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    minWidth: "220px",
    position: "relative" as const,
    overflow: "hidden" as const
  };

  const getInsightIcon = (id: string) => {
    const size = 16;
    switch (id) {
      case "idle":
        return <Boxes size={size} style={{ color: "#4b5563" }} />;
      case "warranty30":
        return <ShieldCheck size={size} style={{ color: "#2563eb" }} />;
      case "warrantyExp":
        return <ShieldAlert size={size} style={{ color: "#d97706" }} />;
      case "mntSpike":
        return <Wrench size={size} style={{ color: "#ea580c" }} />;
      case "overdue":
        return <CalendarDays size={size} style={{ color: "#ef4444" }} />;
      case "nearRet":
        return <TrendingDown size={size} style={{ color: "#7c3aed" }} />;
      case "critMnt":
        return <AlertOctagon size={size} style={{ color: "#e11d48" }} />;
      case "topDept":
        return <Building2 size={size} style={{ color: "#4f46e5" }} />;
      default:
        return <Activity size={size} style={{ color: "#6b7280" }} />;
    }
  };

  const getInsightIconBg = (id: string) => {
    switch (id) {
      case "idle": return "#f3f4f6";
      case "warranty30": return "#eff6ff";
      case "warrantyExp": return "#fffbeb";
      case "mntSpike": return "#fff7ed";
      case "overdue": return "#fef2f2";
      case "nearRet": return "#f5f3ff";
      case "critMnt": return "#fff5f5";
      case "topDept": return "#e0e7ff";
      default: return "#f9fafb";
    }
  };

  const getInsightIconBorder = (id: string) => {
    switch (id) {
      case "idle": return "#e5e7eb";
      case "warranty30": return "#bfdbfe";
      case "warrantyExp": return "#fde68a";
      case "mntSpike": return "#ffedd5";
      case "overdue": return "#fee2e2";
      case "nearRet": return "#ddd6fe";
      case "critMnt": return "#feb2b2";
      case "topDept": return "#c7d2fe";
      default: return "#f3f4f6";
    }
  };

  const trendBadge = (pct: number) => {
    const isUp = pct >= 0;
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "0.72rem", fontWeight: 700, color: isUp ? "#10b981" : "#ef4444", backgroundColor: isUp ? "#e6fbf3" : "#fef2f2", padding: "2px 6px", borderRadius: "6px" }}>
        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {Math.abs(pct)}%
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER CONTROL BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "8px", background: "#f3f4f6", padding: "3px", borderRadius: "9px" }}>
          {(["overview", "comparison", "timeline", "reports"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 14px",
                borderRadius: "7px",
                border: "none",
                fontSize: "0.825rem",
                fontWeight: activeTab === tab ? 700 : 500,
                cursor: "pointer",
                background: activeTab === tab ? "#ffffff" : "transparent",
                color: activeTab === tab ? "#111827" : "#4b5563",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.15s ease",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => exportCSV(props.categoryBreakdown, "category_summary_report")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600, color: "#374151", cursor: "pointer" }}
          >
            <FileSpreadsheet size={13} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "#111827", border: "none", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600, color: "#ffffff", cursor: "pointer" }}
          >
            <Printer size={13} /> Print/PDF
          </button>
        </div>
      </div>

      {/* GLOBAL FILTERS PANEL */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "#ffffff", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6b7280", fontSize: "0.8rem", fontWeight: 600 }}>
          <Filter size={13} /> Filters:
        </div>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.78rem", color: "#374151", outline: "none" }}>
          <option value="all">All Dates</option>
          <option value="6m">Last 6 Months</option>
          <option value="3m">Last 3 Months</option>
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.78rem", color: "#374151", outline: "none" }}>
          <option value="all">All Departments</option>
          {props.departmentPerformance.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.78rem", color: "#374151", outline: "none" }}>
          <option value="all">All Statuses</option>
          {props.statusDistribution.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <div style={{ flex: 1, minWidth: "160px", position: "relative" }}>
          <Search size={12} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Search Categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: "5px 10px 5px 28px", width: "100%", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.78rem", color: "#374151", outline: "none" }}
          />
        </div>
      </div>

      {/* ───────────────── OVERVIEW TAB ───────────────── */}
      {activeTab === "overview" && (
        <>
          {/* KPI Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Available Assets</span>
                <ShieldCheck size={14} color="#059669" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669" }}>{props.availableAssets}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Ready to deploy</span>
                <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700 }}>{Math.round((props.availableAssets/props.totalAssets)*100)}%</span>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Allocated Assets</span>
                <UserCheck size={14} color="#2563eb" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563eb" }}>{props.allocatedAssets}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>With staff / depts</span>
                <span style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: 700 }}>{Math.round((props.allocatedAssets/props.totalAssets)*100)}%</span>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Maintenance Tickets</span>
                <Wrench size={14} color="#d97706" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#d97706" }}>{props.openMaintenanceCount}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                {trendBadge(props.maintenancePct)}
                <div style={{ width: "60px", height: "18px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={props.sparkMaintenance}>
                      <Line type="monotone" dataKey="v" stroke="#d97706" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Bookings Today</span>
                <CalendarDays size={14} color="#6366f1" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6366f1" }}>{props.bookingsToday}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                {trendBadge(props.bookingsPct)}
                <div style={{ width: "60px", height: "18px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={props.sparkBookings}>
                      <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Warranty Expiring</span>
                <ShieldAlert size={14} color="#ef4444" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444" }}>{props.warrantyExpiring30}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 600 }}>Expiring &lt; 30 days</span>
                <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>Expired: {props.warrantyExpired}</span>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Pending Transfers</span>
                <RefreshCw size={14} color="#06b6d4" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#06b6d4" }}>{props.pendingTransfers}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Awaiting approvals</span>
                <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>Today: {props.transfersToday}</span>
              </div>
            </div>
          </div>

          {/* Layer 2: Main Charts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
            
            {/* Registration Capital Growth (Area) */}
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Monthly Registration & Capital Growth</h3>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Historical trends</span>
              </div>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredRegTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6ecfa3" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#6ecfa3" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Capital Value"]} />
                    <Area type="monotone" dataKey="costAdded" stroke="#53ba8d" fillOpacity={1} fill="url(#colorCost)" name="Value (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution (Donut) */}
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Asset Lifecycle status Distribution</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "260px" }}>
                <div style={{ width: "50%", height: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={props.statusDistribution}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={78}
                        paddingAngle={3} dataKey="value"
                      >
                        {props.statusDistribution.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: "45%", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
                  {props.statusDistribution.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.color || COLORS[idx % COLORS.length] }} />
                      <span style={{ color: "#4b5563", fontWeight: 500 }}>{item.name}</span>
                      <strong style={{ color: "#111827", marginLeft: "auto" }}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Maintenance Tickets & Severity */}
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Monthly Maintenance Ticketing</h3>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredMntTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Bar dataKey="total" fill="#f59e0b" name="Total Tickets" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="critical" fill="#ef4444" name="Critical Severity" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Comparison (Horizontal Bar) */}
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Top Departments by Asset Allocation</h3>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={props.departmentPerformance} layout="vertical" margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                    <YAxis dataKey="name" type="category" style={{ fontSize: "0.75rem", fill: "#9ca3af" }} width={80} />
                    <Tooltip formatter={(value: any) => [`${value} assets`, "Total Allocated"]} />
                    <Bar dataKey="assets" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Cost Breakdown */}
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Asset Category Cost vs Count</h3>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredCategories} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Bar dataKey="totalCost" fill="#06b6d4" name="Value (₹)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="count" fill="#8b5cf6" name="Quantity" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Condition Distribution (Radar) */}
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Stock Condition Distribution</h3>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={props.conditionBreakdown}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis dataKey="name" style={{ fontSize: "0.75rem", fill: "#6b7280" }} />
                    <PolarRadiusAxis angle={30} domain={[0, "auto"]} style={{ fontSize: "0.65rem" }} />
                    <Radar name="Assets count" dataKey="value" stroke="#10b981" fill="#6ecfa3" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Layer 3: AI Smart Insights */}
          <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <Sparkles size={16} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>Smart AI Insights & Risks</h3>
              <span style={{ fontSize: "0.7rem", padding: "2px 7px", background: "#e0e7ff", color: "#4f46e5", borderRadius: "6px", fontWeight: 700 }}>Proactive Diagnostics</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {props.aiInsights.map((ins) => (
                <div key={ins.id} style={{ display: "flex", gap: "12px", padding: "12px", background: "#ffffff", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: getInsightIconBg(ins.id), border: `1px solid ${getInsightIconBorder(ins.id)}`, flexShrink: 0 }}>{getInsightIcon(ins.id)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#111827" }}>{ins.title}</span>
                      <span style={{
                        fontSize: "0.62rem", fontWeight: 700, padding: "1px 5px", borderRadius: "4px",
                        background: ins.risk === "CRITICAL" ? "#fef2f2" : ins.risk === "HIGH" ? "#fffbeb" : "#eff6ff",
                        color: ins.risk === "CRITICAL" ? "#ef4444" : ins.risk === "HIGH" ? "#d97706" : "#2563eb"
                      }}>{ins.risk}</span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.72rem", color: "#4b5563", lineHeight: 1.4 }}>{ins.message}</p>
                    <div style={{ marginTop: "6px", fontSize: "0.68rem", color: "#6b7280", borderTop: "1px dashed #e5e7eb", paddingTop: "4px" }}>
                      <strong>Recommendation:</strong> {ins.recommendation}
                    </div>
                  </div>
                </div>
              ))}
              {props.aiInsights.length === 0 && (
                <div style={{ textAlign: "center", color: "#9ca3af", gridColumn: "1/-1", padding: "1.5rem" }}>No critical diagnostic insights detected. System health is optimal!</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ───────────────── COMPARISON TAB ───────────────── */}
      {activeTab === "comparison" && (
        <div style={{ background: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Comparative Business Intelligence Matrix</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#6b7280" }}>Benchmark departments, vendors and locations side by side</p>
            </div>
            <div style={{ display: "flex", gap: "6px", background: "#f3f4f6", padding: "3px", borderRadius: "8px" }}>
              {(["dept", "cat", "vendor"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setCompType(type)}
                  style={{
                    padding: "5px 12px", border: "none", borderRadius: "6px", fontSize: "0.75rem", fontWeight: compType === type ? 700 : 500,
                    background: compType === type ? "#ffffff" : "transparent", color: compType === type ? "#111827" : "#4b5563", cursor: "pointer",
                    boxShadow: compType === type ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  {type === "dept" ? "Departments" : type === "cat" ? "Categories" : "Vendors"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", flexWrap: "wrap" }}>
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Benchmark distribution</h4>
              <div style={{ width: "100%", height: "240px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compType === "dept" ? props.departmentPerformance : compType === "cat" ? props.categoryBreakdown.slice(0, 5) : props.vendorBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" style={{ fontSize: "0.7rem" }} />
                    <YAxis style={{ fontSize: "0.7rem" }} />
                    <Tooltip />
                    <Bar dataKey={compType === "dept" ? "assets" : "count"} fill="#6ecfa3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Financial cost matrix</h4>
              <div style={{ width: "100%", height: "240px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compType === "dept" ? props.departmentPerformance.map(d=>({name:d.name,value:d.value})) : compType === "cat" ? props.categoryBreakdown.slice(0, 5).map(c=>({name:c.name,value:c.totalCost})) : props.vendorBreakdown.map(v=>({name:v.name,value:v.value}))}
                      cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name}) => name ? String(name).slice(0, 8) : ""}
                    >
                      {(compType === "dept" ? props.departmentPerformance : compType === "cat" ? props.categoryBreakdown : props.vendorBreakdown).map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── TIMELINE TAB ───────────────── */}
      {activeTab === "timeline" && (
        <div style={{ background: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Global activity logs timeline</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "10px" }}>
            {props.combinedTimeline.map((log) => (
              <div key={log.id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={14} color="#6b7280" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#111827" }}>{log.action}</span>
                    <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>
                    Category: <strong>{log.targetType}</strong> · Target ID: {log.targetId || log.id}
                  </div>
                </div>
              </div>
            ))}
            {props.combinedTimeline.length === 0 && (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>No activity logs recorded.</div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────── REPORTS TAB ───────────────── */}
      {activeTab === "reports" && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {(["summary", "maintenance", "financial", "warranty"] as const).map(rep => (
              <button
                key={rep}
                onClick={() => setActiveReport(rep)}
                style={{
                  padding: "10px 14px", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "0.8rem", fontWeight: activeReport === rep ? 700 : 500,
                  background: activeReport === rep ? "#6ecfa320" : "transparent", color: activeReport === rep ? "#1a4a2e" : "#4b5563", cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {rep === "summary" ? "📋 Asset Summary Report" : rep === "maintenance" ? "🔧 Maintenance Operations" : rep === "financial" ? "💰 Financials & Value" : "🛡️ Warranty Expiry Log"}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: "360px", background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
            {activeReport === "summary" && (
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Category Inventory Summary</h4>
                <div className="erp-table-container">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>In Stock</th>
                        <th>Allocated</th>
                        <th>Available</th>
                        <th>Estimated Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.categoryBreakdown.map((cat, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>{cat.name}</td>
                          <td>{cat.count}</td>
                          <td>{cat.allocated}</td>
                          <td>{cat.available}</td>
                          <td>₹{cat.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeReport === "maintenance" && (
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Top Repeat Repair Assets</h4>
                <div className="erp-table-container">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Asset Name</th>
                        <th>Total Repair Request Tickets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.topMaintainedAssets.map((ast, idx) => (
                        <tr key={idx}>
                          <td><span className="monospace-tag">{ast.tag}</span></td>
                          <td>{ast.name}</td>
                          <td style={{ fontWeight: 700, color: "#d97706" }}>{ast.count}</td>
                        </tr>
                      ))}
                      {props.topMaintainedAssets.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center", color: "#9ca3af", padding: "1.5rem" }}>No repeat repair assets identified.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeReport === "financial" && (
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Financial Summary</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "1.5rem" }}>
                  <div style={{ padding: "12px", background: "#f9fafb", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700 }}>Original acquisition cost</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginTop: "4px" }}>₹{props.totalOriginalValue.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: "12px", background: "#f9fafb", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700 }}>Net book value</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>₹{props.totalAssetValue.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: "12px", background: "#f9fafb", borderRadius: "10px" }}>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700 }}>Accumulated depreciation</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>₹{props.totalDepreciated.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {activeReport === "warranty" && (
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>Overdue Return Allocations</h4>
                <div className="erp-table-container">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Asset Name</th>
                        <th>Assigned User</th>
                        <th>Expected Return Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.overdueAllocations.map((al) => (
                        <tr key={al.id}>
                          <td><span className="monospace-tag">{al.assetTag}</span></td>
                          <td>{al.assetName}</td>
                          <td>{al.userName}</td>
                          <td style={{ color: "#ef4444", fontWeight: 700 }}>{new Date(al.expectedReturnDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {props.overdueAllocations.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", color: "#9ca3af", padding: "1.5rem" }}>No overdue return requests active.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

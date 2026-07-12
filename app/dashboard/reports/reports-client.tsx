"use client";

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend, 
  PieChart, Pie, Cell 
} from "recharts";
import { Boxes, AlertTriangle } from "lucide-react";

interface Props {
  statusData: any[];
  categoryCostData: any[];
  departmentData: any[];
  maintenancePriorityData: any[];
  growthData: any[];
  overdueAllocations: any[];
  idleAssets: any[];
}

const COLORS = ["#92E4BA", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD

export default function ReportsClient({
  statusData,
  categoryCostData,
  departmentData,
  maintenancePriorityData,
  growthData,
  overdueAllocations,
  idleAssets,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      
      {/* FIRST ROW: Registration Growth area chart & Status donut chart */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "2rem" }}>
        
        {/* Registration growth area chart */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
            Monthly Registration & Capital Growth
          </h3>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#92E4BA" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#92E4BA" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                <Tooltip />
                <Area type="monotone" dataKey="costAdded" stroke="#7cd4a5" fillOpacity={1} fill="url(#colorCost)" name="Acquisitions Cost ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status donut chart */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
            Asset Deployment Status Distribution
          </h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "260px" }}>
            <div style={{ width: "50%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.length === 0 ? [{ name: "No Data", value: 1 }] : statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Donut Legend */}
            <div style={{ width: "45%", display: "flex", flexDirection: "column", gap: "8px" }}>
              {statusData.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span style={{ color: "#4b5563", fontWeight: 500 }}>{item.name}:</span>
                  <strong style={{ color: "#111827" }}>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW: Category Cost bar chart & Departmental count bar chart */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "2rem" }}>
        
        {/* Category Cost bar chart */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
            Capital Investments per Asset Category
          </h3>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryCostData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                <Tooltip formatter={(value: any) => [value !== undefined ? `$${Number(value).toLocaleString()}` : "$0", "Total Value"]} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Inventory Value ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department count comparisons */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
            Department Footprint (Allocations vs Headcount)
          </h3>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fill: "#9ca3af" }} />
                <Tooltip />
                <Legend style={{ fontSize: "0.8rem" }} />
                <Bar dataKey="assets" fill="#92E4BA" name="Assets Held" radius={[4, 4, 0, 0]} />
                <Bar dataKey="personnel" fill="#a78bfa" name="Total Personnel" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* THIRD ROW: Idle Assets & Overdue Returns rosters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "2rem" }}>
        
        {/* Overdue Allocations Watchlist */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <AlertTriangle size={18} style={{ color: "#ef4444" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
              Overdue Returns Escalation Board
            </h3>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                  <th style={{ padding: "8px" }}>Asset Tag</th>
                  <th style={{ padding: "8px" }}>Holder</th>
                  <th style={{ padding: "8px" }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {overdueAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af" }}>
                      No overdue handovers. Excellent!
                    </td>
                  </tr>
                ) : (
                  overdueAllocations.map((alloc) => (
                    <tr key={alloc.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px", fontWeight: 700, color: "#ef4444" }}>{alloc.asset.tag}</td>
                      <td style={{ padding: "8px" }}>{alloc.user?.name || "Dept Assignment"}</td>
                      <td style={{ padding: "8px", color: "#6b7280" }}>
                        {alloc.expectedReturnDate ? fmtDate(alloc.expectedReturnDate) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Idle Assets List */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Boxes size={18} style={{ color: "#10b981" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
              Idle Warehoused Equipment
            </h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                  <th style={{ padding: "8px" }}>Asset Tag</th>
                  <th style={{ padding: "8px" }}>Asset Name</th>
                  <th style={{ padding: "8px" }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {idleAssets.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af" }}>
                      No idle warehoused stock.
                    </td>
                  </tr>
                ) : (
                  idleAssets.map((asset) => (
                    <tr key={asset.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px", fontWeight: 700, color: "#047857" }}>{asset.tag}</td>
                      <td style={{ padding: "8px" }}>{asset.name}</td>
                      <td style={{ padding: "8px", color: "#6b7280" }}>{asset.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

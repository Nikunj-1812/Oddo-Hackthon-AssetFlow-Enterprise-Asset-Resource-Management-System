"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, CalendarRange, Wrench, Boxes, Filter, Search, ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  assets: any[];
  bookings: any[];
  categories: any[];
  departments: any[];
}

export default function AvailabilityClient({ assets, bookings, categories, departments }: Props) {
  // Filter states
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [locFilter, setLocFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  
  // Date Timeline states (Start date of the 7-day display)
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Generate 7 days for the timeline headers
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  }, [startDate]);

  const handlePrevWeek = () => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() - 7);
    setStartDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + 7);
    setStartDate(d);
  };

  const handleToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setStartDate(d);
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          asset.tag.toLowerCase().includes(search.toLowerCase());
      const matchCat = !catFilter || asset.categoryId === catFilter;
      const matchLoc = !locFilter || asset.location.toLowerCase() === locFilter.toLowerCase();
      
      // For department filter, check if any active allocation matches
      const activeAlloc = asset.allocations?.[0];
      const matchDept = !deptFilter || activeAlloc?.departmentId === deptFilter;

      return matchSearch && matchCat && matchLoc && matchDept;
    });
  }, [assets, search, catFilter, locFilter, deptFilter]);

  // Status statistics for filtered assets
  const stats = useMemo(() => {
    let avail = 0;
    let bkd = 0;
    let alloc = 0;
    let maint = 0;

    filteredAssets.forEach((a) => {
      if (a.status === "AVAILABLE") avail++;
      else if (a.status === "ALLOCATED") alloc++;
      else if (a.status === "UNDER_MAINTENANCE") maint++;
      else bkd++; // includes RESERVED, etc.
    });

    return { avail, bkd, alloc, maint, total: filteredAssets.length };
  }, [filteredAssets]);

  // Determine availability status of an asset on a specific day
  const getAssetDayStatus = (asset: any, day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    // 1. Check Maintenance
    if (asset.status === "UNDER_MAINTENANCE") {
      return { label: "Maintenance", bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" };
    }

    // 2. Check Allocations (Asset allocated to department/user)
    if (asset.status === "ALLOCATED") {
      return { label: "Allocated", bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" };
    }

    // 3. Check Bookings on this day
    const dayBooking = bookings.find((b) => {
      if (b.assetId !== asset.id) return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart <= dayEnd && bEnd >= dayStart;
    });

    if (dayBooking) {
      return { label: `Booked by ${dayBooking.user?.name || "Staff"}`, bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
    }

    // 4. Fallback is Available
    return { label: "Available", bg: "#e8faf3", color: "#047857", border: "#a7f3d0" };
  };

  // Distinct locations for filters
  const locations = useMemo(() => {
    return Array.from(new Set(assets.map((a) => a.location))).filter(Boolean);
  }, [assets]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontFamily: "'Inter', sans-serif" }}>
      
      {/* FILTER CONTROLS */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "#ffffff", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6b7280", fontSize: "0.825rem", fontWeight: 600 }}>
          <Filter size={14} /> Filters:
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.825rem", outline: "none", color: "#374151" }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.825rem", outline: "none", color: "#374151" }}>
          <option value="">All Locations</option>
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.825rem", outline: "none", color: "#374151" }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        
        <div style={{ flex: 1, minWidth: "180px", position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Search resources by tag or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: "6px 12px 6px 30px", width: "100%", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.825rem", outline: "none", color: "#374151" }}
          />
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
        {[
          { label: "Available Now", value: stats.avail, icon: ShieldCheck, color: "#059669", bg: "#e8faf3" },
          { label: "Booked Slots", value: stats.bkd, icon: CalendarRange, color: "#2563eb", bg: "#eff6ff" },
          { label: "Allocated", value: stats.alloc, icon: Boxes, color: "#d97706", bg: "#ffedd5" },
          { label: "Maintenance Issues", value: stats.maint, icon: Wrench, color: "#dc2626", bg: "#fef2f2" }
        ].map((item, idx) => (
          <div key={idx} style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <item.icon size={20} color={item.color} />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginTop: "2px" }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* LIVE TIMELINE GRID */}
      <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        
        {/* Timeline Header Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>Resource Booking Schedule</h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#6b7280" }}>Live 7-day calendar timeline showing resource blockages</p>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={handlePrevWeek} style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#ffffff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={14} />
            </button>
            <button onClick={handleToday} style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#ffffff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>
              Today
            </button>
            <button onClick={handleNextWeek} style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#ffffff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Timeline Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#4b5563", width: "160px" }}>Resource</th>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#4b5563", width: "100px" }}>Category</th>
                {days.map((day) => {
                  const isToday = new Date().toDateString() === day.toDateString();
                  return (
                    <th key={day.toISOString()} style={{ padding: "12px 6px", fontWeight: 800, color: isToday ? "#15803d" : "#4b5563", textAlign: "center", background: isToday ? "#f0faf5" : "transparent" }}>
                      <div style={{ fontSize: "0.68rem", textTransform: "uppercase" }}>{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>{day.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: "#111827" }}>{asset.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "monospace", marginTop: "2px" }}>{asset.tag}</div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#6b7280" }}>
                    {asset.category?.name || "Other"}
                  </td>
                  {days.map((day) => {
                    const status = getAssetDayStatus(asset, day);
                    return (
                      <td key={day.toISOString()} style={{ padding: "8px 4px", textAlign: "center" }}>
                        <div
                          title={`${asset.name}: ${status.label}`}
                          style={{
                            padding: "8px 4px",
                            borderRadius: "6px",
                            backgroundColor: status.bg,
                            color: status.color,
                            border: `1.5px solid ${status.border}`,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            cursor: "help",
                            textAlign: "center"
                          }}
                        >
                          {status.label.split(" ")[0]}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "#9ca3af", padding: "3rem" }}>
                    No matching resources found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

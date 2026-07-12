"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createAuditCycle, verifyAuditItem, closeAuditCycle, updateAuditCycleAuditors } from "@/features/audits/actions";
import {
  ClipboardCheck,
  MapPin,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertOctagon,
  RefreshCw,
  XCircle,
  FileSpreadsheet,
  Plus,
  Lock,
  ChevronRight,
  Package,
  User,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  cycles: any[];
  locations: string[];
  allUsers: any[];
  currentUser: any;
}

export default function AuditsClient({ cycles, locations, allUsers = [], currentUser }: Props) {
  const [selectedCycle, setSelectedCycle] = useState<any | null>(null);

  // Re-assign auditors state
  const [editingAuditors, setEditingAuditors] = useState(false);
  const [selectedAuditorIds, setSelectedAuditorIds] = useState<string[]>([]);

  // Form states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const role = currentUser?.role || "EMPLOYEE";
  const isManagerOrAdmin = ["ADMIN", "ASSET_MANAGER"].includes(role);

  // Compute Checker metrics
  const checkerCycles = cycles.filter((c) => {
    if (isManagerOrAdmin) return true;
    const ids = c.auditorIds ? c.auditorIds.split(",") : [];
    return ids.includes(currentUser?.id);
  });

  const stats = {
    assigned: checkerCycles.length,
    pending: checkerCycles.filter(c => c.status === "ACTIVE").length,
    completed: checkerCycles.filter(c => c.status === "CLOSED").length,
  };

  const handleCreateCycle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("End Date cannot be earlier than Start Date.");
      setSubmitting(false);
      return;
    }

    const result = await createAuditCycle(formData);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubmitting(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleVerifyItem = async (itemId: string, status: "VERIFIED" | "MISSING" | "DAMAGED") => {
    setError(null);
    const notes = prompt(`Enter optional audit verification notes:`) || "";
    const result = await verifyAuditItem(itemId, status, notes);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Item verified successfully");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleCloseCycle = async (cycleId: string) => {
    if (!confirm("Are you sure you want to close this cycle? This will lock all checklist runs and resolve discrepancies.")) return;
    setError(null);
    const result = await closeAuditCycle(cycleId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Audit cycle closed and locked!");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleUpdateCheckers = async () => {
    if (!selectedCycle) return;
    const result = await updateAuditCycleAuditors(selectedCycle.id, selectedAuditorIds);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Checkers updated successfully.");
      setEditingAuditors(false);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const exportChecklistCSV = () => {
    if (!selectedCycle) return;
    const headers = ["Asset Tag", "Asset Name", "Serial Number", "Verified Status", "Verified By", "Notes"];
    const rows = selectedCycle.items.map((i: any) => [
      i.asset.tag,
      i.asset.name,
      i.asset.serialNumber || "—",
      i.verifiedStatus,
      i.verifiedBy?.name || "Pending",
      i.notes || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any[]) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `checklist_${selectedCycle.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find active cycle detail
  const activeCycleDetail = cycles.find((c) => c.id === selectedCycle?.id);
  const cycleAuditorIds = activeCycleDetail?.auditorIds ? activeCycleDetail.auditorIds.split(",") : [];
  const assignedCheckers = allUsers.filter(u => cycleAuditorIds.includes(u.id));

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
      
      {/* AUDITOR DASHBOARD STATISTICS GRID */}
      <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
        {[
          { title: "My Assigned Audits", value: stats.assigned, desc: "Total cycles assigned for checkout", bg: "#eff6ff", color: "#2563eb" },
          { title: "Pending Verifications", value: stats.pending, desc: "Active verification runs needing review", bg: "#fffbeb", color: "#d97706" },
          { title: "Completed Cycles", value: stats.completed, desc: "Archived audit cycle records", bg: "#e8faf3", color: "#059669" }
        ].map((item, idx) => (
          <div key={idx} style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{item.title}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: item.color, marginTop: "2px" }}>{item.value}</div>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "4px" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* COLUMN 1: Action triggers / New Cycle / Auditor dashboard */}
      <div style={{
        flex: isManagerOrAdmin ? "0 0 680px" : 1,
        display: isManagerOrAdmin ? "grid" : "flex",
        gridTemplateColumns: isManagerOrAdmin ? "1fr 1fr" : undefined,
        flexDirection: isManagerOrAdmin ? undefined : "column",
        gap: "1.5rem"
      }}>
        
        {/* Only Manager/Admin can create cycle */}
        {isManagerOrAdmin ? (
          <Card style={{ border: "1px solid #f0f0f0", borderRadius: "14px", display: "flex", flexDirection: "column" }}>
            <CardHeader style={{ padding: "20px 20px 10px 20px", flexShrink: 0 }}>
              <CardTitle style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
                Start Audit Cycle
              </CardTitle>
              <CardDescription style={{ fontSize: "0.78rem" }}>
                Initialize location-scoped checklist verifications
              </CardDescription>
            </CardHeader>
            <CardContent style={{ padding: "10px 20px 20px 20px", flex: 1 }}>
              <form onSubmit={handleCreateCycle} style={{ display: "flex", flexDirection: "column", gap: "14px", height: "100%", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Cycle Name</label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. Q3 HQ Stock Check"
                      style={{ padding: "9px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", outline: "none", background: "#fafafa" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Select Location Scope</label>
                    <select
                      name="location"
                      required
                      style={{ padding: "9px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", cursor: "pointer", background: "#ffffff" }}
                    >
                      <option value="">-- Choose Location --</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Checker selection checkbox list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Assign Checkers</label>
                    <div style={{ maxHeight: "110px", overflowY: "auto", border: "1.5px solid #e5e7eb", borderRadius: "9px", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {allUsers.map((u) => (
                        <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", cursor: "pointer" }}>
                          <input type="checkbox" name="auditorIds" value={u.id} style={{ width: 14, height: 14 }} />
                          {u.name} ({u.role.replace(/_/g, " ")})
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Start Date</label>
                      <input
                        name="startDate"
                        type="date"
                        required
                        style={{ padding: "9px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", outline: "none", background: "#fafafa" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>End Date</label>
                      <input
                        name="endDate"
                        type="date"
                        required
                        style={{ padding: "9px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", outline: "none", background: "#fafafa" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                  {error && (
                    <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "0.78rem" }}>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "8px", fontSize: "0.78rem" }}>
                      ✓ Audit cycle created checklist!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "10px",
                      borderRadius: "9px",
                      border: "none",
                      backgroundColor: "#6ecfa3",
                      color: "#1a4a2e",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.825rem",
                      boxShadow: "0 4px 10px rgba(146,228,186,0.25)",
                      width: "100%"
                    }}
                  >
                    {submitting ? "Bootstrapping..." : "Start Scoped Audit"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "16px", borderRadius: "12px", display: "flex", gap: "10px" }}>
            <AlertTriangle color="#2563eb" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#1e3a8a" }}>Checker Access Active</div>
              <div style={{ fontSize: "0.75rem", color: "#1e40af", marginTop: "3px", lineHeight: 1.4 }}>
                You are logged in as an Auditor checker. Select your assigned cycles from the menu to record stock presence.
              </div>
            </div>
          </div>
        )}

        {/* COLUMN 2: Cycles list */}
        <Card style={{ border: "1px solid #f0f0f0", borderRadius: "14px", display: "flex", flexDirection: "column", maxHeight: isManagerOrAdmin ? "490px" : undefined }}>
          <CardHeader style={{ padding: "20px 20px 10px 20px", flexShrink: 0 }}>
            <CardTitle style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
              Verification Cycles
            </CardTitle>
            <CardDescription style={{ fontSize: "0.78rem" }}>
              Select a run to track items verification
            </CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "10px 20px 20px 20px", overflowY: "auto", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {checkerCycles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                  No assigned audit runs found.
                </div>
              ) : (
                checkerCycles.map((c) => {
                  const isActive = selectedCycle?.id === c.id;
                  const isClosed = c.status === "CLOSED";
                  return (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedCycle(c); setEditingAuditors(false); }}
                      style={{
                        padding: "12px 14px",
                        border: `1.5px solid ${isActive ? "#6ecfa3" : "#f0f0f0"}`,
                        backgroundColor: isActive ? "#f0faf5" : "#ffffff",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827" }}>
                          {c.name}
                        </span>
                        <span className={`status-badge ${isClosed ? "status-retired" : "status-approved"}`} style={{ padding: "2px 8px", fontSize: "0.68rem" }}>
                          {c.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                        <MapPin size={11} /> Scope: {c.location}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Checklist & Verification details */}
      <div
        style={{
          flex: 2,
          minWidth: "450px",
          backgroundColor: "#ffffff",
          padding: "22px",
          borderRadius: "14px",
          border: "1px solid #f0f0f0"
        }}
      >
        {activeCycleDetail ? (
          <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Header section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f0f0f0", paddingBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>{activeCycleDetail.name}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={12} /> Scope location: <strong>{activeCycleDetail.location}</strong>
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                    <User size={12} /> Assigned Checkers: <strong style={{ color: "#374151" }}>{assignedCheckers.map(u => u.name).join(", ") || "None"}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {isManagerOrAdmin && activeCycleDetail.status === "ACTIVE" && (
                  <button
                    onClick={() => {
                      setSelectedAuditorIds(cycleAuditorIds);
                      setEditingAuditors(!editingAuditors);
                    }}
                    style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#ffffff", color: "#374151", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    Assign Checkers
                  </button>
                )}

                <button
                  onClick={exportChecklistCSV}
                  style={{
                    padding: "8px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FileSpreadsheet size={13} /> Export CSV
                </button>

                {isManagerOrAdmin && activeCycleDetail.status === "ACTIVE" && (
                  <button
                    onClick={() => handleCloseCycle(activeCycleDetail.id)}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 10px rgba(239,68,68,0.2)",
                    }}
                  >
                    <Lock size={12} /> Lock Audit Run
                  </button>
                )}
              </div>
            </div>

            {/* Checker Re-assignment selector */}
            {editingAuditors && (
              <div style={{ background: "#fafafa", padding: "14px", borderRadius: "10px", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>Select Checkers for this Cycle</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {allUsers.map((u) => {
                    const isChecked = selectedAuditorIds.includes(u.id);
                    return (
                      <label key={u.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAuditorIds([...selectedAuditorIds, u.id]);
                            else setSelectedAuditorIds(selectedAuditorIds.filter(id => id !== u.id));
                          }}
                          style={{ width: 14, height: 14 }}
                        />
                        {u.name}
                      </label>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button onClick={() => setEditingAuditors(false)} style={{ padding: "5px 10px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "0.72rem", background: "transparent", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleUpdateCheckers} style={{ padding: "5px 12px", border: "none", borderRadius: "5px", fontSize: "0.72rem", background: "#6ecfa3", color: "#1a4a2e", fontWeight: 700, cursor: "pointer" }}>Save Checkers</button>
                </div>
              </div>
            )}

            {/* Discrepancy report preview if closed */}
            {activeCycleDetail.status === "CLOSED" && (
              <div style={{ background: "#fef2f2", border: "1.5px solid #fee2e2", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertOctagon size={16} color="#dc2626" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#991b1b" }}>Discrepancy Resolution Summary</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#991b1b", lineHeight: 1.4 }}>
                  This cycle has been completed and locked. Missing assets have been flagged as <strong>LOST</strong> in the directory, and damaged items set to <strong>DAMAGED</strong>.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "4px" }}>
                  <div style={{ background: "#ffffff", padding: "8px", borderRadius: "8px", textAlign: "center", border: "1px solid #fca5a5" }}>
                    <div style={{ fontSize: "0.62rem", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>Verified</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a4a2e", marginTop: "2px" }}>
                      {activeCycleDetail.items.filter((i: any) => i.verifiedStatus === "VERIFIED").length}
                    </div>
                  </div>
                  <div style={{ background: "#ffffff", padding: "8px", borderRadius: "8px", textAlign: "center", border: "1px solid #fca5a5" }}>
                    <div style={{ fontSize: "0.62rem", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>Missing (LOST)</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#dc2626", marginTop: "2px" }}>
                      {activeCycleDetail.items.filter((i: any) => i.verifiedStatus === "MISSING").length}
                    </div>
                  </div>
                  <div style={{ background: "#ffffff", padding: "8px", borderRadius: "8px", textAlign: "center", border: "1px solid #fca5a5" }}>
                    <div style={{ fontSize: "0.62rem", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>Damaged</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>
                      {activeCycleDetail.items.filter((i: any) => i.verifiedStatus === "DAMAGED").length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Checklist Table */}
            <div className="erp-table-container">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Asset Name</th>
                    <th>Verified By</th>
                    <th>Verification Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCycleDetail.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                        <Package size={28} style={{ margin: "0 auto 8px", display: "block" }} />
                        No assets found at this location to verify.
                      </td>
                    </tr>
                  ) : (
                    activeCycleDetail.items.map((item: any) => (
                      <tr key={item.id}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "#1a4a2e", background: "#e8faf3", padding: "2px 7px", borderRadius: "5px" }}>
                            {item.asset.tag}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#111827" }}>
                          {item.asset.name}
                        </td>
                        <td style={{ color: "#6b7280" }}>
                          {item.verifiedBy?.name || <span style={{ fontStyle: "italic", color: "#9ca3af" }}>Pending Check</span>}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              item.verifiedStatus === "VERIFIED"
                                ? "status-available"
                                : item.verifiedStatus === "MISSING"
                                ? "status-retired"
                                : "status-pending"
                            }`}
                            style={{ fontSize: "0.68rem" }}
                          >
                            {item.verifiedStatus}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {activeCycleDetail.status === "ACTIVE" ? (
                            <div style={{ display: "inline-flex", gap: "4px" }}>
                              <button
                                onClick={() => handleVerifyItem(item.id, "VERIFIED")}
                                style={{ border: "none", backgroundColor: "#e8faf3", color: "#047857", borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleVerifyItem(item.id, "MISSING")}
                                style={{ border: "none", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Missing
                              </button>
                              <button
                                onClick={() => handleVerifyItem(item.id, "DAMAGED")}
                                style={{ border: "none", backgroundColor: "#fffbeb", color: "#b45309", borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Damage
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: "0.78rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Lock size={12} /> Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              height: "400px",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: "0.85rem",
              gap: "10px",
              textAlign: "center",
            }}
          >
            <ClipboardCheck size={36} style={{ color: "#e5e7eb", marginBottom: "4px" }} />
            <div style={{ fontWeight: 600, color: "#374151" }}>No Cycle Selected</div>
            <div style={{ maxWidth: "250px", color: "#9ca3af", lineHeight: 1.4 }}>
              Select an active audit cycle from the sidebar menu to begin verification checklists
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

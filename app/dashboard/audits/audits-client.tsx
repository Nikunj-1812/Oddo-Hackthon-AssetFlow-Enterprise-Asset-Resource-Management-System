"use client";

import { useState } from "react";
import { createAuditCycle, verifyAuditItem, closeAuditCycle } from "@/features/audits/actions";
import { ClipboardCheck, MapPin, CalendarDays, ArrowRight, ShieldCheck, Check, AlertOctagon, RefreshCw, XCircle, FileSpreadsheet } from "lucide-react";

interface Props {
  cycles: any[];
  locations: string[];
}

export default function AuditsClient({ cycles, locations }: Props) {
  const [selectedCycle, setSelectedCycle] = useState<any | null>(null);

  // Form states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateCycle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
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

  const handleVerifyItem = async (itemId: string, status: any, notes?: string) => {
    const result = await verifyAuditItem(itemId, status, notes);
    if (result?.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
  };

  const handleCloseCycle = async (cycleId: string) => {
    if (!confirm("Are you sure you want to close this audit cycle? This will lock all audit items and update missing items to LOST/DISPOSED.")) return;

    const result = await closeAuditCycle(cycleId);
    if (result?.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
  };

  const exportChecklistCSV = () => {
    if (!activeCycleDetail) return;
    const headers = ["Asset Tag", "Asset Name", "Verified By", "Verified Status", "Notes"];
    const rows = activeCycleDetail.items.map((item: any) => [
      item.asset.tag,
      item.asset.name,
      item.verifiedBy?.name || "-",
      item.verifiedStatus,
      item.notes || "-"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any[]) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_${activeCycleDetail.name.replace(/\s+/g, "_")}_checklist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCycleDetail = cycles.find((c) => c.id === selectedCycle?.id);

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", fontFamily: "'Inter', sans-serif" }}>
      {/* LEFT COLUMN: Create Cycle & Cycles list */}
      <div style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Create Form */}
        <div 
          style={{ 
            backgroundColor: "#ffffff", 
            padding: "1.75rem", 
            borderRadius: "16px", 
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <h2 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
            Initialize Audit Cycle
          </h2>
          <form onSubmit={handleCreateCycle} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Cycle Name / Reference</label>
              <input name="name" required placeholder="e.g. Q3 HQ Furniture Verification" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Scope Location</label>
              <select name="location" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                <option value="">-- Choose Location --</option>
                {locations.map((loc, idx) => (
                  <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Start Date</label>
                <input name="startDate" type="date" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none" }} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>End Date</label>
                <input name="endDate" type="date" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none" }} />
              </div>
            </div>

            {error && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</span>}
            {success && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Audit cycle created checklist!</span>}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "11px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#92E4BA",
                color: "#1e293b",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.85rem",
                boxShadow: "0 4px 10px rgba(146,228,186,0.2)",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Bootstrapping Checklist..." : "Start Scoped Audit"}
            </button>
          </form>
        </div>

        {/* Cycles list */}
        <div 
          style={{ 
            backgroundColor: "#ffffff", 
            padding: "1.75rem", 
            borderRadius: "16px", 
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <h2 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
            Verification Cycles
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {cycles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af", fontSize: "0.85rem" }}>
                No audit cycles registered.
              </div>
            ) : (
              cycles.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCycle(c)}
                  style={{
                    padding: "14px 16px",
                    border: `1.5px solid ${selectedCycle?.id === c.id ? "#7cd4a5" : "#e5e7eb"}`,
                    backgroundColor: selectedCycle?.id === c.id ? "#eefdf7" : "#fafafa",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>{c.name}</span>
                    <span
                      style={{
                        backgroundColor: c.status === "CLOSED" ? "#fee2e2" : "#ecfdf5",
                        color: c.status === "CLOSED" ? "#991b1b" : "#047857",
                        padding: "4px 8px",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                    <MapPin size={12} /> Scope: {c.location}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Checklist & Verification details */}
      <div 
        style={{ 
          flex: 2, 
          minWidth: "450px", 
          backgroundColor: "#ffffff", 
          padding: "1.75rem", 
          borderRadius: "16px", 
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        {activeCycleDetail ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "1.25rem", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>{activeCycleDetail.name} Checklist</h2>
                <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 500 }}>
                  Active checklist items at location scope: <strong>{activeCycleDetail.location}</strong>
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={exportChecklistCSV}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FileSpreadsheet size={14} /> Export CSV
                </button>

                {activeCycleDetail.status === "ACTIVE" && (
                  <button
                    onClick={() => handleCloseCycle(activeCycleDetail.id)}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 10px rgba(239,68,68,0.2)"
                    }}
                  >
                    <XCircle size={14} /> Close & Lock Audit
                  </button>
                )}
              </div>
            </div>

            {/* Checklist Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", backgroundColor: "#fafafa" }}>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>Asset Tag</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>Name</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>Verified By</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>Action Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCycleDetail.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                        No assets found at this location to verify.
                      </td>
                    </tr>
                  ) : (
                    activeCycleDetail.items.map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px", fontWeight: 700, color: "#111827" }}>{item.asset.tag}</td>
                        <td style={{ padding: "12px", fontWeight: 600, color: "#374151" }}>{item.asset.name}</td>
                        <td style={{ padding: "12px", color: "#6b7280" }}>{item.verifiedBy?.name || "-"}</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              backgroundColor:
                                item.verifiedStatus === "VERIFIED"
                                  ? "#ecfdf5"
                                  : item.verifiedStatus === "MISSING"
                                  ? "#fee2e2"
                                  : "#fffbeb",
                              color:
                                item.verifiedStatus === "VERIFIED"
                                  ? "#047857"
                                  : item.verifiedStatus === "MISSING"
                                  ? "#b91c1c"
                                  : "#d97706",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {item.verifiedStatus}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          {activeCycleDetail.status === "ACTIVE" ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                onClick={() => handleVerifyItem(item.id, "VERIFIED")}
                                style={{ backgroundColor: "#e2e8f0", border: "none", color: "#334155", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleVerifyItem(item.id, "MISSING")}
                                style={{ backgroundColor: "#fee2e2", border: "none", color: "#b91c1c", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Missing
                              </button>
                              <button
                                onClick={() => handleVerifyItem(item.id, "DAMAGED")}
                                style={{ backgroundColor: "#fef3c7", border: "none", color: "#b45309", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Damage
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: "0.78rem", fontWeight: 600 }}>Locked</span>
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
          <div style={{ display: "flex", height: "300px", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "0.9rem", gap: "10px" }}>
            <ClipboardCheck size={32} style={{ color: "#d1d5db" }} />
            Select an active verification cycle from the sidebar to begin checking inventory.
          </div>
        )}
      </div>
    </div>
  );
}

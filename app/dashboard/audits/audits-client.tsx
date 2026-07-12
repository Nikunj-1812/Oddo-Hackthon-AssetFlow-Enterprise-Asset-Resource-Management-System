"use client";

import { useState } from "react";
import { createAuditCycle, verifyAuditItem, closeAuditCycle } from "@/features/audits/actions";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      }, 800);
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
    if (
      !confirm(
        "Are you sure you want to close this audit cycle? This will lock all audit items and update missing items to LOST/DISPOSED."
      )
    )
      return;

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
      item.notes || "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((e: any[]) =>
          e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_${activeCycleDetail.name.replace(/\s+/g, "_")}_checklist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCycleDetail = cycles.find((c) => c.id === selectedCycle?.id);

  const inputStyle = {
    padding: "9px 12px",
    borderRadius: "9px",
    border: "1.5px solid #e5e7eb",
    fontSize: "0.85rem",
    fontFamily: "inherit",
    outline: "none",
    background: "#fafafa",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontFamily: "'Inter', sans-serif" }} className="animate-fade-up">
      {/* COLUMN 1: Create Cycle */}
      <div style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column" }}>
        <Card style={{ border: "1px solid #f0f0f0", borderRadius: "14px", height: "100%" }}>
          <CardHeader style={{ padding: "20px 20px 10px 20px" }}>
            <CardTitle style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
              Initialize Audit Cycle
            </CardTitle>
            <CardDescription style={{ fontSize: "0.78rem" }}>
              Schedule checksheets for specific regional locations
            </CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "10px 20px 20px 20px" }}>
            <form onSubmit={handleCreateCycle} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 600 }}>Cycle Name / Reference</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Q3 HQ Furniture Verification"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 600 }}>Scope Location</label>
                <select
                  name="location"
                  required
                  style={{ ...inputStyle, cursor: "pointer", color: "#374151", background: "#fafafa" }}
                >
                  <option value="">— Choose Location —</option>
                  {locations.map((loc, idx) => (
                    <option key={idx} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 600 }}>Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 600 }}>End Date</label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

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
                  backgroundColor: "#92E4BA",
                  color: "#1a4a2e",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.825rem",
                  boxShadow: "0 4px 10px rgba(146,228,186,0.25)",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "Bootstrapping..." : "Start Scoped Audit"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* COLUMN 2: Cycles list */}
      <div style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column" }}>
        <Card style={{ border: "1px solid #f0f0f0", borderRadius: "14px", height: "100%" }}>
          <CardHeader style={{ padding: "20px 20px 10px 20px" }}>
            <CardTitle style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
              Verification Cycles
            </CardTitle>
            <CardDescription style={{ fontSize: "0.78rem" }}>
              Select a run to track items verification
            </CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "10px 20px 20px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {cycles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                  No audit cycles registered.
                </div>
              ) : (
                cycles.map((c) => {
                  const isActive = selectedCycle?.id === c.id;
                  const isClosed = c.status === "CLOSED";
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCycle(c)}
                      style={{
                        padding: "12px 14px",
                        border: `1.5px solid ${isActive ? "#92E4BA" : "#f0f0f0"}`,
                        backgroundColor: isActive ? "#f0faf5" : "#ffffff",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = "#f0f0f0";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827" }}>
                          {c.name}
                        </span>
                        <span
                          className={`status-badge ${isClosed ? "status-retired" : "status-approved"}`}
                          style={{ padding: "2px 8px", fontSize: "0.68rem" }}
                        >
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
          border: "1px solid #f0f0f0",
        }}
      >
        {activeCycleDetail ? (
          <div className="animate-fade-up">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: "16px",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ flex: 1, minWidth: "220px" }}>
                <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                  {activeCycleDetail.name}
                </h2>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "3px",
                  }}
                >
                  <MapPin size={12} /> Scope location: <strong>{activeCycleDetail.location}</strong>
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

                {activeCycleDetail.status === "ACTIVE" && (
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

"use client";

import { useState } from "react";
import { createMaintenanceRequest, updateMaintenanceStatus } from "@/features/maintenance/actions";
import { Wrench, ShieldAlert, AlertTriangle, Play, CheckCircle2, UserPlus, XCircle, Clock, FileSpreadsheet } from "lucide-react";

interface Props {
  assets: any[];
  initialRequests: any[];
  isManager: boolean;
}

export default function MaintenanceClient({ assets, initialRequests, isManager }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  
  // Form state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Assign Tech Dialog State
  const [selectedRequestForTech, setSelectedRequestForTech] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createMaintenanceRequest(formData);

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

  const handleStatusChange = async (requestId: string, nextStatus: any, techName?: string) => {
    const result = await updateMaintenanceStatus(requestId, nextStatus, techName);
    if (result?.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
  };

  const exportCSV = () => {
    const headers = ["Asset Tag", "Asset Name", "Reported By", "Description", "Priority", "Status", "Technician Assigned", "Date Raised"];
    const rows = requests.map((r) => [
      r.asset.tag,
      r.asset.name,
      r.raisedBy?.name || "Staff",
      r.description,
      r.priority,
      r.status,
      r.assignedTo || "-",
      new Date(r.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any[]) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "maintenance_tickets_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", fontFamily: "'Inter', sans-serif" }}>
      {/* LEFT COLUMN: Report form */}
      <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
            Report Defect / Issue
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Select Asset</label>
              <select name="assetId" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                <option value="">-- Choose Asset --</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Defect Priority</label>
              <select name="priority" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                <option value="LOW">Low (Cosmetic)</option>
                <option value="MEDIUM">Medium (Functional check)</option>
                <option value="HIGH">High (Partially broken)</option>
                <option value="CRITICAL">Critical (Inoperable / Safe risk)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Problem Description</label>
              <textarea name="description" required placeholder="Describe what components failed..." style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", minHeight: "85px", fontFamily: "inherit", fontSize: "0.85rem", outline: "none" }} />
            </div>

            {error && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</span>}
            {success && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Ticket filed successfully!</span>}

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
              {submitting ? "Saving..." : "Submit Defect Report"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Tickets Pipeline */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
            Maintenance Pipeline
          </h2>
          <button
            onClick={exportCSV}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              color: "#374151",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.85rem" }}>
              No defects registered.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                      [{req.asset.tag}] {req.asset.name}
                    </h3>
                    <span style={{ fontSize: "0.72rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", fontWeight: 500 }}>
                      Reported by {req.raisedBy.name} on {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    style={{
                      backgroundColor:
                        req.priority === "CRITICAL"
                          ? "#fee2e2"
                          : req.priority === "HIGH"
                          ? "#ffedd5"
                          : "#f3f4f6",
                      color:
                        req.priority === "CRITICAL"
                          ? "#991b1b"
                          : req.priority === "HIGH"
                          ? "#c2410c"
                          : "#4b5563",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                    }}
                  >
                    {req.priority}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.5 }}>{req.description}</p>
                
                {req.assignedTo && (
                  <div style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <Wrench size={14} /> Assigned Tech: {req.assignedTo}
                  </div>
                )}

                {/* Workflow Action Buttons */}
                <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f3f4f6", paddingTop: "10px", marginTop: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, alignSelf: "center", marginRight: "auto" }}>
                    Status: <span style={{ color: "#6366f1" }}>{req.status}</span>
                  </span>

                  {isManager && req.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(req.id, "REJECTED")}
                        style={{ border: "1px solid #f87171", background: "transparent", color: "#ef4444", borderRadius: "8px", padding: "6px 12px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(req.id, "APPROVED")}
                        style={{ border: "none", backgroundColor: "#92E4BA", color: "#1e293b", borderRadius: "8px", padding: "6px 14px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <CheckCircle2 size={14} /> Approve & Pause Asset
                      </button>
                    </>
                  )}

                  {isManager && req.status === "APPROVED" && (
                    <button
                      onClick={() => setSelectedRequestForTech(req)}
                      style={{ border: "none", backgroundColor: "#6366f1", color: "#ffffff", borderRadius: "8px", padding: "6px 14px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <UserPlus size={14} /> Assign Technician
                    </button>
                  )}

                  {req.status === "TECHNICIAN_ASSIGNED" && (
                    <button
                      onClick={() => handleStatusChange(req.id, "IN_PROGRESS")}
                      style={{ border: "none", backgroundColor: "#f59e0b", color: "#ffffff", borderRadius: "8px", padding: "6px 14px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <Play size={14} fill="#ffffff" /> Start Repair Work
                    </button>
                  )}

                  {req.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange(req.id, "RESOLVED")}
                      style={{ border: "none", backgroundColor: "#10b981", color: "#ffffff", borderRadius: "8px", padding: "6px 14px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <CheckCircle2 size={14} /> Mark Resolved (Release Asset)
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ASSIGN TECH MODAL */}
      {selectedRequestForTech && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "400px",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>
              Assign Repair Technician
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const techName = formData.get("technicianName") as string;
                handleStatusChange(selectedRequestForTech.id, "TECHNICIAN_ASSIGNED", techName);
                setSelectedRequestForTech(null);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Technician Full Name</label>
                <input name="technicianName" required placeholder="e.g. John Doe" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedRequestForTech(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #d1d5db", background: "transparent", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 24px", borderRadius: "8px", border: "none", backgroundColor: "#92E4BA", color: "#1e293b", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

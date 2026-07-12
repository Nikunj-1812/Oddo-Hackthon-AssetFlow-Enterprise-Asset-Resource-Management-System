"use client";

import { useState } from "react";
import { toast } from "sonner";
import { approveReturnRequest, rejectReturnRequest } from "@/features/allocations/actions";
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Check, X, ShieldCheck } from "lucide-react";

interface Props {
  initialRequests: any[];
  isManager: boolean;
}

export default function ReturnRequestsClient({ initialRequests, isManager }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Form check-in states
  const [condition, setCondition] = useState("GOOD");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);

    const res = await approveReturnRequest(selectedRequest.id, condition, notes);
    if (res.error) {
      toast.error(res.error);
      setSubmitting(false);
    } else {
      toast.success("Return request approved and verified!");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleReject = async (requestId: string) => {
    const comments = prompt("Enter comments/reasons for rejection:") || "";
    if (!comments.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    const res = await rejectReturnRequest(requestId, comments);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Return request rejected.");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
      
      {/* Requests list table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "#4b5563" }}>Asset</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "#4b5563" }}>Employee</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "#4b5563" }}>Reason / Notes</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "#4b5563" }}>Requested At</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "#4b5563" }}>Status</th>
              {isManager && <th style={{ padding: "12px 14px", fontWeight: 800, color: "#4b5563", textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "3rem" }}>
                  <ShieldCheck size={32} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
                  No equipment return requests found.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: "#111827" }}>{req.allocation?.asset?.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "monospace", marginTop: "2px" }}>{req.allocation?.asset?.tag}</div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#374151", fontWeight: 600 }}>
                    {req.allocation?.user?.name || "Staff"}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#4b5563", maxWidth: "250px" }}>
                    {req.notes || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No notes provided</span>}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#6b7280" }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      padding: "3px 9px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      background: req.status === "PENDING" ? "#fffbeb" : req.status === "APPROVED" ? "#e8faf3" : "#fef2f2",
                      color: req.status === "PENDING" ? "#b45309" : req.status === "APPROVED" ? "#047857" : "#b91c1c"
                    }}>
                      {req.status}
                    </span>
                  </td>
                  {isManager && (
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      {req.status === "PENDING" ? (
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            style={{ padding: "5px 10px", border: "none", background: "#e8faf3", color: "#047857", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            style={{ padding: "5px 10px", border: "none", background: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>Processed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CHECK-IN VERIFICATION MODAL */}
      {selectedRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>Asset Return Verification Check</h3>
              <button onClick={() => setSelectedRequest(null)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
            </div>

            <form onSubmit={handleApproveSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: "12px", borderRadius: "10px", fontSize: "0.8rem", color: "#374151" }}>
                <div>Asset Name: <strong>{selectedRequest.allocation?.asset?.name}</strong></div>
                <div>Asset Tag: <strong style={{ fontFamily: "monospace" }}>{selectedRequest.allocation?.asset?.tag}</strong></div>
                <div>Reason filed: <em>"{selectedRequest.notes}"</em></div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>Returned Condition Check</label>
                <select value={condition} onChange={e => setCondition(e.target.value)} required style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", background: "#ffffff" }}>
                  <option value="GOOD">Good / Perfect working order</option>
                  <option value="NEEDS_REPAIR">Needs Repair (Asset moves to Under Maintenance)</option>
                  <option value="DAMAGED">Damaged (Asset condition updated to DAMAGED)</option>
                  <option value="LOST">Lost (Asset status flags as LOST)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>Verification Comments</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record defect details or check-in check-list comments here..."
                  style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", minHeight: "80px", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button type="button" onClick={() => setSelectedRequest(null)} style={{ flex: 1, padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 2, padding: "8px", border: "none", background: "#6ecfa3", color: "#1a4a2e", borderRadius: "6px", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}>
                  {submitting ? "Processing check-in..." : "Approve & Check-in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

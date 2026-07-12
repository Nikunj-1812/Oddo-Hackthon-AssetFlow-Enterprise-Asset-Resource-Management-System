"use client";

import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  createMaintenanceRequest,
  updateMaintenanceStatus,
} from "@/features/maintenance/actions";
import {
  Wrench,
  CheckCircle2,
  UserPlus,
  XCircle,
  Play,
  FileSpreadsheet,
  Plus,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  User,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface Props {
  assets: any[];
  initialRequests: any[];
  isManager: boolean;
}

const COLUMNS = [
  { id: "PENDING", label: "Pending", color: "#f59e0b", dot: "#f59e0b" },
  { id: "APPROVED", label: "Approved", color: "#6366f1", dot: "#6366f1" },
  { id: "TECHNICIAN_ASSIGNED", label: "Tech Assigned", color: "#3b82f6", dot: "#3b82f6" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#8b5cf6", dot: "#8b5cf6" },
  { id: "RESOLVED", label: "Resolved", color: "#10b981", dot: "#10b981" },
];

const priorityConfig: Record<string, { bg: string; color: string; icon: any }> = {
  LOW: { bg: "#f3f4f6", color: "#4b5563", icon: Clock },
  MEDIUM: { bg: "#fffbeb", color: "#b45309", icon: AlertTriangle },
  HIGH: { bg: "#ffedd5", color: "#c2410c", icon: AlertCircle },
  CRITICAL: { bg: "#fee2e2", color: "#991b1b", icon: ShieldAlert },
};

export default function MaintenanceClient({ assets, initialRequests, isManager }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
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
        setShowForm(false);
        window.location.reload();
      }, 800);
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

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const nextStatus = destination.droppableId as any;
    const req = requests.find((r) => r.id === draggableId);
    if (!req) return;

    // Optimistically update
    setRequests((prev) =>
      prev.map((r) => (r.id === draggableId ? { ...r, status: nextStatus } : r))
    );
    handleStatusChange(draggableId, nextStatus);
  };

  const exportCSV = () => {
    const headers = ["Asset Tag", "Asset Name", "Reported By", "Description", "Priority", "Status", "Technician", "Date"];
    const rows = requests.map((r) => [
      r.asset.tag, r.asset.name, r.raisedBy?.name || "Staff",
      r.description, r.priority, r.status, r.assignedTo || "-",
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "maintenance_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCardsByStatus = (status: string) =>
    requests.filter((r) => r.status === status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: "'Inter', sans-serif" }}>

      {/* Page Header */}
      <div className="page-header animate-fade-up">
        <div>
          <h1 className="page-title">Maintenance Board</h1>
          <p className="page-subtitle">Track, approve, and resolve asset maintenance tickets</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={exportCSV}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "9px 16px", background: "#ffffff", color: "#374151",
              border: "1px solid #e5e7eb", borderRadius: "9px",
              fontWeight: 600, fontSize: "0.825rem", cursor: "pointer",
            }}
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "9px 18px", background: "#92E4BA", color: "#1a4a2e",
              border: "none", borderRadius: "9px",
              fontWeight: 700, fontSize: "0.825rem", cursor: "pointer",
              boxShadow: "0 4px 12px rgba(146,228,186,0.35)",
            }}
          >
            <Plus size={14} /> Report Issue
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="animate-fade-up delay-100">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map((col) => {
              const cards = getCardsByStatus(col.id);
              return (
                <div key={col.id} className="kanban-column">
                  {/* Column Header */}
                  <div className="kanban-column-header" style={{ borderTop: `3px solid ${col.color}` }}>
                    <div className="kanban-column-dot" style={{ background: col.color }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827" }}>
                      {col.label}
                    </span>
                    <span className="kanban-count">{cards.length}</span>
                  </div>

                  {/* Droppable area */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="kanban-cards-area"
                        style={{
                          background: snapshot.isDraggingOver ? `${col.color}0a` : "transparent",
                          borderRadius: "10px",
                          minHeight: "80px",
                          padding: "4px",
                          transition: "background 0.2s ease",
                        }}
                      >
                        {cards.length === 0 && !snapshot.isDraggingOver && (
                          <div style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#d1d5db",
                            fontSize: "0.775rem",
                            border: "1.5px dashed #f0f0f0",
                            borderRadius: "10px",
                            marginTop: "4px",
                          }}>
                            No tickets
                          </div>
                        )}

                        {cards.map((req, index) => {
                          const pConfig = priorityConfig[req.priority] || priorityConfig.LOW;
                          const PIcon = pConfig.icon;
                          return (
                            <Draggable key={req.id} draggableId={req.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`kanban-card ${snapshot.isDragging ? "kanban-card-dragging" : ""}`}
                                  onClick={() => setSelectedCard(req)}
                                >
                                  {/* Priority badge */}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        padding: "2px 8px",
                                        borderRadius: "20px",
                                        background: pConfig.bg,
                                        color: pConfig.color,
                                        fontSize: "0.68rem",
                                        fontWeight: 700,
                                      }}
                                    >
                                      <PIcon size={10} />
                                      {req.priority}
                                    </span>
                                    <ChevronRight size={13} color="#d1d5db" />
                                  </div>

                                  {/* Asset info */}
                                  <div>
                                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>
                                      {req.asset?.name}
                                    </div>
                                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "monospace" }}>
                                      {req.asset?.tag}
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.4 }}>
                                    {req.description?.slice(0, 80)}{req.description?.length > 80 ? "..." : ""}
                                  </p>

                                  {/* Footer */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f9fafb" }}>
                                    {req.assignedTo && (
                                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "#6366f1" }}>
                                        <User size={10} />
                                        {req.assignedTo}
                                      </div>
                                    )}
                                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "3px", fontSize: "0.68rem", color: "#9ca3af" }}>
                                      <Calendar size={10} />
                                      {new Date(req.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* ── CARD DETAIL SHEET ── */}
      {selectedCard && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 200,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="animate-slide-right"
            style={{
              width: "420px",
              height: "100vh",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid #f0f0f0",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div style={{ padding: "22px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Maintenance Ticket
                </div>
                <h2 style={{ margin: "4px 0 0 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
                  {selectedCard.asset?.name}
                </h2>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "monospace", marginTop: "2px" }}>
                  {selectedCard.asset?.tag}
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sheet Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Priority & Status */}
              <div style={{ display: "flex", gap: "8px" }}>
                {(() => {
                  const pConfig = priorityConfig[selectedCard.priority] || priorityConfig.LOW;
                  return (
                    <span style={{ padding: "4px 12px", borderRadius: "20px", background: pConfig.bg, color: pConfig.color, fontSize: "0.75rem", fontWeight: 700 }}>
                      {selectedCard.priority} Priority
                    </span>
                  );
                })()}
                <span className="status-badge status-pending">{selectedCard.status}</span>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  Problem Description
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, background: "#fafafa", padding: "12px 14px", borderRadius: "10px", border: "1px solid #f0f0f0" }}>
                  {selectedCard.description}
                </p>
              </div>

              {/* Metadata */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Reported By", value: selectedCard.raisedBy?.name || "Staff" },
                  { label: "Date Raised", value: new Date(selectedCard.createdAt).toLocaleDateString() },
                  { label: "Asset Location", value: selectedCard.asset?.location || "—" },
                  { label: "Technician", value: selectedCard.assignedTo || "Not assigned" },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "0.825rem", color: "#111827", fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {isManager && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Actions
                  </div>

                  {selectedCard.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => { handleStatusChange(selectedCard.id, "REJECTED"); setSelectedCard(null); }}
                        style={{ flex: 1, padding: "10px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#dc2626", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => { handleStatusChange(selectedCard.id, "APPROVED"); setSelectedCard(null); }}
                        style={{ flex: 1, padding: "10px", border: "none", background: "#92E4BA", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                    </div>
                  )}

                  {selectedCard.status === "APPROVED" && (
                    <button
                      onClick={() => { setSelectedRequestForTech(selectedCard); setSelectedCard(null); }}
                      style={{ padding: "10px", border: "none", background: "#6366f1", color: "#ffffff", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <UserPlus size={14} /> Assign Technician
                    </button>
                  )}

                  {selectedCard.status === "TECHNICIAN_ASSIGNED" && (
                    <button
                      onClick={() => { handleStatusChange(selectedCard.id, "IN_PROGRESS"); setSelectedCard(null); }}
                      style={{ padding: "10px", border: "none", background: "#f59e0b", color: "#ffffff", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Play size={14} fill="#fff" /> Start Repair
                    </button>
                  )}

                  {selectedCard.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => { handleStatusChange(selectedCard.id, "RESOLVED"); setSelectedCard(null); }}
                      style={{ padding: "10px", border: "none", background: "#10b981", color: "#ffffff", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <CheckCircle2 size={14} /> Mark Resolved
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT ISSUE SHEET ── */}
      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="animate-slide-right"
            style={{ width: "400px", height: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", borderLeft: "1px solid #f0f0f0", boxShadow: "-20px 0 60px rgba(0,0,0,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "22px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Report Asset Issue</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Select Asset</label>
                  <select name="assetId" required style={{ padding: "10px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", color: "#374151", background: "#fafafa", outline: "none", fontFamily: "inherit" }}>
                    <option value="">— Choose an asset —</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>[{a.tag}] {a.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Priority Level</label>
                  <select name="priority" required style={{ padding: "10px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", color: "#374151", background: "#fafafa", outline: "none", fontFamily: "inherit" }}>
                    <option value="LOW">Low — Cosmetic issue</option>
                    <option value="MEDIUM">Medium — Functional check</option>
                    <option value="HIGH">High — Partially broken</option>
                    <option value="CRITICAL">Critical — Inoperable / Safety risk</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Problem Description</label>
                  <textarea
                    name="description"
                    required
                    placeholder="Describe what components failed or what issue was observed..."
                    style={{ padding: "10px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", minHeight: "100px", fontFamily: "inherit", fontSize: "0.85rem", outline: "none", resize: "vertical", background: "#fafafa" }}
                  />
                </div>

                {error && (
                  <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "9px", fontSize: "0.8rem" }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{ padding: "10px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "9px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={14} /> Ticket filed successfully!
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.825rem", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ flex: 2, padding: "10px", border: "none", background: "#92E4BA", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN TECH MODAL ── */}
      {selectedRequestForTech && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setSelectedRequestForTech(null)}
        >
          <div
            className="animate-scale-in"
            style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "380px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
              Assign Technician
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.8rem", color: "#6b7280" }}>
              Enter the name of the technician to handle this repair.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const techName = formData.get("technicianName") as string;
                handleStatusChange(selectedRequestForTech.id, "TECHNICIAN_ASSIGNED", techName);
                setSelectedRequestForTech(null);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Technician Full Name</label>
                <input
                  name="technicianName"
                  required
                  placeholder="e.g. John Doe"
                  style={{ padding: "10px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", fontFamily: "inherit", outline: "none", background: "#fafafa" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedRequestForTech(null)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.825rem", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: "10px", border: "none", background: "#92E4BA", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", fontFamily: "inherit" }}
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

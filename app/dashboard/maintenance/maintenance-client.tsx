"use client";

import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { RequestStatus } from "@prisma/client";
import {
  createMaintenanceRequest,
  updateMaintenanceStatus,
  addMaintenancePhoto,
  fetchMaintenanceDetails
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

import { COLUMNS, KanbanCard, SortableCard, KanbanColumnDroppable, priorityConfig } from "./components/kanban-components";

export default function MaintenanceClient({ assets, initialRequests, isManager }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  const moveCard = async (requestId: string, currentStatus: string, direction: "prev" | "next") => {
    const currentIndex = COLUMNS.findIndex(col => col.id === currentStatus);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= COLUMNS.length) return;
    
    const nextStatus = COLUMNS[targetIndex].id;
    
    // 1. Optimistic UI update
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: nextStatus };
      }
      return req;
    }));
    
    // 2. Perform backend update
    const result = await updateMaintenanceStatus(requestId, nextStatus as RequestStatus);
    if (result?.error) {
      toast.error(result.error);
      // rollback on failure
      setRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          return { ...req, status: currentStatus };
        }
        return req;
      }));
    }
  };

  // Dynamic ticket workflow data loading
  const [ticketPhotos, setTicketPhotos] = useState<any[]>([]);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCard) {
      loadTicketDetails(selectedCard.id);
    } else {
      setTicketPhotos([]);
      setTicketHistory([]);
    }
  }, [selectedCard]);

  const loadTicketDetails = async (id: string) => {
    const details = await fetchMaintenanceDetails(id);
    setTicketPhotos(details.photos || []);
    setTicketHistory(details.history || []);
  };
  const [selectedRequestForTech, setSelectedRequestForTech] = useState<any | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTaskNode, setActiveTaskNode] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      toast.error(result.error);
      window.location.reload(); // Rollback on failure
    }
    // Optimistic UI updates handle the success state, no need to reload
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const node = requests.find((r) => r.id === event.active.id);
    setActiveTaskNode(node || null);
  };

  const onDragOver = (event: DragOverEvent) => {
    // Do nothing during dragging so the original card stays in its source column!
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveTaskNode(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = requests.find((r) => r.id === activeId);
    if (!activeTask) return;

    const isOverCard = over.data.current?.type === "Card";
    const isOverColumn = over.data.current?.type === "Column";

    let newStatus = activeTask.status;

    if (isOverCard) {
      const overTask = requests.find((r) => r.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    } else if (isOverColumn) {
      newStatus = overId as string;
    }

    if (newStatus !== activeTask.status) {
      // Move to a different column
      setRequests((prevRequests) => {
        const activeIndex = prevRequests.findIndex((t) => t.id === activeId);
        const newRequests = [...prevRequests];
        newRequests[activeIndex] = { ...newRequests[activeIndex], status: newStatus };
        const overIndex = prevRequests.findIndex((t) => t.id === overId);
        if (overIndex !== -1) {
          return arrayMove(newRequests, activeIndex, overIndex);
        }
        return newRequests;
      });

      handleStatusChange(activeId as string, newStatus);
    } else if (isOverCard && activeId !== overId) {
      // Reorder within the same column
      setRequests((prevRequests) => {
        const activeIndex = prevRequests.findIndex((t) => t.id === activeId);
        const overIndex = prevRequests.findIndex((t) => t.id === overId);
        return arrayMove(prevRequests, activeIndex, overIndex);
      });
    }
  };

  // activeTaskNode used for DragOverlay to prevent flickering during status updates

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.4" } },
    }),
  };

  const exportCSV = () => {
    const headers = ["Asset Tag", "Asset Name", "Reported By", "Description", "Priority", "Status", "Technician", "Date"];
    const rows = requests.map((r) => [
      r.asset.tag, r.asset.name, r.raisedBy?.name || "Staff",
      r.description, r.priority, r.status, r.assignedTo || "-",
      fmtDate(r.createdAt),
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

  const getCardsByStatus = (status: string) => requests.filter((r) => r.status === status);

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
              padding: "9px 18px", background: "#6ecfa3", color: "#1a4a2e",
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
        {isMounted ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="kanban-board">
              {COLUMNS.map((col) => {
                const cards = getCardsByStatus(col.id);
                return (
                  <div key={col.id} className="kanban-column">
                    <div className="kanban-column-header" style={{ borderTop: `3px solid ${col.color}` }}>
                      <div className="kanban-column-dot" style={{ background: col.color }} />
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827" }}>
                        {col.label}
                      </span>
                      <span className="kanban-count">{cards.length}</span>
                    </div>

                    <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <KanbanColumnDroppable col={col} cards={cards}>
                        {cards.length === 0 && (
                          <div style={{
                            padding: "20px", textAlign: "center", color: "#d1d5db",
                            fontSize: "0.775rem", border: "1.5px dashed #f0f0f0",
                            borderRadius: "10px", marginTop: "4px",
                          }}>
                            No tickets
                          </div>
                        )}
                        {cards.map((req) => (
                          <SortableCard
                            key={req.id}
                            req={req}
                            onClick={() => setSelectedCard(req)}
                            onMovePrev={() => moveCard(req.id, req.status, "prev")}
                            onMoveNext={() => moveCard(req.id, req.status, "next")}
                          />
                        ))}
                      </KanbanColumnDroppable>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
            
            <DragOverlay dropAnimation={dropAnimation}>
              {activeId && activeTaskNode ? (
                <KanbanCard req={activeTaskNode} isOverlay style={{ cursor: "grabbing" }} />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="kanban-board">
            <div style={{ padding: "40px", textAlign: "center", width: "100%", color: "#9ca3af" }}>
              Loading board...
            </div>
          </div>
        )}
      </div>

      {/* ── CARD DETAIL SHEET ── */}
      {selectedCard && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="animate-slide-right"
            style={{ width: "420px", height: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", borderLeft: "1px solid #f0f0f0", boxShadow: "-20px 0 60px rgba(0,0,0,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "22px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Maintenance Ticket</div>
                <h2 style={{ margin: "4px 0 0 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>{selectedCard.asset?.name}</h2>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "monospace", marginTop: "2px" }}>{selectedCard.asset?.tag}</div>
              </div>
              <button onClick={() => setSelectedCard(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
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

              <div>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Problem Description</div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, background: "#fafafa", padding: "12px 14px", borderRadius: "10px", border: "1px solid #f0f0f0" }}>{selectedCard.description}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Reported By", value: selectedCard.raisedBy?.name || "Staff" },
                  { label: "Date Raised", value: fmtDate(selectedCard.createdAt) },
                  { label: "Asset Location", value: selectedCard.asset?.location || "—" },
                  { label: "Technician", value: selectedCard.assignedTo || "Not assigned" },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{item.label}</div>
                    <div style={{ fontSize: "0.825rem", color: "#111827", fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Photo Attachments Section */}
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Ticket Photos</div>
                
                {ticketPhotos.length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic", marginBottom: "10px" }}>No photos attached.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    {ticketPhotos.map((photo) => (
                      <div key={photo.id} style={{ borderRadius: "8px", border: "1px solid #e5e7eb", padding: "4px", background: "#fcfcfc" }}>
                        <a href={photo.url} target="_blank" rel="noreferrer">
                          <img src={photo.url} alt="Defect" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px" }} />
                        </a>
                        <div style={{ fontSize: "0.65rem", color: "#4b5563", marginTop: "4px", padding: "0 2px" }}>{photo.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Photo Form */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const url = fd.get("photoUrl") as string;
                  const desc = fd.get("photoDesc") as string;
                  if (!url || !desc) return;
                  const res = await addMaintenancePhoto(selectedCard.id, url, desc);
                  if (res.error) toast.error(res.error);
                  else {
                    (e.target as HTMLFormElement).reset();
                    loadTicketDetails(selectedCard.id);
                  }
                }} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#fafafa", padding: "10px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6b7280" }}>Attach Photo Link</div>
                  <input name="photoUrl" placeholder="Image URL (e.g. http://...)" required style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.75rem" }} />
                  <input name="photoDesc" placeholder="Brief note (e.g. Broken port)" required style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.75rem" }} />
                  <button type="submit" style={{ padding: "5px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600 }}>Add Photo</button>
                </form>
              </div>

              {/* Approval History Timeline Section */}
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Workflow Timeline Log</div>
                
                {ticketHistory.length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>No transition log history yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {ticketHistory.map((hist) => (
                      <div key={hist.id} style={{ display: "flex", gap: "8px", fontSize: "0.75rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6ecfa3" }} />
                          <div style={{ flex: 1, width: "2px", background: "#e5e7eb" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: "#111827" }}>
                            {hist.prevStatus} &rarr; <span style={{ color: "#047857" }}>{hist.nextStatus}</span>
                          </div>
                          <div style={{ color: "#6b7280", marginTop: "2px" }}>{hist.comments}</div>
                          <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "2px" }}>
                            By {hist.userName} · {new Date(hist.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isManager && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Actions</div>
                  {selectedCard.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => { handleStatusChange(selectedCard.id, "REJECTED"); setSelectedCard(null); }} style={{ flex: 1, padding: "10px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#dc2626", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><XCircle size={14} /> Reject</button>
                      <button onClick={() => { handleStatusChange(selectedCard.id, "APPROVED"); setSelectedCard(null); }} style={{ flex: 1, padding: "10px", border: "none", background: "#6ecfa3", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><CheckCircle2 size={14} /> Approve</button>
                    </div>
                  )}
                  {selectedCard.status === "APPROVED" && (
                    <button onClick={() => { setSelectedRequestForTech(selectedCard); setSelectedCard(null); }} style={{ padding: "10px", border: "none", background: "#6366f1", color: "#ffffff", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><UserPlus size={14} /> Assign Technician</button>
                  )}
                  {selectedCard.status === "TECHNICIAN_ASSIGNED" && (
                    <button onClick={() => { handleStatusChange(selectedCard.id, "IN_PROGRESS"); setSelectedCard(null); }} style={{ padding: "10px", border: "none", background: "#f59e0b", color: "#ffffff", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><Play size={14} fill="#fff" /> Start Repair</button>
                  )}
                  {selectedCard.status === "IN_PROGRESS" && (
                    <button onClick={() => { handleStatusChange(selectedCard.id, "RESOLVED"); setSelectedCard(null); }} style={{ padding: "10px", border: "none", background: "#10b981", color: "#ffffff", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><CheckCircle2 size={14} /> Mark Resolved</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT ISSUE SHEET ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 200, display: "flex", justifyContent: "flex-end" }} onClick={() => setShowForm(false)}>
          <div className="animate-slide-right" style={{ width: "400px", height: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", borderLeft: "1px solid #f0f0f0", boxShadow: "-20px 0 60px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "22px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Report Asset Issue</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Select Asset</label>
                  <select name="assetId" required style={{ padding: "10px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", color: "#374151", background: "#fafafa", outline: "none", fontFamily: "inherit" }}>
                    <option value="">— Choose an asset —</option>
                    {assets.map((a) => <option key={a.id} value={a.id}>[{a.tag}] {a.name}</option>)}
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
                  <textarea name="description" required placeholder="Describe what components failed or what issue was observed..." style={{ padding: "10px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", minHeight: "100px", fontFamily: "inherit", fontSize: "0.85rem", outline: "none", resize: "vertical", background: "#fafafa" }} />
                </div>
                {error && <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "9px", fontSize: "0.8rem" }}>{error}</div>}
                {success && <div style={{ padding: "10px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "9px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}><CheckCircle2 size={14} /> Ticket filed successfully!</div>}
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.825rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  <button type="submit" disabled={submitting} style={{ flex: 2, padding: "10px", border: "none", background: "#6ecfa3", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", fontFamily: "inherit" }}>{submitting ? "Submitting..." : "Submit Report"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN TECH MODAL ── */}
      {selectedRequestForTech && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setSelectedRequestForTech(null)}>
          <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "380px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Assign Technician</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.8rem", color: "#6b7280" }}>Enter the name of the technician to handle this repair.</p>
            <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const techName = formData.get("technicianName") as string; handleStatusChange(selectedRequestForTech.id, "TECHNICIAN_ASSIGNED", techName); setSelectedRequestForTech(null); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Technician Full Name</label>
                <input name="technicianName" required placeholder="e.g. John Doe" style={{ padding: "10px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.85rem", fontFamily: "inherit", outline: "none", background: "#fafafa" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button type="button" onClick={() => setSelectedRequestForTech(null)} style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.825rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: "10px", border: "none", background: "#6ecfa3", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", fontFamily: "inherit" }}>Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

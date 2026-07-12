"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  User, Calendar, ChevronRight, Clock, AlertTriangle, AlertCircle, ShieldAlert
} from "lucide-react";
import { fmtDate } from "@/lib/utils";

export const COLUMNS = [
  { id: "PENDING", label: "Pending", color: "#f59e0b", dot: "#f59e0b" },
  { id: "APPROVED", label: "Approved", color: "#6366f1", dot: "#6366f1" },
  { id: "TECHNICIAN_ASSIGNED", label: "Tech Assigned", color: "#3b82f6", dot: "#3b82f6" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#8b5cf6", dot: "#8b5cf6" },
  { id: "RESOLVED", label: "Resolved", color: "#10b981", dot: "#10b981" },
];

export const priorityConfig: Record<string, { bg: string; color: string; icon: any }> = {
  LOW: { bg: "#f3f4f6", color: "#4b5563", icon: Clock },
  MEDIUM: { bg: "#fffbeb", color: "#b45309", icon: AlertTriangle },
  HIGH: { bg: "#ffedd5", color: "#c2410c", icon: AlertCircle },
  CRITICAL: { bg: "#fee2e2", color: "#991b1b", icon: ShieldAlert },
};

// --- Kanban Card Component ---
export function KanbanCard({ req, style, isDragging, isOverlay, onMovePrev, onMoveNext, ...props }: any) {
  const pConfig = priorityConfig[req.priority] || priorityConfig.LOW;
  const PIcon = pConfig.icon;

  const currentColumnIndex = COLUMNS.findIndex(col => col.id === req.status);
  const showPrev = currentColumnIndex > 0;
  const showNext = currentColumnIndex < COLUMNS.length - 1;

  return (
    <div
      style={style}
      className={`kanban-card ${isDragging || isOverlay ? "kanban-card-dragging" : ""}`}
      {...props}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "20px", background: pConfig.bg, color: pConfig.color, fontSize: "0.68rem", fontWeight: 700 }}>
          <PIcon size={10} />
          {req.priority}
        </span>
        <ChevronRight size={13} color="#d1d5db" />
      </div>
      <div>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>
          {req.asset?.name}
        </div>
        <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "monospace" }}>
          {req.asset?.tag}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.4 }}>
        {req.description?.slice(0, 80)}{req.description?.length > 80 ? "..." : ""}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f9fafb" }}>
        {req.assignedTo && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "#6366f1" }}>
            <User size={10} />
            {req.assignedTo}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.68rem", color: "#9ca3af" }}>
          <Calendar size={10} />
          {fmtDate(req.createdAt)}
        </div>
        
        {/* Quick move action buttons */}
        <div 
          style={{ marginLeft: "auto", display: "flex", gap: "4px" }} 
          onPointerDown={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()}
        >
          {showPrev && (
            <button
              title="Move Left"
              onClick={(e) => {
                e.stopPropagation();
                onMovePrev();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: "0.68rem",
                color: "#4b5563",
                fontWeight: "bold"
              }}
            >
              ←
            </button>
          )}
          {showNext && (
            <button
              title="Move Right"
              onClick={(e) => {
                e.stopPropagation();
                onMoveNext();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: "0.68rem",
                color: "#4b5563",
                fontWeight: "bold"
              }}
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sortable Card Wrapper Component ---
export function SortableCard({ req, onClick, onMovePrev, onMoveNext }: { req: any; onClick?: () => void; onMovePrev?: () => void; onMoveNext?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: req.id,
    data: { type: "Card", request: req },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <KanbanCard
      req={req}
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      onClick={(e: any) => {
        if (isDragging) return;
        onClick?.();
      }}
      onMovePrev={onMovePrev}
      onMoveNext={onMoveNext}
      {...attributes}
      {...listeners}
    />
  );
}

// --- Column Droppable Component ---
export function KanbanColumnDroppable({ col, cards, children }: { col: any, cards: any[], children: React.ReactNode }) {
  const { setNodeRef } = useSortable({
    id: col.id,
    data: { type: "Column", status: col.id },
  });

  return (
    <div
      ref={setNodeRef}
      className="kanban-cards-area"
      style={{
        borderRadius: "10px",
        minHeight: "80px",
        padding: "4px",
        transition: "background 0.2s ease",
      }}
    >
      {children}
    </div>
  );
}

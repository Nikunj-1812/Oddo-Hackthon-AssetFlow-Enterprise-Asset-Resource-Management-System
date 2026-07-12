"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import {
  X, Tag, DollarSign, MapPin, Clock, CheckCircle, XCircle,
  ShieldCheck, ShieldX, ShieldAlert, Building2, TrendingDown,
  FileText, Download, Image as ImageIcon, Wrench, Archive
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import {
  addAssetDocument, deleteAssetDocument, addAssetImage
} from "@/features/assets/lifecycle-actions";

interface DrawerProps {
  selectedAsset: any;
  onClose: () => void;
  drawerTab: "overview" | "timeline" | "warranty" | "vendor" | "depreciation" | "documents" | "images" | "maintenance";
  setDrawerTab: (tab: any) => void;
  canManage: boolean;
  timeline: any[];
  documents: any[];
  images: any[];
  depreciationData: any | null;
  loadingExtra: boolean;
  loadAssetExtra: (assetId: string) => void;
  setShowProfileModal: (show: boolean) => void;
  setShowRetireModal: (show: boolean) => void;
}

const statusConfig: Record<string, { label: string; className: string; color: string }> = {
  PURCHASED:         { label: "Purchased",        className: "status-retired",     color: "#6366f1" },
  REGISTERED:        { label: "Registered",       className: "status-retired",     color: "#8b5cf6" },
  AVAILABLE:         { label: "Available",        className: "status-available",   color: "#059669" },
  RESERVED:          { label: "Reserved",         className: "status-allocated",   color: "#0284c7" },
  ALLOCATED:         { label: "Allocated",        className: "status-allocated",   color: "#2563eb" },
  UNDER_MAINTENANCE: { label: "Maintenance",      className: "status-maintenance", color: "#d97706" },
  LOST:              { label: "Lost",             className: "status-lost",        color: "#dc2626" },
  RETIRED:           { label: "Retired",          className: "status-retired",     color: "#6b7280" },
  DISPOSED:          { label: "Disposed",         className: "status-lost",        color: "#374151" },
};

const conditionConfig: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "#e8faf3", color: "#047857" },
  GOOD: { bg: "#eff6ff", color: "#1d4ed8" },
  FAIR: { bg: "#fffbeb", color: "#b45309" },
  POOR: { bg: "#ffedd5", color: "#c2410c" },
  DAMAGED: { bg: "#fef2f2", color: "#b91c1c" },
};

function getWarrantyStatus(warrantyEnd?: string | null): { label: string; color: string; bg: string } {
  if (!warrantyEnd) return { label: "No Warranty", color: "#9ca3af", bg: "#f9fafb" };
  const end = new Date(warrantyEnd);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0)  return { label: `Expired ${Math.abs(daysLeft)}d ago`, color: "#dc2626", bg: "#fef2f2" };
  if (daysLeft <= 30) return { label: `Expiring in ${daysLeft}d`, color: "#d97706", bg: "#fffbeb" };
  if (daysLeft <= 90) return { label: `${daysLeft}d remaining`, color: "#0284c7", bg: "#eff6ff" };
  return { label: `${daysLeft}d remaining`, color: "#059669", bg: "#f0fdf4" };
}

export function AssetDetailDrawer({
  selectedAsset,
  onClose,
  drawerTab,
  setDrawerTab,
  canManage,
  timeline,
  documents,
  images,
  depreciationData,
  loadingExtra,
  loadAssetExtra,
  setShowProfileModal,
  setShowRetireModal
}: DrawerProps) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 250, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div
        className="animate-slide-right"
        style={{ width: "100%", maxWidth: "480px", background: "#ffffff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-10px 0 40px rgba(0,0,0,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{ padding: "24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={`status-badge status-${selectedAsset.status?.toLowerCase()}`}>{statusConfig[selectedAsset.status]?.label || selectedAsset.status}</span>
              <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontFamily: "monospace" }}>{selectedAsset.tag}</span>
            </div>
            <h2 style={{ margin: "6px 0 2px", fontSize: "1.15rem", fontWeight: 800, color: "#111827" }}>{selectedAsset.name}</h2>
            <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{selectedAsset.category?.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563" }}><X size={14} /></button>
        </div>

        {/* Tab Headers */}
        <div style={{ display: "flex", background: "#fafafa", borderBottom: "1px solid #f3f4f6", overflowX: "auto", whiteSpace: "nowrap" }} className="custom-scrollbar">
          {[
            { id: "overview", label: "Overview" },
            { id: "timeline", label: "Timeline" },
            { id: "warranty", label: "Warranty" },
            { id: "vendor", label: "Vendor" },
            { id: "depreciation", label: "Depreciation" },
            { id: "documents", label: "Docs" },
            { id: "images", label: "Images" },
            { id: "maintenance", label: "Maintenance" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDrawerTab(tab.id as any)}
              style={{
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                fontSize: "0.78rem",
                fontWeight: drawerTab === tab.id ? 700 : 500,
                color: drawerTab === tab.id ? "#059669" : "#6b7280",
                borderBottom: drawerTab === tab.id ? "2px solid #059669" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }} className="custom-scrollbar">
          
          {/* OVERVIEW TAB */}
          {drawerTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { icon: Tag, label: "Serial Number", value: selectedAsset.serialNumber || "—" },
                  { icon: DollarSign, label: "Acquisition Cost", value: `₹${(selectedAsset.cost || 0).toLocaleString()}` },
                  { icon: MapPin, label: "Location", value: selectedAsset.location },
                  { icon: Clock, label: "Acquired", value: fmtDate(selectedAsset.acquisitionDate) },
                  { icon: DollarSign, label: "Current Value", value: selectedAsset.currentValue ? `₹${selectedAsset.currentValue.toLocaleString()}` : "Not set" },
                  { icon: Tag, label: "Currency", value: selectedAsset.currency || "INR" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} style={{ background: "#fafafa", borderRadius: "10px", padding: "12px", border: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <Icon size={12} color="#9ca3af" />
                        <span style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{item.value}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {(() => {
                  const cond = conditionConfig[selectedAsset.condition] || { bg: "#f3f4f6", color: "#374151" };
                  return (
                    <div style={{ flex: 1, background: cond.bg, borderRadius: "10px", padding: "12px", border: `1px solid ${cond.color}20` }}>
                      <div style={{ fontSize: "0.65rem", color: cond.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Condition</div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 800, color: cond.color }}>{selectedAsset.condition}</div>
                    </div>
                  );
                })()}
                <div style={{ flex: 1, background: selectedAsset.bookable ? "#e8faf3" : "#f7f8f8", borderRadius: "10px", padding: "12px", border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Bookable</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.875rem", fontWeight: 800, color: selectedAsset.bookable ? "#059669" : "#9ca3af" }}>
                    {selectedAsset.bookable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {selectedAsset.bookable ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WARRANTY TAB */}
          {drawerTab === "warranty" && (() => {
            const ws = getWarrantyStatus(selectedAsset.warrantyEnd);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: ws.bg, borderRadius: "12px", padding: "18px", border: `1px solid ${ws.color}30`, display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: ws.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {ws.color === "#059669" || ws.color === "#0284c7" ? <ShieldCheck size={22} color={ws.color} /> : ws.color === "#dc2626" ? <ShieldX size={22} color={ws.color} /> : <ShieldAlert size={22} color={ws.color} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: ws.color }}>{ws.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: 2 }}>Warranty Status</div>
                  </div>
                </div>
                {[{label:"Provider", value: selectedAsset.warrantyProvider},{label:"Number", value: selectedAsset.warrantyNumber},{label:"Start Date", value: selectedAsset.warrantyStart ? fmtDate(selectedAsset.warrantyStart) : null},{label:"End Date", value: selectedAsset.warrantyEnd ? fmtDate(selectedAsset.warrantyEnd) : null}].map(f => f.value ? (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#fafafa", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                    <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>{f.label}</span>
                    <span style={{ fontSize: "0.78rem", color: "#111827", fontWeight: 700 }}>{f.value}</span>
                  </div>
                ) : null)}
                {canManage && (
                  <button onClick={() => setShowProfileModal(true)}
                    style={{ padding: "9px", background: "#e8faf3", border: "1px solid #bbf7d0", borderRadius: "9px", color: "#1a4a2e", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                    Edit Warranty Details
                  </button>
                )}
              </div>
            );
          })()}

          {/* VENDOR TAB */}
          {drawerTab === "vendor" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "#f7f8f8", borderRadius: "12px", padding: "16px", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Building2 size={16} color="#6b7280" />
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#111827" }}>{selectedAsset.vendorName || "No vendor info"}</span>
                </div>
                {[{label:"Contact Person", v: selectedAsset.vendorContact},{label:"Email", v: selectedAsset.vendorEmail},{label:"Phone", v: selectedAsset.vendorPhone},{label:"PO Number", v: selectedAsset.poNumber},{label:"Invoice Number", v: selectedAsset.invoiceNumber},{label:"Purchase Source", v: selectedAsset.purchaseSource},{label:"Acquisition Method", v: selectedAsset.acquisitionMethod},{label:"Funding Source", v: selectedAsset.fundingSource},{label:"Tax", v: selectedAsset.tax ? `${selectedAsset.tax}%` : null}].map(f => f.v ? (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{f.label}</span>
                    <span style={{ fontSize: "0.75rem", color: "#111827", fontWeight: 600 }}>{f.v}</span>
                  </div>
                ) : null)}
              </div>
              {canManage && (
                <button onClick={() => setShowProfileModal(true)}
                  style={{ padding: "9px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "9px", color: "#1d4ed8", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                  Edit Vendor Details
                </button>
              )}
            </div>
          )}

          {/* DEPRECIATION TAB */}
          {drawerTab === "depreciation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {depreciationData ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {[
                      { label: "Original Cost", value: `₹${depreciationData.originalCost.toLocaleString()}`, color: "#111827" },
                      { label: "Current Value", value: `₹${depreciationData.currentValue.toLocaleString()}`, color: "#059669" },
                      { label: "Depreciated", value: `₹${depreciationData.depreciatedValue.toLocaleString()}`, color: "#dc2626" },
                      { label: "Rate", value: `${depreciationData.depreciationRate}%/yr`, color: "#d97706" },
                    ].map(kpi => (
                      <div key={kpi.label} style={{ background: "#fafafa", borderRadius: "10px", padding: "12px", border: "1px solid #f0f0f0" }}>
                        <div style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{kpi.label}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: kpi.color, marginTop: 4 }}>{kpi.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#fafafa", borderRadius: "10px", padding: "12px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>5-Year Value Projection</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={depreciationData.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => `₹${v.toLocaleString()}`} />
                        <Area type="monotone" dataKey="value" stroke="#059669" fill="#e8faf3" name="Asset Value" />
                        <Area type="monotone" dataKey="depreciated" stroke="#dc2626" fill="#fef2f2" name="Depreciated" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textAlign: "center" }}>Method: {depreciationData.depreciationMethod?.replace("_", " ") || "Not set"}</div>
                </>
              ) : loadingExtra ? (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.825rem" }}>Loading depreciation data…</div>
              ) : (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.825rem" }}>
                  <TrendingDown size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />
                  No depreciation data. Set depreciation method in asset profile.
                </div>
              )}
              {canManage && (
                <button onClick={() => setShowProfileModal(true)}
                  style={{ padding: "9px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "9px", color: "#92400e", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                  Set Depreciation Method
                </button>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {drawerTab === "documents" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {canManage && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const name = fd.get("docName") as string;
                  const type = fd.get("docType") as string;
                  const url = fd.get("docUrl") as string;
                  if (!name || !url) return;
                  const r = await addAssetDocument(selectedAsset.id, name, url, type);
                  if (r?.error) toast.error(r.error);
                  else {
                    toast.success("Document added!");
                    (e.target as HTMLFormElement).reset();
                    loadAssetExtra(selectedAsset.id);
                  }
                }} style={{ background: "#f7f8f8", borderRadius: "10px", padding: "12px", border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280" }}>Add Document</div>
                  <input name="docName" placeholder="Document name" required style={{ padding: "7px 10px", borderRadius: "7px", border: "1px solid #e5e7eb", fontSize: "0.8rem", fontFamily: "inherit" }} />
                  <select name="docType" style={{ padding: "7px 10px", borderRadius: "7px", border: "1px solid #e5e7eb", fontSize: "0.8rem", fontFamily: "inherit" }}>
                    {["INVOICE","WARRANTY","MANUAL","INSURANCE","COMPLIANCE"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input name="docUrl" placeholder="Document URL" required style={{ padding: "7px 10px", borderRadius: "7px", border: "1px solid #e5e7eb", fontSize: "0.8rem", fontFamily: "inherit" }} />
                  <button type="submit" style={{ padding: "7px", background: "#e8faf3", border: "1px solid #bbf7d0", borderRadius: "7px", color: "#1a4a2e", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Upload Document</button>
                </form>
              )}
              {documents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}><FileText size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />No documents uploaded</div>
              ) : documents.map((doc: any) => (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#fafafa", borderRadius: "9px", border: "1px solid #f0f0f0" }}>
                  <FileText size={16} color="#6366f1" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#111827" }}>{doc.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{doc.type} · {fmtDate(doc.createdAt)}</div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: "#059669", display: "flex" }}><Download size={14} /></a>
                  {canManage && <button onClick={async () => { await deleteAssetDocument(doc.id, selectedAsset.id); loadAssetExtra(selectedAsset.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }}><X size={14} /></button>}
                </div>
              ))}
            </div>
          )}

          {/* IMAGES TAB */}
          {drawerTab === "images" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {canManage && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const url = fd.get("imgUrl") as string;
                  const isPrimary = fd.get("isPrimary") === "true";
                  if (!url) return;
                  const r = await addAssetImage(selectedAsset.id, url, isPrimary);
                  if (r?.error) toast.error(r.error);
                  else {
                    toast.success("Image added!");
                    (e.target as HTMLFormElement).reset();
                    loadAssetExtra(selectedAsset.id);
                  }
                }} style={{ background: "#f7f8f8", borderRadius: "10px", padding: "12px", border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280" }}>Add Image URL</div>
                  <input name="imgUrl" placeholder="Image URL" required style={{ padding: "7px 10px", borderRadius: "7px", border: "1px solid #e5e7eb", fontSize: "0.8rem", fontFamily: "inherit" }} />
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", cursor: "pointer" }}>
                    <input type="checkbox" name="isPrimary" value="true" /> Set as primary image
                  </label>
                  <button type="submit" style={{ padding: "7px", background: "#e8faf3", border: "1px solid #bbf7d0", borderRadius: "7px", color: "#1a4a2e", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Add Image</button>
                </form>
              )}
              {images.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}><ImageIcon size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />No images uploaded</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {images.map((img: any) => (
                    <div key={img.id} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: img.isPrimary ? "2px solid #059669" : "1px solid #f0f0f0", aspectRatio: "1" }}>
                      <img src={img.url} alt="asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {img.isPrimary && <span style={{ position: "absolute", top: 4, left: 4, background: "#059669", color: "white", fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>PRIMARY</span>}
                      <a href={img.url} target="_blank" rel="noreferrer" style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "4px", padding: "4px", display: "flex" }}><Download size={12} /></a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TIMELINE TAB */}
          {drawerTab === "timeline" && (
            <div className="activity-timeline">
              <div className="activity-item">
                <div className="activity-dot" style={{ background: "#e8faf3" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6ecfa3" }} />
                </div>
                <div className="activity-content">
                  <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827" }}>Asset Registered</div>
                  <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>Acquired on {fmtDate(selectedAsset.acquisitionDate)}</div>
                </div>
              </div>
              {timeline.map((h: any) => (
                <div key={h.id} className="activity-item">
                  <div className="activity-dot" style={{ background: "#eff6ff" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }} />
                  </div>
                  <div className="activity-content">
                    <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827" }}>{h.action?.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>{h.description}</div>
                    {(h.prevStatus || h.nextStatus) && (
                      <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 2 }}>
                        {h.prevStatus && <span style={{ marginRight: 4, background: "#f3f4f6", padding: "1px 5px", borderRadius: 4 }}>{h.prevStatus}</span>}
                        {h.nextStatus && <span>→ <span style={{ background: "#e8faf3", padding: "1px 5px", borderRadius: 4 }}>{h.nextStatus}</span></span>}
                      </div>
                    )}
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 2 }}>{h.userName || "System"} · {new Date(h.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {selectedAsset.allocations?.map((alloc: any) => (
                <div key={alloc.id} className="activity-item">
                  <div className="activity-dot" style={{ background: "#eff6ff" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }} />
                  </div>
                  <div className="activity-content">
                    <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827" }}>Allocated to {alloc.user?.name || alloc.department?.name || "Department"}</div>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>Return: {alloc.expectedReturnDate ? fmtDate(alloc.expectedReturnDate) : "Indefinite"}</div>
                    <span className={`status-badge status-${alloc.status?.toLowerCase()}`} style={{ marginTop: "4px", display: "inline-flex" }}>{alloc.status}</span>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (!selectedAsset.allocations || selectedAsset.allocations.length === 0) && (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af", fontSize: "0.825rem" }}>No history recorded yet</div>
              )}
            </div>
          )}

          {/* MAINTENANCE Requests Tab */}
          {drawerTab === "maintenance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {!selectedAsset.maintenanceRequests || selectedAsset.maintenanceRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                  <Wrench size={28} color="#e5e7eb" style={{ display: "block", margin: "0 auto 8px" }} />
                  No maintenance history for this asset
                </div>
              ) : (
                selectedAsset.maintenanceRequests.map((req: any) => (
                  <div key={req.id} style={{ padding: "12px 14px", background: "#fafafa", borderRadius: "10px", border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827" }}>{req.description?.slice(0, 60)}</span>
                      <span className={`status-badge priority-${req.priority?.toLowerCase()}`}>{req.priority}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{fmtDate(req.createdAt)} · {req.status}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

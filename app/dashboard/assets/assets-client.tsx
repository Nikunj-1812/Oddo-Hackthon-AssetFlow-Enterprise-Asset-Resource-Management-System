"use client";

import { useState, useMemo, useCallback } from "react";
import { registerAsset, updateAsset, deleteAsset } from "@/features/assets/actions";
import {
  transitionAssetStatus, retireAssetAction, disposeAssetAction,
  updateAssetProfileDetails, addAssetDocument, deleteAssetDocument,
  addAssetImage, getAssetProfileTimeline, getAssetDepreciationData
} from "@/features/assets/lifecycle-actions";
import {
  Search, PlusCircle, FileSpreadsheet, Download, Printer,
  Edit2, Trash2, X, Clock, Wrench, Tag, MapPin,
  DollarSign, Package, CheckCircle, XCircle, ChevronUp, ChevronDown,
  Eye, ShieldCheck, ShieldAlert, ShieldX, TrendingDown, Building2,
  FileText, Image as ImageIcon, Archive
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD

// ── FORM FIELD COMPONENT (must be outside component to avoid re-creation on render) ──
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: "9px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb",
  fontSize: "0.85rem", fontFamily: "inherit", outline: "none", background: "#fafafa",
  transition: "border-color 0.2s",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

interface Props {
  initialAssets: any[];
  categories: any[];
  canManage: boolean;
}

type SortField = "tag" | "name" | "category" | "location" | "cost" | "status";
type SortDir = "asc" | "desc";

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

const VALID_TRANSITIONS: Record<string, string[]> = {
  PURCHASED:         ["REGISTERED", "RETIRED"],
  REGISTERED:        ["AVAILABLE", "RETIRED"],
  AVAILABLE:         ["RESERVED", "ALLOCATED", "UNDER_MAINTENANCE", "RETIRED"],
  RESERVED:          ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE"],
  ALLOCATED:         ["AVAILABLE", "UNDER_MAINTENANCE", "RETIRED", "LOST"],
  UNDER_MAINTENANCE: ["AVAILABLE", "RETIRED"],
  LOST:              ["AVAILABLE", "RETIRED", "DISPOSED"],
  RETIRED:           ["DISPOSED", "AVAILABLE"],
  DISPOSED:          [],
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

const conditionConfig: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "#e8faf3", color: "#047857" },
  GOOD: { bg: "#eff6ff", color: "#1d4ed8" },
  FAIR: { bg: "#fffbeb", color: "#b45309" },
  POOR: { bg: "#ffedd5", color: "#c2410c" },
  DAMAGED: { bg: "#fef2f2", color: "#b91c1c" },
};

export default function AssetsClient({ initialAssets, categories, canManage }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("tag");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Category tracking for dynamic custom fields schema forms
  const [selectedRegCategoryId, setSelectedRegCategoryId] = useState(categories[0]?.id || "");
  const [selectedEditCategoryId, setSelectedEditCategoryId] = useState("");

  // Drawer / modals
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "timeline" | "warranty" | "vendor" | "depreciation" | "documents" | "images" | "maintenance">("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Async loaded data per-asset
  const [timeline, setTimeline] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [depreciationData, setDepreciationData] = useState<any | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Lifecycle helpers ──
  const loadAssetExtra = useCallback(async (assetId: string) => {
    setLoadingExtra(true);
    const [timelineRes, deprRes] = await Promise.all([
      getAssetProfileTimeline(assetId),
      getAssetDepreciationData(assetId),
    ]);
    if (timelineRes.success) {
      setTimeline(timelineRes.timeline || []);
      setDocuments(timelineRes.documents || []);
      setImages(timelineRes.images || []);
    }
    if (deprRes.success) setDepreciationData(deprRes);
    setLoadingExtra(false);
  }, []);

  const openAsset = useCallback((asset: any) => {
    setSelectedAsset(asset);
    setDrawerTab("overview");
    setTimeline([]); setDocuments([]); setImages([]); setDepreciationData(null);
    loadAssetExtra(asset.id);
  }, [loadAssetExtra]);

  // ── Filtering + Sorting ──
  const filteredAssets = useMemo(() => {
    let result = assets.filter((asset) => {
      if (asset.status === "RETIRED" && statusFilter !== "RETIRED") return false;
      if (asset.status === "DISPOSED" && statusFilter !== "DISPOSED") return false;
      const matchSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.tag.toLowerCase().includes(search.toLowerCase()) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
        (asset.vendorName && asset.vendorName.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = !categoryFilter || asset.categoryId === categoryFilter;
      const matchStatus = !statusFilter || asset.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });

    result.sort((a, b) => {
      let va: any, vb: any;
      switch (sortField) {
        case "tag": va = a.tag; vb = b.tag; break;
        case "name": va = a.name; vb = b.name; break;
        case "category": va = a.category?.name; vb = b.category?.name; break;
        case "location": va = a.location; vb = b.location; break;
        case "cost": va = a.cost; vb = b.cost; break;
        case "status": va = a.status; vb = b.status; break;
        default: va = a.tag; vb = b.tag;
      }
      if (typeof va === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });

    return result;
  }, [assets, search, categoryFilter, statusFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={12} color="#d1d5db" />;
    return sortDir === "asc" ? <ChevronUp size={12} color="#92E4BA" /> : <ChevronDown size={12} color="#92E4BA" />;
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRows(next);
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredAssets.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filteredAssets.map((a) => a.id)));
  };

  // ── Actions ──
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); setSuccess(false); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const selectedFields = categories.find(c => c.id === selectedRegCategoryId)?.customFieldsSchema?.fields || [];
    const customFieldsObj: Record<string, string> = {};
    selectedFields.forEach((field: string) => {
      customFieldsObj[field] = fd.get(`custom_field_${field}`) as string || "";
    });
    fd.append("customFieldsData", JSON.stringify(customFieldsObj));
    const result = await registerAsset(fd);
    if (result?.error) { setError(result.error); setSubmitting(false); }
    else { setSuccess(true); setTimeout(() => { setSuccess(false); setSubmitting(false); setShowAddModal(false); window.location.reload(); }, 800); }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setError(null); setSuccess(false); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const selectedFields = categories.find(c => c.id === selectedEditCategoryId)?.customFieldsSchema?.fields || [];
    const customFieldsObj: Record<string, string> = {};
    selectedFields.forEach((field: string) => {
      customFieldsObj[field] = fd.get(`custom_field_${field}`) as string || "";
    });
    fd.append("customFieldsData", JSON.stringify(customFieldsObj));
    const result = await updateAsset(selectedAsset.id, fd);
    if (result?.error) { setError(result.error); setSubmitting(false); }
    else { setSuccess(true); setTimeout(() => { setSuccess(false); setSubmitting(false); setShowEditModal(false); window.location.reload(); }, 800); }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    if (!confirm(`Retire ${selectedAsset.tag} — ${selectedAsset.name}? This will soft-delete the asset.`)) return;
    const result = await deleteAsset(selectedAsset.id);
    if (result?.error) alert(result.error);
    else { alert("Asset retired."); window.location.reload(); }
  };

  const exportCSV = () => {
    const headers = ["Tag", "Name", "Category", "Location", "Condition", "Bookable", "Status", "Cost", "Acquired"];
    const rows = filteredAssets.map((a) => [
      a.tag, a.name, a.category.name, a.location, a.condition,
      a.bookable ? "Yes" : "No", a.status, a.cost,
      fmtDate(a.acquisitionDate),
    ]);
    const csv = "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "assets_export.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const downloadQR = () => {
    const svg = document.getElementById("asset-qr-svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `qr-${selectedAsset.tag}.svg`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const printQR = () => {
    const svg = document.getElementById("asset-qr-svg");
    if (!svg) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>QR Label</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">`);
    w.document.write(`<div style="border:2px solid #000;padding:20px;border-radius:10px;text-align:center;">${svg.outerHTML}<h2 style="margin:10px 0 0">${selectedAsset.tag}</h2><p style="margin:4px 0 0;font-size:14px;color:#555">${selectedAsset.name}</p></div></body></html>`);
    w.document.close(); w.print();
  };



  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "'Inter', sans-serif" }}>

      {/* ── PAGE HEADER ── */}
      <div className="page-header animate-fade-up">
        <div>
          <h1 className="page-title">Asset Directory</h1>
          <p className="page-subtitle">
            {filteredAssets.length} of {assets.filter(a => a.status !== "RETIRED").length} assets · Track, search and manage all resources
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={exportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "#ffffff", color: "#374151", border: "1px solid #e5e7eb", borderRadius: "9px", fontWeight: 600, fontSize: "0.825rem", cursor: "pointer" }}
          >
            <FileSpreadsheet size={14} /> Export
          </button>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#92E4BA", color: "#1a4a2e", border: "none", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(146,228,186,0.35)" }}
            >
              <PlusCircle size={14} /> Register Asset
            </button>
          )}
        </div>
      </div>

      {/* ── SEARCH + FILTER BAR ── */}
      <div
        className="animate-fade-up delay-100"
        style={{ background: "#ffffff", border: "1px solid #f0f0f0", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}
      >
        {/* Search */}
        <div style={{ flex: 2, minWidth: "200px", display: "flex", alignItems: "center", gap: "8px", background: "#f7f8f8", border: "1.5px solid transparent", borderRadius: "9px", padding: "9px 12px", transition: "all 0.2s" }}>
          <Search size={14} color="#9ca3af" />
          <input
            type="text"
            id="asset-search"
            placeholder="Search by tag, name, or serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.835rem", color: "#374151", width: "100%", fontFamily: "inherit" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category */}
        <select
          id="category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ ...selectStyle, minWidth: "160px" }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Status */}
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...selectStyle, minWidth: "160px" }}
        >
          <option value="">All Statuses</option>
          <option value="PURCHASED">Purchased</option>
          <option value="REGISTERED">Registered</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="LOST">Lost</option>
          <option value="DISPOSED">Disposed</option>
          <option value="RETIRED">Retired (Archived)</option>
        </select>

        {/* Active filter chips */}
        {(categoryFilter || statusFilter) && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {categoryFilter && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", background: "#e8faf3", color: "#1a7a4e", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, border: "1px solid #bbf7d0" }}>
                {categories.find(c => c.id === categoryFilter)?.name}
                <button onClick={() => setCategoryFilter("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#1a7a4e", display: "flex" }}>
                  <X size={10} />
                </button>
              </span>
            )}
            {statusFilter && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", background: "#e8faf3", color: "#1a7a4e", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, border: "1px solid #bbf7d0" }}>
                {statusFilter.replace("_", " ")}
                <button onClick={() => setStatusFilter("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#1a7a4e", display: "flex" }}>
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── BULK ACTION BAR ── */}
      {selectedRows.size > 0 && (
        <div
          className="animate-fade-in"
          style={{ background: "#1a4a2e", borderRadius: "10px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "12px" }}
        >
          <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#92E4BA" }}>
            {selectedRows.size} asset{selectedRows.size > 1 ? "s" : ""} selected
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button
              onClick={exportCSV}
              style={{ padding: "7px 14px", background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "7px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FileSpreadsheet size={13} /> Export Selected
            </button>
            <button
              onClick={() => setSelectedRows(new Set())}
              style={{ padding: "7px 14px", background: "transparent", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: "7px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <div className="erp-table-container animate-fade-up delay-200" style={{ overflowX: "auto" }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: "42px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredAssets.length && filteredAssets.length > 0}
                  onChange={toggleAll}
                  style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#92E4BA" }}
                />
              </th>
              {[
                { key: "tag", label: "Tag" },
                { key: "name", label: "Asset Name" },
                { key: "category", label: "Category" },
                { key: "location", label: "Location" },
                { key: "cost", label: "Cost" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key as SortField)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {label} <SortIcon field={key as SortField} />
                  </div>
                </th>
              ))}
              <th>Condition</th>
              <th>Bookable</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}>
                  <Package size={36} color="#e5e7eb" style={{ display: "block", margin: "0 auto 12px" }} />
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#374151" }}>No assets found</div>
                  <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>Try adjusting your search or filter criteria</div>
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const activeAlloc = asset.allocations?.[0];
                const isOverdue = activeAlloc && !activeAlloc.actualReturnDate && activeAlloc.expectedReturnDate && new Date(activeAlloc.expectedReturnDate) < new Date();
                const cond = conditionConfig[asset.condition] || { bg: "#f3f4f6", color: "#374151" };
                const stat = isOverdue 
                  ? { label: "OVERDUE", className: "bg-red-500 text-white font-bold px-2.5 py-1 rounded" }
                  : statusConfig[asset.status] || { label: asset.status, className: "status-retired" };
                return (
                  <tr key={asset.id} style={{ cursor: "pointer", borderLeft: isOverdue ? "4px solid #ef4444" : undefined, backgroundColor: isOverdue ? "#fef2f2/30" : undefined }} onClick={() => openAsset(asset)}>
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(asset.id)}
                        onChange={() => toggleRow(asset.id)}
                        style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#92E4BA" }}
                      />
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "#1a4a2e", background: "#e8faf3", padding: "3px 8px", borderRadius: "6px" }}>
                        {asset.tag}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.835rem" }}>{asset.name}</div>
                      {asset.serialNumber && (
                        <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "monospace" }}>SN: {asset.serialNumber}</div>
                      )}
                    </td>
                    <td style={{ color: "#6b7280" }}>{asset.category?.name}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6b7280" }}>
                        <MapPin size={11} /> {asset.location}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "#111827" }}>
                      ${asset.cost?.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ padding: "3px 9px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700, background: cond.bg, color: cond.color }}>
                        {asset.condition}
                      </span>
                    </td>
                    <td>
                      {asset.bookable
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#059669", fontWeight: 700, fontSize: "0.78rem" }}><CheckCircle size={12} /> Yes</span>
                        : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#9ca3af", fontWeight: 600, fontSize: "0.78rem" }}><XCircle size={12} /> No</span>
                      }
                    </td>
                    <td>
                      <span className={`status-badge ${stat.className}`}>{stat.label}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openAsset(asset); }}
                        style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "#f7f8f8", border: "1px solid #f0f0f0", borderRadius: "7px", color: "#374151", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── ASSET DETAIL DRAWER ── */}
      {selectedAsset && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="animate-slide-right"
            style={{ width: "460px", height: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", borderLeft: "1px solid #f0f0f0", boxShadow: "-20px 0 60px rgba(0,0,0,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: "20px 22px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Asset Details</div>
                  <h2 style={{ margin: "4px 0 2px 0", fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>{selectedAsset.name}</h2>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#1a7a4e", background: "#e8faf3", padding: "2px 7px", borderRadius: "5px", fontWeight: 700 }}>
                      {selectedAsset.tag}
                    </span>
                    <span className={`status-badge ${statusConfig[selectedAsset.status]?.className || "status-retired"}`}>
                      {statusConfig[selectedAsset.status]?.label || selectedAsset.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {canManage && (
                    <>
                      <button
                        onClick={() => setShowEditModal(true)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: "7px", background: "#ffffff", color: "#374151", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", border: "1px solid #fee2e2", borderRadius: "7px", background: "#fef2f2", color: "#ef4444", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        <Trash2 size={12} /> Retire
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedAsset(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", display: "flex" }}>
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "2px", marginTop: "16px", background: "#f7f8f8", borderRadius: "9px", padding: "3px", flexWrap: "wrap" }}>
                {(["overview", "warranty", "vendor", "depreciation", "documents", "images", "timeline", "maintenance"] as const).map((tab) => {
                  const tabLabel: Record<string, string> = {
                    overview: "Overview", warranty: "Warranty", vendor: "Vendor",
                    depreciation: "Depreciation", documents: "Docs", images: "Images",
                    timeline: "History", maintenance: "Maintenance"
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setDrawerTab(tab)}
                      style={{
                        padding: "5px 9px", borderRadius: "7px", border: "none",
                        background: drawerTab === tab ? "#ffffff" : "transparent",
                        color: drawerTab === tab ? "#111827" : "#9ca3af",
                        fontWeight: drawerTab === tab ? 700 : 500,
                        fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit",
                        boxShadow: drawerTab === tab ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {tabLabel[tab]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>

              {/* ── OVERVIEW TAB ── */}
              {drawerTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                  {/* Lifecycle Status + Transition */}
                  {canManage && selectedAsset.status !== "DISPOSED" && (
                    <div style={{ background: "#f7f8f8", borderRadius: "10px", padding: "12px 14px", border: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Lifecycle Actions</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {(VALID_TRANSITIONS[selectedAsset.status] || []).map((s) => (
                          <button key={s} onClick={async () => {
                            const comment = prompt(`Add a comment for transition to ${s} (optional):`) || "";
                            const r = await transitionAssetStatus(selectedAsset.id, s, comment);
                            if (r?.error) alert(r.error);
                            else { alert(`Status moved to ${s}`); window.location.reload(); }
                          }}
                          style={{ padding: "5px 10px", background: statusConfig[s]?.color + "15", border: `1px solid ${statusConfig[s]?.color}30`, borderRadius: "6px", color: statusConfig[s]?.color, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>
                            → {statusConfig[s]?.label || s}
                          </button>
                        ))}
                        {["AVAILABLE","ALLOCATED","REGISTERED","PURCHASED","RESERVED","UNDER_MAINTENANCE","LOST"].includes(selectedAsset.status) && (
                          <button onClick={() => setShowRetireModal(true)}
                            style={{ padding: "5px 10px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "6px", color: "#6b7280", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Archive size={10} /> Retire
                          </button>
                        )}
                        {selectedAsset.status === "RETIRED" && (
                          <button onClick={() => setShowDisposeModal(true)}
                            style={{ padding: "5px 10px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "6px", color: "#dc2626", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Trash2 size={10} /> Dispose
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* QR Code */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", background: "#fafafa", padding: "18px", borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                    <QRCodeSVG
                      id="asset-qr-svg"
                      value={`${typeof window !== "undefined" ? window.location.origin : "https://assetflow.app"}/dashboard/assets?tag=${selectedAsset.tag}`}
                      size={110}
                      level="M"
                      style={{ borderRadius: "4px" }}
                    />
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600 }}>Scan to view asset lifecycle</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={downloadQR} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: "7px", background: "#ffffff", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>
                        <Download size={11} /> Download
                      </button>
                      <button onClick={printQR} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: "7px", background: "#ffffff", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>
                        <Printer size={11} /> Print Label
                      </button>
                    </div>
                  </div>

                  {/* Key fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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

                  {/* Condition + Bookable */}
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

              {/* ── WARRANTY TAB ── */}
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

              {/* ── VENDOR TAB ── */}
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

              {/* ── DEPRECIATION TAB ── */}
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

              {/* ── DOCUMENTS TAB ── */}
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
                      if (r?.error) alert(r.error);
                      else { (e.target as HTMLFormElement).reset(); loadAssetExtra(selectedAsset.id); }
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

              {/* ── IMAGES TAB ── */}
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
                      if (r?.error) alert(r.error);
                      else { (e.target as HTMLFormElement).reset(); loadAssetExtra(selectedAsset.id); }
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

              {/* ── HISTORY / TIMELINE TAB ── */}
              {drawerTab === "timeline" && (
                <div className="activity-timeline">
                  {/* Registration event (always show) */}
                  <div className="activity-item">
                    <div className="activity-dot" style={{ background: "#e8faf3" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#92E4BA" }} />
                    </div>
                    <div className="activity-content">
                      <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827" }}>Asset Registered</div>
                      <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>Acquired on {fmtDate(selectedAsset.acquisitionDate)}</div>
                    </div>
                  </div>
                  {/* DB History */}
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
                  {/* Allocation history */}
                  {selectedAsset.allocations?.map((alloc: any, i: number) => (
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

              {/* ── MAINTENANCE TAB ── */}
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
      )}

      {/* ── REGISTER ASSET MODAL ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setShowAddModal(false)}>
          <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "520px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Register Asset</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#6b7280" }}>Add a new asset to the inventory directory</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <FormField label="Asset Name *">
                <input name="name" required style={inputStyle} placeholder="e.g. Dell Laptop 15" />
              </FormField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Category *">
                  <select name="categoryId" required style={selectStyle} value={selectedRegCategoryId} onChange={(e) => setSelectedRegCategoryId(e.target.value)}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Serial Number">
                  <input name="serialNumber" style={inputStyle} placeholder="Optional" />
                </FormField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Acquisition Cost ($)">
                  <input name="cost" type="number" defaultValue="0" style={inputStyle} />
                </FormField>
                <FormField label="Acquisition Date *">
                  <input name="acquisitionDate" type="date" required style={inputStyle} />
                </FormField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Location *">
                  <input name="location" required style={inputStyle} placeholder="HQ - Floor 3" />
                </FormField>
                <FormField label="Condition">
                  <select name="condition" style={selectStyle}>
                    {["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>
              {/* Dynamic Category Custom Fields */}
              {categories.find(c => c.id === selectedRegCategoryId)?.customFieldsSchema?.fields && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", borderTop: "1px dashed #e5e7eb", paddingTop: "12px", marginTop: "4px" }}>
                  {(categories.find(c => c.id === selectedRegCategoryId)?.customFieldsSchema?.fields || []).map((field: string) => (
                    <FormField key={field} label={field}>
                      <input name={`custom_field_${field}`} style={inputStyle} placeholder={`Enter ${field}`} />
                    </FormField>
                  ))}
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.825rem", color: "#374151", fontWeight: 500 }}>
                <input type="checkbox" name="bookable" value="true" style={{ width: 16, height: 16, accentColor: "#92E4BA", cursor: "pointer" }} />
                Shared resource — bookable by staff
              </label>

              {error && <div style={{ padding: "10px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "0.8rem" }}>{error}</div>}
              {success && <div style={{ padding: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "8px", fontSize: "0.8rem" }}>✓ Asset registered!</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 2, padding: "10px", border: "none", background: "#92E4BA", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  {submitting ? "Registering..." : "Register Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT ASSET MODAL ── */}
      {showEditModal && selectedAsset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 310, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setShowEditModal(false)}>
          <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "520px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Edit Asset — {selectedAsset.tag}</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#6b7280" }}>Update asset information</p>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <FormField label="Asset Name *">
                <input name="name" required defaultValue={selectedAsset.name} style={inputStyle} />
              </FormField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Category *">
                  <select name="categoryId" required value={selectedEditCategoryId} onChange={(e) => setSelectedEditCategoryId(e.target.value)} style={selectStyle}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Serial Number">
                  <input name="serialNumber" defaultValue={selectedAsset.serialNumber || ""} style={inputStyle} />
                </FormField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Cost ($)">
                  <input name="cost" type="number" defaultValue={selectedAsset.cost} style={inputStyle} />
                </FormField>
                <FormField label="Acquisition Date *">
                  <input name="acquisitionDate" type="date" required defaultValue={new Date(selectedAsset.acquisitionDate).toISOString().split("T")[0]} style={inputStyle} />
                </FormField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Location *">
                  <input name="location" required defaultValue={selectedAsset.location} style={inputStyle} />
                </FormField>
                <FormField label="Condition">
                  <select name="condition" defaultValue={selectedAsset.condition} style={selectStyle}>
                    {["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>
              {/* Dynamic Category Custom Fields */}
              {categories.find(c => c.id === selectedEditCategoryId)?.customFieldsSchema?.fields && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", borderTop: "1px dashed #e5e7eb", paddingTop: "12px", marginTop: "4px" }}>
                  {(categories.find(c => c.id === selectedEditCategoryId)?.customFieldsSchema?.fields || []).map((field: string) => {
                    const currentVal = selectedAsset.customFieldsData?.[field] || "";
                    return (
                      <FormField key={field} label={field}>
                        <input name={`custom_field_${field}`} defaultValue={currentVal} style={inputStyle} placeholder={`Enter ${field}`} />
                      </FormField>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Status">
                  <select name="status" defaultValue={selectedAsset.status} style={selectStyle}>
                    {["PURCHASED", "REGISTERED", "AVAILABLE", "RESERVED", "ALLOCATED", "UNDER_MAINTENANCE", "LOST", "RETIRED", "DISPOSED"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </FormField>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.825rem", color: "#374151", fontWeight: 500 }}>
                    <input type="checkbox" name="bookable" value="true" defaultChecked={selectedAsset.bookable} style={{ width: 16, height: 16, accentColor: "#92E4BA" }} />
                    Bookable
                  </label>
                </div>
              </div>

              {error && <div style={{ padding: "10px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "0.8rem" }}>{error}</div>}
              {success && <div style={{ padding: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "8px", fontSize: "0.8rem" }}>✓ Asset updated!</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 2, padding: "10px", border: "none", background: "#92E4BA", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RETIRE MODAL ── */}
      {showRetireModal && selectedAsset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setShowRetireModal(false)}>
          <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Archive size={24} color="#6b7280" />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>Retire Asset</h3>
              <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#6b7280" }}>This will archive the asset and remove it from active inventory.</p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const reason = fd.get("reason") as string;
              const r = await retireAssetAction(selectedAsset.id, reason);
              if (r?.error) alert(r.error);
              else { setShowRetireModal(false); window.location.reload(); }
            }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea name="reason" required placeholder="Reason for retiring this asset..." rows={3}
                style={{ padding: "10px", borderRadius: "9px", border: "1px solid #e5e7eb", fontSize: "0.83rem", fontFamily: "inherit", resize: "vertical" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => setShowRetireModal(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: "10px", border: "none", background: "#6b7280", color: "white", borderRadius: "9px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Confirm Retire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DISPOSE MODAL ── */}
      {showDisposeModal && selectedAsset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setShowDisposeModal(false)}>
          <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Trash2 size={24} color="#dc2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>Dispose Asset</h3>
              <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#6b7280" }}>This is a permanent action. The asset will be marked as Disposed and removed from all workflows.</p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const reason = fd.get("reason") as string;
              const method = fd.get("method") as string;
              const r = await disposeAssetAction(selectedAsset.id, reason, method);
              if (r?.error) alert(r.error);
              else { setShowDisposeModal(false); window.location.reload(); }
            }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <select name="method" required style={{ padding: "10px", borderRadius: "9px", border: "1px solid #e5e7eb", fontSize: "0.83rem", fontFamily: "inherit" }}>
                <option value="">Select disposal method...</option>
                {["AUCTION", "DONATION", "SCRAPPED", "SOLD", "TRANSFERRED", "DESTROYED"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <textarea name="reason" required placeholder="Reason for disposal..." rows={3}
                style={{ padding: "10px", borderRadius: "9px", border: "1px solid #e5e7eb", fontSize: "0.83rem", fontFamily: "inherit", resize: "vertical" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => setShowDisposeModal(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: "10px", border: "none", background: "#dc2626", color: "white", borderRadius: "9px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Confirm Dispose
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PROFILE DETAILS MODAL ── */}
      {showProfileModal && selectedAsset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setShowProfileModal(false)}>
          <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "560px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Enterprise Profile</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#6b7280" }}>Warranty · Vendor · Depreciation · Purchase Details</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const r = await updateAssetProfileDetails(selectedAsset.id, fd);
              if (r?.error) alert(r.error);
              else { setShowProfileModal(false); loadAssetExtra(selectedAsset.id); }
            }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#374151", padding: "6px 0 2px", borderBottom: "1px solid #f0f0f0" }}>🛡 Warranty</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <FormField label="Provider">
                  <input name="warrantyProvider" defaultValue={selectedAsset.warrantyProvider || ""} style={inputStyle} />
                </FormField>
                <FormField label="Warranty Number">
                  <input name="warrantyNumber" defaultValue={selectedAsset.warrantyNumber || ""} style={inputStyle} />
                </FormField>
                <FormField label="Start Date">
                  <input name="warrantyStart" type="date" defaultValue={selectedAsset.warrantyStart ? new Date(selectedAsset.warrantyStart).toISOString().split("T")[0] : ""} style={inputStyle} />
                </FormField>
                <FormField label="End Date">
                  <input name="warrantyEnd" type="date" defaultValue={selectedAsset.warrantyEnd ? new Date(selectedAsset.warrantyEnd).toISOString().split("T")[0] : ""} style={inputStyle} />
                </FormField>
              </div>

              <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#374151", padding: "6px 0 2px", borderBottom: "1px solid #f0f0f0" }}>🏢 Vendor & Purchase</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <FormField label="Vendor Name">
                  <input name="vendorName" defaultValue={selectedAsset.vendorName || ""} style={inputStyle} />
                </FormField>
                <FormField label="Vendor Contact">
                  <input name="vendorContact" defaultValue={selectedAsset.vendorContact || ""} style={inputStyle} />
                </FormField>
                <FormField label="Vendor Email">
                  <input name="vendorEmail" type="email" defaultValue={selectedAsset.vendorEmail || ""} style={inputStyle} />
                </FormField>
                <FormField label="Vendor Phone">
                  <input name="vendorPhone" defaultValue={selectedAsset.vendorPhone || ""} style={inputStyle} />
                </FormField>
                <FormField label="PO Number">
                  <input name="poNumber" defaultValue={selectedAsset.poNumber || ""} style={inputStyle} />
                </FormField>
                <FormField label="Invoice Number">
                  <input name="invoiceNumber" defaultValue={selectedAsset.invoiceNumber || ""} style={inputStyle} />
                </FormField>
                <FormField label="Current Value (₹)">
                  <input name="currentValue" type="number" defaultValue={selectedAsset.currentValue || ""} style={inputStyle} />
                </FormField>
                <FormField label="Currency">
                  <select name="currency" defaultValue={selectedAsset.currency || "INR"} style={selectStyle}>
                    {["INR","USD","EUR","GBP","AED"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Acquisition Method">
                  <select name="acquisitionMethod" defaultValue={selectedAsset.acquisitionMethod || ""} style={selectStyle}>
                    <option value="">Select...</option>
                    {["PURCHASE","LEASE","DONATION","TRANSFER","RENTAL"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>
                <FormField label="Tax %">
                  <input name="tax" type="number" step="0.01" defaultValue={selectedAsset.tax || "0"} style={inputStyle} />
                </FormField>
              </div>

              <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#374151", padding: "6px 0 2px", borderBottom: "1px solid #f0f0f0" }}>📉 Depreciation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <FormField label="Method">
                  <select name="depreciationMethod" defaultValue={selectedAsset.depreciationMethod || "STRAIGHT_LINE"} style={selectStyle}>
                    <option value="STRAIGHT_LINE">Straight Line</option>
                    <option value="REDUCING_BALANCE">Reducing Balance</option>
                  </select>
                </FormField>
                <FormField label="Annual Rate %">
                  <input name="depreciationRate" type="number" step="0.1" min="1" max="100" defaultValue={selectedAsset.depreciationRate || "10"} style={inputStyle} />
                </FormField>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowProfileModal(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 2, padding: "10px", border: "none", background: "#92E4BA", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Save Profile Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

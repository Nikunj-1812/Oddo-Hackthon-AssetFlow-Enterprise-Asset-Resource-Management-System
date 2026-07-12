"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { registerAsset, updateAsset, deleteAsset } from "@/features/assets/actions";
import {
  getAssetProfileTimeline, getAssetDepreciationData
} from "@/features/assets/lifecycle-actions";
import { AssetDetailDrawer } from "./components/asset-detail-drawer";
import { RegisterAssetModal, EditAssetModal, RetireAssetModal, DisposeAssetModal, ProfileDetailsModal } from "./components/asset-modals";
import {
  Search, PlusCircle, FileSpreadsheet, Download, Printer,
  Edit2, Trash2, X, Clock, Wrench, Tag, MapPin,
  DollarSign, Package, CheckCircle, XCircle, ChevronUp, ChevronDown,
  Eye, ShieldCheck, ShieldAlert, ShieldX, TrendingDown, Building2,
  FileText, Image as ImageIcon, Archive
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") || "");

  useEffect(() => {
    const searchVal = searchParams.get("search") || "";
    setSearch(searchVal);
  }, [searchParams]);
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
    return sortDir === "asc" ? <ChevronUp size={12} color="#6ecfa3" /> : <ChevronDown size={12} color="#6ecfa3" />;
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
    selectedFields.forEach((field: any) => {
      const fieldName = typeof field === "object" && field !== null && "name" in field ? field.name : String(field);
      customFieldsObj[fieldName] = fd.get(`custom_field_${fieldName}`) as string || "";
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
    selectedFields.forEach((field: any) => {
      const fieldName = typeof field === "object" && field !== null && "name" in field ? field.name : String(field);
      customFieldsObj[fieldName] = fd.get(`custom_field_${fieldName}`) as string || "";
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
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Asset retired.");
      setTimeout(() => window.location.reload(), 1000);
    }
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
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "#6ecfa3", color: "#1a4a2e", border: "none", borderRadius: "9px", fontWeight: 700, fontSize: "0.825rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(146,228,186,0.35)" }}
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
          <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#6ecfa3" }}>
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
                  style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#6ecfa3" }}
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
                        style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#6ecfa3" }}
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
                      ₹{asset.cost?.toLocaleString()}
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
        <AssetDetailDrawer
          selectedAsset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          drawerTab={drawerTab}
          setDrawerTab={setDrawerTab}
          canManage={canManage}
          timeline={timeline}
          documents={documents}
          images={images}
          depreciationData={depreciationData}
          loadingExtra={loadingExtra}
          loadAssetExtra={loadAssetExtra}
          setShowProfileModal={setShowProfileModal}
          setShowRetireModal={setShowRetireModal}
        />
      )}

      {/* ── REGISTER ASSET MODAL ── */}
      <RegisterAssetModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleRegister}
        categories={categories}
        selectedCategoryId={selectedRegCategoryId}
        setSelectedCategoryId={setSelectedRegCategoryId}
        submitting={submitting}
        error={error}
        success={success}
      />

      {/* ── EDIT ASSET MODAL ── */}
      <EditAssetModal
        show={showEditModal}
        selectedAsset={selectedAsset}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEdit}
        categories={categories}
        selectedCategoryId={selectedEditCategoryId}
        setSelectedCategoryId={setSelectedEditCategoryId}
        submitting={submitting}
        error={error}
        success={success}
      />

      {/* ── RETIRE MODAL ── */}
      <RetireAssetModal
        show={showRetireModal}
        selectedAsset={selectedAsset}
        onClose={() => setShowRetireModal(false)}
        onSuccess={() => {
          setShowRetireModal(false);
          window.location.reload();
        }}
      />

      {/* ── DISPOSE MODAL ── */}
      <DisposeAssetModal
        show={showDisposeModal}
        selectedAsset={selectedAsset}
        onClose={() => setShowDisposeModal(false)}
        onSuccess={() => {
          setShowDisposeModal(false);
          window.location.reload();
        }}
      />

      {/* ── PROFILE DETAILS MODAL ── */}
      <ProfileDetailsModal
        show={showProfileModal}
        selectedAsset={selectedAsset}
        onClose={() => setShowProfileModal(false)}
        onSuccess={() => {
          setShowProfileModal(false);
          loadAssetExtra(selectedAsset.id);
        }}
      />
    </div>
  );
}

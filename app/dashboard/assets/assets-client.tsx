"use client";

import { useState, useMemo } from "react";
import { registerAsset, updateAsset, deleteAsset } from "@/features/assets/actions";
import {
  Search, Filter, PlusCircle, FileSpreadsheet, Download, Printer,
  Edit2, Trash2, X, QrCode, Clock, Wrench, Tag, MapPin,
  DollarSign, Package, CheckCircle, XCircle, ChevronUp, ChevronDown,
  SlidersHorizontal, Eye,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  initialAssets: any[];
  categories: any[];
  canManage: boolean;
}

type SortField = "tag" | "name" | "category" | "location" | "cost" | "status";
type SortDir = "asc" | "desc";

const statusConfig: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "Available", className: "status-available" },
  ALLOCATED: { label: "Allocated", className: "status-allocated" },
  UNDER_MAINTENANCE: { label: "Under Maintenance", className: "status-maintenance" },
  RETIRED: { label: "Retired", className: "status-retired" },
  LOST: { label: "Lost", className: "status-lost" },
  DISPOSED: { label: "Disposed", className: "status-lost" },
};

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

  // Drawer / modals
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "timeline" | "maintenance">("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Filtering + Sorting ──
  const filteredAssets = useMemo(() => {
    let result = assets.filter((asset) => {
      if (asset.status === "RETIRED" && statusFilter !== "RETIRED") return false;
      const matchSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.tag.toLowerCase().includes(search.toLowerCase()) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(search.toLowerCase()));
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
    const result = await registerAsset(new FormData(e.currentTarget));
    if (result?.error) { setError(result.error); setSubmitting(false); }
    else { setSuccess(true); setTimeout(() => { setSuccess(false); setSubmitting(false); setShowAddModal(false); window.location.reload(); }, 800); }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setError(null); setSuccess(false); setSubmitting(true);
    const result = await updateAsset(selectedAsset.id, new FormData(e.currentTarget));
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
      new Date(a.acquisitionDate).toLocaleDateString(),
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

  // ── FORM FIELDS ──
  const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = {
    padding: "9px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb",
    fontSize: "0.85rem", fontFamily: "inherit", outline: "none", background: "#fafafa",
    transition: "border-color 0.2s",
  };

  const selectStyle = { ...inputStyle, cursor: "pointer" };

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
          <option value="AVAILABLE">Available</option>
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
                const cond = conditionConfig[asset.condition] || { bg: "#f3f4f6", color: "#374151" };
                const stat = statusConfig[asset.status] || { label: asset.status, className: "status-retired" };
                return (
                  <tr key={asset.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedAsset(asset); setDrawerTab("overview"); }}>
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
                        onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setDrawerTab("overview"); }}
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
              <div style={{ display: "flex", gap: "2px", marginTop: "16px", background: "#f7f8f8", borderRadius: "9px", padding: "3px" }}>
                {(["overview", "timeline", "maintenance"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    style={{
                      flex: 1, padding: "7px", borderRadius: "7px", border: "none",
                      background: drawerTab === tab ? "#ffffff" : "transparent",
                      color: drawerTab === tab ? "#111827" : "#9ca3af",
                      fontWeight: drawerTab === tab ? 700 : 500,
                      fontSize: "0.775rem", cursor: "pointer", fontFamily: "inherit",
                      boxShadow: drawerTab === tab ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.15s ease",
                      textTransform: "capitalize",
                    }}
                  >
                    {tab === "timeline" ? "History" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>

              {/* ── OVERVIEW TAB ── */}
              {drawerTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

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
                      { icon: DollarSign, label: "Acquisition Cost", value: `$${selectedAsset.cost?.toLocaleString()}` },
                      { icon: MapPin, label: "Location", value: selectedAsset.location },
                      { icon: Clock, label: "Acquired", value: new Date(selectedAsset.acquisitionDate).toLocaleDateString() },
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

              {/* ── HISTORY / TIMELINE TAB ── */}
              {drawerTab === "timeline" && (
                <div className="activity-timeline">
                  {/* Registration event */}
                  <div className="activity-item">
                    <div className="activity-dot" style={{ background: "#e8faf3" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#92E4BA" }} />
                    </div>
                    <div className="activity-content">
                      <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827" }}>Asset Registered</div>
                      <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>
                        Acquired on {new Date(selectedAsset.acquisitionDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {selectedAsset.allocations?.length > 0 ? (
                    selectedAsset.allocations.map((alloc: any, i: number) => (
                      <div key={alloc.id} className="activity-item">
                        <div className="activity-dot" style={{ background: "#eff6ff" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }} />
                        </div>
                        <div className="activity-content">
                          <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#111827" }}>
                            Allocated to {alloc.user?.name || alloc.department?.name || "Department"}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>
                            Return: {alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : "Indefinite"}
                          </div>
                          <span className={`status-badge status-${alloc.status?.toLowerCase()}`} style={{ marginTop: "4px", display: "inline-flex" }}>
                            {alloc.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af", fontSize: "0.825rem" }}>
                      No allocation history recorded
                    </div>
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
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                          {new Date(req.createdAt).toLocaleDateString()} · {req.status}
                        </div>
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
                  <select name="categoryId" required style={selectStyle}>
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
                  <select name="categoryId" required defaultValue={selectedAsset.categoryId} style={selectStyle}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Status">
                  <select name="status" defaultValue={selectedAsset.status} style={selectStyle}>
                    {["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "LOST", "DISPOSED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
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
    </div>
  );
}

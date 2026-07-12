"use client";

import { useState } from "react";
import { registerAsset, updateAsset, deleteAsset } from "@/features/assets/actions";
import { Check, X, History, PlusCircle, FileSpreadsheet, Download, Printer, Edit2, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  initialAssets: any[];
  categories: any[];
  canManage: boolean;
}

export default function AssetsClient({ initialAssets, categories, canManage }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Submit feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Drawer Detail State
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerAsset(formData);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubmitting(false);
        setShowAddModal(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateAsset(selectedAsset.id, formData);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubmitting(false);
        setShowEditModal(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    if (!confirm(`Are you sure you want to retire asset ${selectedAsset.tag} (${selectedAsset.name})? This will soft-delete the asset.`)) return;

    setError(null);
    const result = await deleteAsset(selectedAsset.id);

    if (result?.error) {
      alert(result.error);
    } else {
      alert("Asset retired successfully.");
      window.location.reload();
    }
  };

  const filteredAssets = assets.filter((asset) => {
    // Exclude retired status from main search unless specifically filtering for it
    if (asset.status === "RETIRED" && statusFilter !== "RETIRED") return false;

    const matchSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.tag.toLowerCase().includes(search.toLowerCase()) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(search.toLowerCase()));

    const matchCategory = categoryFilter === "" || asset.categoryId === categoryFilter;
    const matchStatus = statusFilter === "" || asset.status === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  // Export filtered inventory list to CSV
  const exportCSV = () => {
    const headers = ["Tag", "Asset Name", "Category", "Location", "Condition", "Bookable", "Status", "Cost", "Acquisition Date"];
    const rows = filteredAssets.map((a) => [
      a.tag,
      a.name,
      a.category.name,
      a.location,
      a.condition,
      a.bookable ? "Yes" : "No",
      a.status,
      a.cost,
      new Date(a.acquisitionDate).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "assets_inventory_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // QR Code download
  const downloadQR = () => {
    const svg = document.getElementById("asset-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asset-qr-${selectedAsset.tag}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // QR Code printing
  const printQR = () => {
    const svg = document.getElementById("asset-qr-svg");
    if (!svg) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write("<html><head><title>Print QR Label</title></head><body style='display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;'>");
    printWindow.document.write("<div style='border:2px solid #000;padding:20px;border-radius:10px;text-align:center;'>");
    printWindow.document.write(svg.outerHTML);
    printWindow.document.write(`<h2 style='margin:10px 0 0 0;'>${selectedAsset.tag}</h2>`);
    printWindow.document.write(`<p style='margin:4px 0 0 0;font-size:14px;color:#555;'>${selectedAsset.name}</p>`);
    printWindow.document.write("</div>");
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>
            Asset Inventory Directory
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
            Track and search all physical and shared resources, check conditions, and monitor lifecycles.
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={exportCSV}
            style={{
              padding: "10px 18px",
              backgroundColor: "#ffffff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>

          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#92E4BA",
                color: "#1e293b",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 10px rgba(146,228,186,0.2)",
                transition: "all 0.2s ease",
              }}
            >
              <PlusCircle size={16} /> Register Asset
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div 
        style={{ 
          backgroundColor: "#ffffff", 
          padding: "1.25rem", 
          borderRadius: "14px", 
          border: "1px solid #e5e7eb",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ flex: 2, minWidth: "220px", display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", backgroundColor: "#ffffff" }}>
          <input
            type="text"
            placeholder="Search by tag, name, or serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", fontSize: "0.85rem", color: "#374151" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "150px" }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "#ffffff", fontSize: "0.85rem", color: "#374151", outline: "none" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "150px" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "#ffffff", fontSize: "0.85rem", color: "#374151", outline: "none" }}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="LOST">Lost</option>
            <option value="DISPOSED">Disposed</option>
            <option value="RETIRED">Retired (Archived)</option>
          </select>
        </div>
      </div>

      {/* ASSET GRID TABLE */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e5e7eb", overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", backgroundColor: "#fafafa" }}>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Tag</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Asset Name</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Category</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Location</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Condition</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Bookable</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Status</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                  No assets found matching parameters.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr key={asset.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.2s" }} className="table-row-hover">
                  <td style={{ padding: "14px 18px", fontWeight: 700, color: "#111827" }}>{asset.tag}</td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: "#111827" }}>{asset.name}</td>
                  <td style={{ padding: "14px 18px", color: "#4b5563" }}>{asset.category.name}</td>
                  <td style={{ padding: "14px 18px", color: "#4b5563" }}>{asset.location}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, backgroundColor: "#f3f4f6", color: "#374151", padding: "4px 8px", borderRadius: "6px" }}>
                      {asset.condition}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {asset.bookable ? (
                      <span style={{ color: "#059669", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
                        <Check size={14} /> Yes
                      </span>
                    ) : (
                      <span style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
                        <X size={14} /> No
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        backgroundColor:
                          asset.status === "AVAILABLE"
                            ? "#ecfdf5"
                            : asset.status === "ALLOCATED"
                            ? "#eff6ff"
                            : asset.status === "UNDER_MAINTENANCE"
                            ? "#fffbeb"
                            : asset.status === "RETIRED"
                            ? "#f3f4f6"
                            : "#fef2f2",
                        color:
                          asset.status === "AVAILABLE"
                            ? "#047857"
                            : asset.status === "ALLOCATED"
                            ? "#1d4ed8"
                            : asset.status === "UNDER_MAINTENANCE"
                            ? "#b45309"
                            : asset.status === "RETIRED"
                            ? "#374151"
                            : "#b91c1c",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {asset.status.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#6366f1",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <History size={14} /> Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL HISTORY SLIDE-OVER DRAWER */}
      {selectedAsset && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "420px",
            height: "100vh",
            backgroundColor: "#ffffff",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.06)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #e5e7eb",
          }}
        >
          <div style={{ padding: "24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>
                Asset Management — {selectedAsset.tag}
              </h2>
            </div>
            <button onClick={() => setSelectedAsset(null)} style={{ border: "none", background: "transparent", fontSize: "1.3rem", cursor: "pointer", color: "#9ca3af" }}>
              ✕
            </button>
          </div>
          
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1, overflowY: "auto" }}>
            {/* QR Label System */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", backgroundColor: "#fafafa", padding: "1rem", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <QRCodeSVG
                id="asset-qr-svg"
                value={`http://localhost:3000/dashboard/assets?tag=${selectedAsset.tag}`}
                size={120}
                level="M"
              />
              <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}>Scan to view lifecycle url</span>
              
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  onClick={downloadQR}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Download size={12} /> Download
                </button>
                <button
                  onClick={printQR}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Printer size={12} /> Print Label
                </button>
              </div>
            </div>

            {/* Asset Fields details */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.72rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Name</strong>
                <span style={{ fontSize: "0.9rem", color: "#111827", fontWeight: 600 }}>{selectedAsset.name}</span>
              </div>
              {canManage && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setShowEditModal(true)}
                    style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600, backgroundColor: "#ffffff" }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{ border: "1px solid #fee2e2", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                  >
                    <Trash2 size={12} /> Retire
                  </button>
                </div>
              )}
            </div>

            <div>
              <strong style={{ display: "block", fontSize: "0.72rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Serial Number</strong>
              <span style={{ fontSize: "0.9rem", color: "#111827" }}>{selectedAsset.serialNumber || "-"}</span>
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "0.72rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Cost</strong>
              <span style={{ fontSize: "0.9rem", color: "#111827", fontWeight: 600 }}>${selectedAsset.cost.toLocaleString()}</span>
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "0.72rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Condition</strong>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: "6px" }}>{selectedAsset.condition}</span>
            </div>

            <hr style={{ border: "none", borderBottom: "1px solid #e5e7eb", margin: "1rem 0" }} />

            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", fontWeight: 800, color: "#111827" }}>Lifecycle Log Trail</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderLeft: "2px solid #e5e7eb", paddingLeft: "14px" }}>
              <div style={{ fontSize: "0.825rem", position: "relative" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#92E4BA", position: "absolute", left: "-19px", top: "5px" }} />
                <span style={{ color: "#111827", fontWeight: 700 }}>Asset Registered</span>
                <div style={{ color: "#6b7280", fontSize: "0.72rem", marginTop: "2px" }}>
                  Acquired on {new Date(selectedAsset.acquisitionDate).toLocaleDateString()}
                </div>
              </div>
              {selectedAsset.allocations?.map((alloc: any) => (
                <div key={alloc.id} style={{ fontSize: "0.825rem", position: "relative" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6", position: "absolute", left: "-19px", top: "5px" }} />
                  <span style={{ color: "#111827", fontWeight: 700 }}>Allocated Handover</span>
                  <div>Assigned to {alloc.user?.name || "Department"}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.72rem", marginTop: "2px" }}>
                    Expected Return: {alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : "Indefinite"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REGISTER ASSET MODAL */}
      {showAddModal && (
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
              maxWidth: "500px",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              position: "relative",
            }}
          >
            <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", fontWeight: 800, color: "#111827" }}>
              Register Corporate Asset
            </h2>
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Asset Name</label>
                <input name="name" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Category</label>
                  <select name="categoryId" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Serial Number</label>
                  <input name="serialNumber" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Acquisition Cost ($)</label>
                  <input name="cost" type="number" defaultValue="0" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Acquisition Date</label>
                  <input name="acquisitionDate" type="date" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Location</label>
                  <input name="location" required placeholder="HQ - Floor 3" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Condition</label>
                  <select name="condition" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0" }}>
                <input type="checkbox" name="bookable" value="true" id="bookable-cb" style={{ width: "16px", height: "16px", borderRadius: "4px", cursor: "pointer" }} />
                <label htmlFor="bookable-cb" style={{ fontSize: "0.85rem", color: "#374151", cursor: "pointer", fontWeight: 600 }}>
                  Shared resource / Bookable by staff
                </label>
              </div>

              {error && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</span>}
              {success && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Asset registered successfully!</span>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #d1d5db", background: "transparent", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "10px 24px", borderRadius: "8px", border: "none", backgroundColor: "#92E4BA", color: "#1e293b", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
                >
                  {submitting ? "Saving..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ASSET MODAL */}
      {showEditModal && selectedAsset && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 110,
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
              maxWidth: "500px",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              position: "relative",
            }}
          >
            <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", fontWeight: 800, color: "#111827" }}>
              Edit Asset details — {selectedAsset.tag}
            </h2>
            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Asset Name</label>
                <input name="name" defaultValue={selectedAsset.name} required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Category</label>
                  <select name="categoryId" defaultValue={selectedAsset.categoryId} required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Serial Number</label>
                  <input name="serialNumber" defaultValue={selectedAsset.serialNumber || ""} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Acquisition Cost ($)</label>
                  <input name="cost" type="number" defaultValue={selectedAsset.cost} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Acquisition Date</label>
                  <input name="acquisitionDate" type="date" defaultValue={new Date(selectedAsset.acquisitionDate).toISOString().split("T")[0]} required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Location</label>
                  <input name="location" defaultValue={selectedAsset.location} required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Condition</label>
                  <select name="condition" defaultValue={selectedAsset.condition} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Lifecycle Status</label>
                  <select name="status" defaultValue={selectedAsset.status} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                    <option value="AVAILABLE">Available</option>
                    <option value="ALLOCATED">Allocated</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                    <option value="LOST">Lost</option>
                    <option value="DISPOSED">Disposed</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", marginTop: "20px" }}>
                  <input type="checkbox" name="bookable" value="true" defaultChecked={selectedAsset.bookable} id="edit-bookable-cb" style={{ width: "16px", height: "16px", borderRadius: "4px", cursor: "pointer" }} />
                  <label htmlFor="edit-bookable-cb" style={{ fontSize: "0.85rem", color: "#374151", cursor: "pointer", fontWeight: 600 }}>
                    Bookable
                  </label>
                </div>
              </div>

              {error && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</span>}
              {success && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Asset updated successfully!</span>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #d1d5db", background: "transparent", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "10px 24px", borderRadius: "8px", border: "none", backgroundColor: "#92E4BA", color: "#1e293b", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
                >
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

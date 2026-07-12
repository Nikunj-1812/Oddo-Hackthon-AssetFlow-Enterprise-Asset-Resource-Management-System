"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Archive, Trash2 } from "lucide-react";
import {
  retireAssetAction, disposeAssetAction, updateAssetProfileDetails
} from "@/features/assets/lifecycle-actions";

const inputStyle = {
  padding: "9px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb",
  fontSize: "0.85rem", fontFamily: "inherit", outline: "none", background: "#fafafa",
  transition: "border-color 0.2s",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

// ── REGISTER ASSET MODAL ──
interface RegisterModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  categories: any[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  submitting: boolean;
  error: string | null;
  success: boolean;
}

export function RegisterAssetModal({
  show,
  onClose,
  onSubmit,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  submitting,
  error,
  success,
}: RegisterModalProps) {
  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
      <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "520px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Register Asset</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#6b7280" }}>Add a new asset to the inventory directory</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField label="Asset Name *">
            <input name="name" required style={inputStyle} placeholder="e.g. Dell Laptop 15" />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <FormField label="Category *">
              <select name="categoryId" required style={selectStyle} value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Serial Number">
              <input name="serialNumber" style={inputStyle} placeholder="Optional" />
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <FormField label="Acquisition Cost (₹)">
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
          {categories.find(c => c.id === selectedCategoryId)?.customFieldsSchema?.fields && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", borderTop: "1px dashed #e5e7eb", paddingTop: "12px", marginTop: "4px" }}>
              {(categories.find(c => c.id === selectedCategoryId)?.customFieldsSchema?.fields || []).map((field: any) => {
                const fieldName = typeof field === "object" && field !== null && "name" in field ? field.name : String(field);
                const fieldLabel = typeof field === "object" && field !== null && "label" in field ? field.label : fieldName;
                return (
                  <FormField key={fieldName} label={fieldLabel}>
                    <input name={`custom_field_${fieldName}`} style={inputStyle} placeholder={`Enter ${fieldLabel}`} />
                  </FormField>
                );
              })}
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.825rem", color: "#374151", fontWeight: 500 }}>
            <input type="checkbox" name="bookable" value="true" style={{ width: 16, height: 16, accentColor: "#6ecfa3", cursor: "pointer" }} />
            Shared resource — bookable by staff
          </label>

          {error && <div style={{ padding: "10px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "0.8rem" }}>{error}</div>}
          {success && <div style={{ padding: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "8px", fontSize: "0.8rem" }}>✓ Asset registered!</div>}

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ flex: 2, padding: "10px", border: "none", background: "#6ecfa3", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
              {submitting ? "Registering..." : "Register Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── EDIT ASSET MODAL ──
interface EditModalProps {
  show: boolean;
  selectedAsset: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  categories: any[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  submitting: boolean;
  error: string | null;
  success: boolean;
}

export function EditAssetModal({
  show,
  selectedAsset,
  onClose,
  onSubmit,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  submitting,
  error,
  success
}: EditModalProps) {
  if (!show || !selectedAsset) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 310, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
      <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "520px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Edit Asset — {selectedAsset.tag}</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#6b7280" }}>Update asset information</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField label="Asset Name *">
            <input name="name" required defaultValue={selectedAsset.name} style={inputStyle} />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <FormField label="Category *">
              <select name="categoryId" required value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} style={selectStyle}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Serial Number">
              <input name="serialNumber" defaultValue={selectedAsset.serialNumber || ""} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <FormField label="Cost (₹)">
              <input name="cost" type="number" defaultValue={selectedAsset.cost} style={inputStyle} />
            </FormField>
            <FormField label="Acquisition Date *">
              <input name="acquisitionDate" type="date" required defaultValue={selectedAsset.acquisitionDate ? new Date(selectedAsset.acquisitionDate).toISOString().split("T")[0] : ""} style={inputStyle} />
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
          {categories.find(c => c.id === selectedCategoryId)?.customFieldsSchema?.fields && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", borderTop: "1px dashed #e5e7eb", paddingTop: "12px", marginTop: "4px" }}>
              {(categories.find(c => c.id === selectedCategoryId)?.customFieldsSchema?.fields || []).map((field: any) => {
                const fieldName = typeof field === "object" && field !== null && "name" in field ? field.name : String(field);
                const fieldLabel = typeof field === "object" && field !== null && "label" in field ? field.label : fieldName;
                const existingVal = selectedAsset.customFieldsData && typeof selectedAsset.customFieldsData === "object" ? (selectedAsset.customFieldsData as any)[fieldName] || "" : "";
                return (
                  <FormField key={fieldName} label={fieldLabel}>
                    <input name={`custom_field_${fieldName}`} defaultValue={existingVal} style={inputStyle} placeholder={`Enter ${fieldLabel}`} />
                  </FormField>
                );
              })}
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.825rem", color: "#374151", fontWeight: 500 }}>
            <input type="checkbox" name="bookable" defaultChecked={selectedAsset.bookable} style={{ width: 16, height: 16, accentColor: "#6ecfa3", cursor: "pointer" }} />
            Shared resource — bookable by staff
          </label>

          {error && <div style={{ padding: "10px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "0.8rem" }}>{error}</div>}
          {success && <div style={{ padding: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "8px", fontSize: "0.8rem" }}>✓ Asset updated!</div>}

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ flex: 2, padding: "10px", border: "none", background: "#6ecfa3", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
              {submitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── RETIRE ASSET MODAL ──
interface RetireModalProps {
  show: boolean;
  selectedAsset: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function RetireAssetModal({
  show,
  selectedAsset,
  onClose,
  onSuccess
}: RetireModalProps) {
  if (!show || !selectedAsset) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
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
          if (r?.error) toast.error(r.error);
          else {
            toast.success("Asset retired successfully");
            onSuccess();
          }
        }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea name="reason" required placeholder="Reason for retiring this asset..." rows={3}
            style={{ padding: "10px", borderRadius: "9px", border: "1px solid #e5e7eb", fontSize: "0.83rem", fontFamily: "inherit", resize: "vertical" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={onClose}
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
  );
}

// ── DISPOSE ASSET MODAL ──
interface DisposeModalProps {
  show: boolean;
  selectedAsset: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisposeAssetModal({
  show,
  selectedAsset,
  onClose,
  onSuccess
}: DisposeModalProps) {
  if (!show || !selectedAsset) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
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
          if (r?.error) toast.error(r.error);
          else {
            toast.success("Asset disposed successfully");
            onSuccess();
          }
        }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <select name="method" required style={{ padding: "10px", borderRadius: "9px", border: "1px solid #e5e7eb", fontSize: "0.83rem", fontFamily: "inherit" }}>
            <option value="">Select disposal method...</option>
            {["AUCTION", "DONATION", "SCRAPPED", "SOLD", "TRANSFERRED", "DESTROYED"].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <textarea name="reason" required placeholder="Reason for disposal..." rows={3}
            style={{ padding: "10px", borderRadius: "9px", border: "1px solid #e5e7eb", fontSize: "0.83rem", fontFamily: "inherit", resize: "vertical" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={onClose}
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
  );
}

// ── ENTERPRISE PROFILE MODAL ──
interface ProfileModalProps {
  show: boolean;
  selectedAsset: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProfileDetailsModal({
  show,
  selectedAsset,
  onClose,
  onSuccess
}: ProfileModalProps) {
  if (!show || !selectedAsset) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
      <div className="animate-scale-in" style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "560px", padding: "28px", boxShadow: "0 32px 80px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Enterprise Profile</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#6b7280" }}>Warranty · Vendor · Depreciation · Purchase Details</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const r = await updateAssetProfileDetails(selectedAsset.id, fd);
          if (r?.error) toast.error(r.error);
          else {
            toast.success("Profile details updated");
            onSuccess();
          }
        }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#374151", padding: "6px 0 2px", borderBottom: "1px solid #f0f0f0" }}>🛡 Warranty</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <FormField label="Provider">
              <input name="warrantyProvider" defaultValue={selectedAsset.warrantyProvider || ""} style={inputStyle} />
            </FormField>
            <FormField label="Warranty Number">
              <input name="warrantyNumber" defaultValue={selectedAsset.warrantyNumber || ""} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <FormField label="Warranty Start">
              <input type="date" name="warrantyStart" defaultValue={selectedAsset.warrantyStart ? new Date(selectedAsset.warrantyStart).toISOString().split("T")[0] : ""} style={inputStyle} />
            </FormField>
            <FormField label="Warranty End">
              <input type="date" name="warrantyEnd" defaultValue={selectedAsset.warrantyEnd ? new Date(selectedAsset.warrantyEnd).toISOString().split("T")[0] : ""} style={inputStyle} />
            </FormField>
          </div>

          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#374151", padding: "10px 0 2px", borderBottom: "1px solid #f0f0f0" }}>🏢 Vendor & Purchase</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <FormField label="Vendor Name">
              <input name="vendorName" defaultValue={selectedAsset.vendorName || ""} style={inputStyle} />
            </FormField>
            <FormField label="Vendor Contact">
              <input name="vendorContact" defaultValue={selectedAsset.vendorContact || ""} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <FormField label="Vendor Email">
              <input type="email" name="vendorEmail" defaultValue={selectedAsset.vendorEmail || ""} style={inputStyle} />
            </FormField>
            <FormField label="Vendor Phone">
              <input name="vendorPhone" defaultValue={selectedAsset.vendorPhone || ""} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <FormField label="PO Number">
              <input name="poNumber" defaultValue={selectedAsset.poNumber || ""} style={inputStyle} />
            </FormField>
            <FormField label="Invoice Number">
              <input name="invoiceNumber" defaultValue={selectedAsset.invoiceNumber || ""} style={inputStyle} />
            </FormField>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <FormField label="Acquisition Method">
              <select name="acquisitionMethod" defaultValue={selectedAsset.acquisitionMethod || "PURCHASED"} style={selectStyle}>
                {["PURCHASED", "LEASED", "DONATED", "RENTED"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FormField>
            <FormField label="Funding Source">
              <input name="fundingSource" placeholder="e.g. Dept Budget" defaultValue={selectedAsset.fundingSource || ""} style={inputStyle} />
            </FormField>
            <FormField label="Tax (%)">
              <input type="number" step="0.01" name="tax" defaultValue={selectedAsset.tax || ""} style={inputStyle} />
            </FormField>
          </div>

          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#374151", padding: "10px 0 2px", borderBottom: "1px solid #f0f0f0" }}>📉 Depreciation Model</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <FormField label="Method">
              <select name="depreciationMethod" defaultValue={selectedAsset.depreciationMethod || "STRAIGHT_LINE"} style={selectStyle}>
                {["STRAIGHT_LINE", "DOUBLE_DECLINING", "SUM_OF_YEARS", "NO_DEPRECIATION"].map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
              </select>
            </FormField>
            <FormField label="Salvage Value (₹)">
              <input type="number" name="salvageValue" defaultValue={selectedAsset.salvageValue || 0} style={inputStyle} />
            </FormField>
            <FormField label="Useful Life (Years)">
              <input type="number" name="usefulLife" defaultValue={selectedAsset.usefulLife || 5} style={inputStyle} />
            </FormField>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", background: "transparent", borderRadius: "9px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button type="submit"
              style={{ flex: 1, padding: "10px", border: "none", background: "#6ecfa3", color: "#1a4a2e", borderRadius: "9px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

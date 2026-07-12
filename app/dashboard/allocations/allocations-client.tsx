"use client";

import { useState } from "react";
import { createAllocation, returnAsset } from "@/features/allocations/actions";

// Locale-fixed date formatter — prevents SSR/client hydration mismatches
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD

interface Props {
  initialAllocations: any[];
  assets: any[];
  users: any[];
  departments: any[];
}

export default function AllocationsClient({ initialAllocations, assets, users, departments }: Props) {
  const [allocations, setAllocations] = useState(initialAllocations);
  
  // Allocate Form State
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [allocError, setAllocError] = useState<string | null>(null);
  const [allocSuccess, setAllocSuccess] = useState(false);
  const [allocating, setAllocating] = useState(false);

  // Return Drawer State
  const [selectedAllocForReturn, setSelectedAllocForReturn] = useState<any | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [returning, setReturning] = useState(false);

  // Check if selected asset is already allocated and show warning in UI before submission
  const selectedAssetObj = assets.find((a) => a.id === selectedAssetId);
  const isConflict = selectedAssetObj && selectedAssetObj.status === "ALLOCATED";

  const handleAllocate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAllocError(null);
    setAllocSuccess(false);
    setAllocating(true);

    const formData = new FormData(e.currentTarget);
    const result = await createAllocation(formData);

    if (result?.error) {
      setAllocError(result.error);
      setAllocating(false);
    } else {
      setAllocSuccess(true);
      setTimeout(() => {
        setAllocSuccess(false);
        setAllocating(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReturnError(null);
    setReturnSuccess(false);
    setReturning(true);

    const formData = new FormData(e.currentTarget);
    const result = await returnAsset(formData);

    if (result?.error) {
      setReturnError(result.error);
      setReturning(false);
    } else {
      setReturnSuccess(true);
      setTimeout(() => {
        setSelectedAllocForReturn(null);
        setReturnSuccess(false);
        setReturning(false);
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
      {/* LEFT COLUMN: Allocate Form */}
      <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: "0 0 1.25rem 0", fontSize: "1.05rem", fontWeight: 700 }}>Allocate Corporate Asset</h2>
          
          <form onSubmit={handleAllocate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Select Asset</label>
              <select
                name="assetId"
                required
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setAllocError(null);
                }}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
              >
                <option value="">-- Choose Asset --</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            {/* CONFLICT PRE-WARNING GUEST */}
            {isConflict && (
              <div
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fef3c7",
                  color: "#b45309",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  lineHeight: 1.4,
                }}
              >
                <strong>Conflict Alert:</strong> This item is currently allocated. Submitting will be blocked unless returned first. Please request a transfer instead.
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Assign To Employee</label>
                <select name="userId" style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                  <option value="">-- Select --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Assign To Department</label>
                <select name="departmentId" style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                  <option value="">-- Select --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Expected Return Date</label>
              <input name="expectedReturnDate" type="date" required style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
            </div>

            {allocError && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{allocError}</span>}
            {allocSuccess && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Allocated successfully!</span>}

            <button
              type="submit"
              disabled={allocating || isConflict}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: isConflict ? "#9ca3af" : "#4f46e5",
                color: "#ffffff",
                fontWeight: 600,
                cursor: isConflict ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {allocating ? "Processing..." : "Allocate Asset"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Handovers Table */}
      <div style={{ flex: 2, minWidth: "450px", backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
        <h2 style={{ margin: "0 0 1.25rem 0", fontSize: "1.05rem", fontWeight: 700 }}>Active Handover Logs</h2>
        
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#4b5563" }}>
              <th style={{ padding: "8px" }}>Asset</th>
              <th style={{ padding: "8px" }}>Assigned To</th>
              <th style={{ padding: "8px" }}>Expected Return</th>
              <th style={{ padding: "8px" }}>Handover Date</th>
              <th style={{ padding: "8px" }}>Status</th>
              <th style={{ padding: "8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {allocations.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                  No active allocations registered.
                </td>
              </tr>
            ) : (
              allocations.map((alloc) => {
                const isOverdue = alloc.expectedReturnDate && new Date(alloc.expectedReturnDate) < new Date();
                return (
                  <tr key={alloc.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px", fontWeight: 600 }}>
                      [{alloc.asset.tag}] {alloc.asset.name}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {alloc.user?.name || alloc.department?.name || "-"}
                    </td>
                    <td style={{ padding: "8px", color: isOverdue ? "#ef4444" : "#4b5563", fontWeight: isOverdue ? 700 : 400 }}>
                      {alloc.expectedReturnDate ? fmtDate(alloc.expectedReturnDate) : "-"}
                      {isOverdue && " (OVERDUE)"}
                    </td>
                    <td style={{ padding: "8px", color: "#6b7280" }}>
                      {fmtDate(alloc.createdAt)}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          backgroundColor: isOverdue ? "#fef2f2" : "#ecfdf5",
                          color: isOverdue ? "#991b1b" : "#047857",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {isOverdue ? "Overdue" : "On Schedule"}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <button
                        onClick={() => setSelectedAllocForReturn(alloc)}
                        style={{
                          backgroundColor: "#f3f4f6",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PROCESS RETURN CHECKIN DRAWER */}
      {selectedAllocForReturn && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
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
              borderRadius: "12px",
              width: "100%",
              maxWidth: "460px",
              padding: "2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: 700 }}>
              Process Return Handoff
            </h3>
            <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.8rem", color: "#6b7280" }}>
              Verify condition check-in parameters before changing state to Available.
            </p>

            <form onSubmit={handleReturnSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="hidden" name="allocationId" value={selectedAllocForReturn.id} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Checkin Condition</label>
                <select name="condition" style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                  <option value="NEW">New</option>
                  <option value="GOOD">Good / Operable</option>
                  <option value="FAIR">Fair / Wear & Tear</option>
                  <option value="POOR">Poor / Damaged parts</option>
                  <option value="DAMAGED">Damaged / Inoperable</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Condition Notes / Inspection</label>
                <textarea name="notes" placeholder="Any scratches or component issues..." style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", minHeight: "80px", fontFamily: "inherit" }} />
              </div>

              {returnError && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{returnError}</span>}
              {returnSuccess && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Returned successfully! Reverting status...</span>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedAllocForReturn(null)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "transparent", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returning}
                  style={{ padding: "8px 24px", borderRadius: "6px", border: "none", backgroundColor: "#059669", color: "#ffffff", fontWeight: 600, cursor: "pointer" }}
                >
                  {returning ? "Saving..." : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

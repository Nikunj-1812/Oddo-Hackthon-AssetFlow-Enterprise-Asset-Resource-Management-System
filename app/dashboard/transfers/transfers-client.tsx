"use client";

import { useState } from "react";
import { 
  createTransferRequest, 
  approveByDepartment, 
  rejectByDepartment, 
  approveByManager, 
  rejectByManager, 
  cancelTransferRequest 
} from "@/features/transfers/actions";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Clock, CheckCircle2, XCircle, Search, User as UserIcon, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function TransfersClient({ initialTransfers, assets, users, departments, currentUser }: any) {
  const [transfers, setTransfers] = useState(initialTransfers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransfers = transfers.filter((t: any) => 
    t.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.asset.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return <Badge style={{backgroundColor: "#FEF3C7", color: "#92400E"}}>Pending Dept Approval</Badge>;
      case "DEPARTMENT_APPROVED": return <Badge style={{backgroundColor: "#DBEAFE", color: "#1E40AF"}}>Pending Mgr Approval</Badge>;
      case "COMPLETED": return <Badge style={{backgroundColor: "#D1FAE5", color: "#065F46"}}>Completed</Badge>;
      case "REJECTED": return <Badge style={{backgroundColor: "#FEE2E2", color: "#991B1B"}}>Rejected</Badge>;
      case "CANCELLED": return <Badge style={{backgroundColor: "#F3F4F6", color: "#374151"}}>Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await createTransferRequest(formData);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Transfer request created!");
      e.currentTarget.reset();
      setSelectedAssetId("");
      window.location.reload();
    }
    setIsSubmitting(false);
  };

  const handleAction = async (actionFn: Function, actionName: string) => {
    if (!selectedTransfer) return;
    setIsSubmitting(true);
    const res = await actionFn(selectedTransfer.id, comment);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Transfer ${actionName}`);
      setSelectedTransfer(null);
      setComment("");
      window.location.reload();
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto", display: "flex", gap: "24px", flexWrap: "wrap", fontFamily: "'Inter', sans-serif" }}>
      
      {/* LEFT COLUMN: Create Form */}
      <div style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column" }}>
        <Card style={{ border: "1px solid #f0f0f0", borderRadius: "14px", height: "100%" }}>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.1rem" }}>
              <ArrowRightLeft size={20} color="#6ecfa3" />
              New Transfer Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" }}>Asset to Transfer *</label>
                <select 
                  name="assetId" 
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", outline: "none", fontSize: "0.9rem" }}
                >
                  <option value="">Select an asset...</option>
                  {assets.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                  ))}
                </select>
              </div>

              {selectedAssetId && (
                <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Current Holder:</p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a", margin: "4px 0 0 0" }}>
                    {assets.find((a:any) => a.id === selectedAssetId)?.allocations[0]?.user?.name || 
                     assets.find((a:any) => a.id === selectedAssetId)?.allocations[0]?.department?.name || "None"}
                  </p>
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" }}>Transfer To (Employee)</label>
                <select name="requestedHolderId" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", outline: "none", fontSize: "0.9rem" }}>
                  <option value="">Select user...</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} - {u.role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" }}>OR Transfer To (Department)</label>
                <select name="requestedDepartmentId" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", outline: "none", fontSize: "0.9rem" }}>
                  <option value="">Select department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" }}>Reason *</label>
                <Input name="reason" placeholder="e.g. Employee relocating to new office" required style={{ backgroundColor: "#f9fafb" }} />
              </div>
              
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" }}>Priority</label>
                <select name="priority" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", outline: "none", fontSize: "0.9rem" }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" }}>Expected Transfer Date *</label>
                <Input type="date" name="expectedTransferDate" required style={{ backgroundColor: "#f9fafb" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" }}>Additional Notes</label>
                <Input name="additionalNotes" placeholder="Optional notes" style={{ backgroundColor: "#f9fafb" }} />
              </div>

              <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: "#6ecfa3", color: "white", borderRadius: "8px", marginTop: "10px" }}>
                {isSubmitting ? "Submitting..." : "Submit Transfer Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Transfer List */}
      <div style={{ flex: 2, minWidth: "500px", display: "flex", flexDirection: "column" }}>
        <Card style={{ border: "1px solid #f0f0f0", borderRadius: "14px", height: "100%", display: "flex", flexDirection: "column" }}>
          <CardHeader style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle style={{ fontSize: "1.1rem" }}>Active Transfers</CardTitle>
            <div style={{ position: "relative", width: "250px" }}>
              <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} size={16} />
              <Input 
                placeholder="Search requests..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "36px", borderRadius: "20px", backgroundColor: "#f9fafb" }} 
              />
            </div>
          </CardHeader>
          <CardContent style={{ padding: 0, overflowY: "auto", flex: 1, maxHeight: "750px" }}>
            {filteredTransfers.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>No transfer requests found.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f8fafc", position: "sticky", top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>ASSET</th>
                    <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>FROM → TO</th>
                    <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>DATE</th>
                    <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((t: any) => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTransfer(t)}
                      style={{ 
                        borderBottom: "1px solid #f0f0f0", 
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        backgroundColor: selectedTransfer?.id === t.id ? "#eff6ff" : "white"
                      }}
                      onMouseEnter={(e) => { if(selectedTransfer?.id !== t.id) e.currentTarget.style.backgroundColor = "#fafafa"; }}
                      onMouseLeave={(e) => { if(selectedTransfer?.id !== t.id) e.currentTarget.style.backgroundColor = "white"; }}
                    >
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>{t.asset.name}</div>
                        <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{t.asset.tag}</div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#374151" }}>
                          {t.currentHolder ? <UserIcon size={14}/> : <Building2 size={14}/>}
                          <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.currentHolder?.name || "Dept"}
                          </span>
                          <span style={{ color: "#9ca3af" }}>→</span>
                          {t.requestedHolder ? <UserIcon size={14}/> : <Building2 size={14}/>}
                          <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                            {t.requestedHolder?.name || t.requestedDepartment?.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#4b5563", fontSize: "0.9rem" }}>
                        {format(new Date(t.expectedTransferDate), "MMM d, yyyy")}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {getStatusBadge(t.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TIMELINE DRAWER MODAL */}
      {selectedTransfer && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.4)", zIndex: 100,
          display: "flex", justifyContent: "flex-end"
        }}>
          <div style={{
            width: "450px", backgroundColor: "white", height: "100%",
            boxShadow: "-4px 0 15px rgba(0,0,0,0.1)", padding: "24px",
            display: "flex", flexDirection: "column", overflowY: "auto",
            animation: "slideInRight 0.3s ease-out forwards"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Transfer Details</h2>
              <button onClick={() => {setSelectedTransfer(null); setComment("")}} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                <XCircle size={24} />
              </button>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "24px" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{selectedTransfer.asset.name}</div>
              <div style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "12px" }}>{selectedTransfer.asset.tag}</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.9rem" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Reason</div>
                  <div style={{ fontWeight: 500 }}>{selectedTransfer.reason}</div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Priority</div>
                  <div style={{ fontWeight: 500 }}>{selectedTransfer.priority}</div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Date</div>
                  <div style={{ fontWeight: 500 }}>{format(new Date(selectedTransfer.expectedTransferDate), "MMM d, yyyy")}</div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Notes</div>
                  <div style={{ fontWeight: 500 }}>{selectedTransfer.additionalNotes || "N/A"}</div>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>Approval Timeline</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", paddingLeft: "16px", borderLeft: "2px solid #e2e8f0", marginLeft: "12px", marginBottom: "32px" }}>
              
              {/* Step 1: Requested */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "-25px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#3b82f6", border: "3px solid white" }} />
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Requested</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>By {selectedTransfer.requestedBy.name} on {format(new Date(selectedTransfer.createdAt), "MMM d")}</div>
              </div>

              {/* Step 2: Department Approval */}
              <div style={{ position: "relative" }}>
                <div style={{ 
                  position: "absolute", left: "-25px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", border: "3px solid white",
                  backgroundColor: ["DEPARTMENT_APPROVED", "COMPLETED", "ASSET_MANAGER_APPROVED"].includes(selectedTransfer.status) ? "#10b981" : 
                                   selectedTransfer.status === "REJECTED" && selectedTransfer.departmentHeadComment ? "#ef4444" : "#cbd5e1" 
                }} />
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Department Head</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {selectedTransfer.departmentHeadComment ? `Comment: ${selectedTransfer.departmentHeadComment}` : "Pending Review"}
                </div>
              </div>

              {/* Step 3: Manager Approval */}
              <div style={{ position: "relative" }}>
                <div style={{ 
                  position: "absolute", left: "-25px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", border: "3px solid white",
                  backgroundColor: selectedTransfer.status === "COMPLETED" ? "#10b981" : 
                                   selectedTransfer.status === "REJECTED" && selectedTransfer.managerComment ? "#ef4444" : "#cbd5e1" 
                }} />
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Asset Manager</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {selectedTransfer.managerComment ? `Comment: ${selectedTransfer.managerComment}` : "Pending Final Action"}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS BASED ON RBAC & STATUS */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              
              {/* Department Head Actions */}
              {selectedTransfer.status === "PENDING" && (currentUser.role === "DEPARTMENT_HEAD" || currentUser.role === "ADMIN") && (
                <>
                  <Input placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
                  <div style={{ display: "flex", gap: "12px" }}>
                    <Button style={{ flex: 1, backgroundColor: "#10b981" }} disabled={isSubmitting} onClick={() => handleAction(approveByDepartment, "Approved by Department")}>Approve</Button>
                    <Button style={{ flex: 1, backgroundColor: "#ef4444" }} disabled={isSubmitting} onClick={() => handleAction(rejectByDepartment, "Rejected by Department")}>Reject</Button>
                  </div>
                </>
              )}

              {/* Asset Manager Actions */}
              {selectedTransfer.status === "DEPARTMENT_APPROVED" && (currentUser.role === "ASSET_MANAGER" || currentUser.role === "ADMIN") && (
                <>
                  <Input placeholder="Add a final comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
                  <div style={{ display: "flex", gap: "12px" }}>
                    <Button style={{ flex: 1, backgroundColor: "#10b981" }} disabled={isSubmitting} onClick={() => handleAction(approveByManager, "Completed & Re-allocated")}>Finalize Transfer</Button>
                    <Button style={{ flex: 1, backgroundColor: "#ef4444" }} disabled={isSubmitting} onClick={() => handleAction(rejectByManager, "Rejected by Manager")}>Reject</Button>
                  </div>
                </>
              )}

              {/* Cancel Action */}
              {selectedTransfer.status === "PENDING" && (currentUser.id === selectedTransfer.requestedById || currentUser.role === "ADMIN") && (
                <Button variant="outline" style={{ color: "#ef4444", borderColor: "#ef4444" }} disabled={isSubmitting} onClick={() => handleAction(cancelTransferRequest, "Cancelled")}>
                  Cancel Request
                </Button>
              )}
            </div>
            
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

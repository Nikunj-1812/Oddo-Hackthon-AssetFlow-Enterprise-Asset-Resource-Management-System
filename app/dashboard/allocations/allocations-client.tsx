"use client";

import { useState } from "react";
import { createAllocation, returnAsset } from "@/features/allocations/actions";
import { createTransferRequest } from "@/features/transfers/actions";
import { AlertCircle, CheckCircle2, ChevronRight, Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Locale-fixed date formatter
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD

interface Props {
  initialAllocations: any[];
  assets: any[];
  users: any[];
  departments: any[];
}

export default function AllocationsClient({ initialAllocations, assets, users, departments }: Props) {
  const [allocations, setAllocations] = useState(initialAllocations);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Allocate Form State
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [allocError, setAllocError] = useState<string | null>(null);
  const [allocSuccess, setAllocSuccess] = useState(false);
  const [allocating, setAllocating] = useState(false);

  // Return Modal State
  const [selectedAllocForReturn, setSelectedAllocForReturn] = useState<any | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [returning, setReturning] = useState(false);

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

  const filteredAllocations = allocations.filter((a) => {
    const term = searchQuery.toLowerCase();
    return (
      a.asset?.name?.toLowerCase().includes(term) ||
      a.asset?.tag?.toLowerCase().includes(term) ||
      a.user?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* LEFT COLUMN: Allocate Form */}
      <div className="w-full lg:w-[400px] flex-shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
        >
          <div className="p-6 border-b border-[#E5E7EB] bg-[#FAFAFA]/50">
            <h2 className="text-lg font-bold text-[#111827]">Allocate Corporate Asset</h2>
            <p className="text-sm text-[#6B7280] mt-1">Assign hardware to employees or departments.</p>
          </div>
          
          <form onSubmit={handleAllocate} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#111827]">Select Asset</label>
              <select
                name="assetId"
                required
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setAllocError(null);
                }}
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#92E4BA]/50 focus:border-[#92E4BA] transition-all"
              >
                <option value="">-- Choose Asset --</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name} {a.status === "ALLOCATED" ? "(Currently Allocated)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {isConflict && (() => {
              const activeAlloc = allocations.find(al => al.assetId === selectedAssetId && al.status === "APPROVED" && !al.actualReturnDate);
              const holderName = activeAlloc?.user?.name || activeAlloc?.department?.name || "Staff Member";
              const startDateStr = activeAlloc ? fmtDate(activeAlloc.createdAt) : "";
              const endDateStr = activeAlloc?.expectedReturnDate ? fmtDate(activeAlloc.expectedReturnDate) : "Indefinite";
              return (
                <div className="bg-amber-50 text-amber-900 p-4 rounded-xl border border-amber-200 text-sm space-y-3">
                  <div className="flex gap-2 items-start">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-700" />
                    <div>
                      <div className="font-semibold text-amber-800">Conflict Detected</div>
                      <div>This asset is currently held by <strong>{holderName}</strong> (Allocated: {startDateStr} &rarr; {endDateStr}).</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const reason = prompt(`Enter transfer reason details:`) || "";
                      if (!reason.trim()) {
                        alert("Transfer reason details are required.");
                        return;
                      }
                      const fd = new FormData();
                      fd.append("assetId", selectedAssetId);
                      fd.append("expectedTransferDate", new Date(Date.now() + 86400000).toISOString().split("T")[0]);
                      fd.append("reason", reason);
                      fd.append("priority", "HIGH");
                      
                      const targetUserId = (document.getElementsByName("userId")[0] as HTMLSelectElement)?.value;
                      const targetDeptId = (document.getElementsByName("departmentId")[0] as HTMLSelectElement)?.value;

                      if (!targetUserId && !targetDeptId) {
                        alert("Please select target Employee or Department in allocation form before requesting a transfer.");
                        return;
                      }
                      if (targetUserId) fd.append("requestedHolderId", targetUserId);
                      if (targetDeptId) fd.append("requestedDepartmentId", targetDeptId);

                      const res = await createTransferRequest(fd);
                      if (res.error) alert(res.error);
                      else {
                        alert("Transfer request created in 1-click successfully!");
                        window.location.reload();
                      }
                    }}
                    className="w-full bg-[#111827] text-white hover:bg-black py-1.5 px-3 rounded-lg text-xs font-semibold transition-all shadow-sm"
                  >
                    Request Transfer in 1-Click
                  </button>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#111827]">Employee</label>
                <select name="userId" className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#92E4BA]/50 focus:border-[#92E4BA] transition-all">
                  <option value="">-- Select --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#111827]">Department</label>
                <select name="departmentId" className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#92E4BA]/50 focus:border-[#92E4BA] transition-all">
                  <option value="">-- Select --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#111827]">Expected Return Date</label>
              <input
                type="date"
                name="expectedReturnDate"
                required
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#92E4BA]/50 focus:border-[#92E4BA] transition-all"
              />
            </div>

            {allocError && (
              <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">{allocError}</div>
            )}
            
            {allocSuccess && (
              <div className="text-[#1a7a4e] text-sm font-medium bg-[#e8faf3] p-3 rounded-xl border border-[#92E4BA]/30 flex items-center gap-2">
                <CheckCircle2 size={16} /> Asset allocated successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={allocating || allocSuccess}
              className="w-full bg-[#111827] text-white font-medium rounded-xl px-4 py-3 hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              {allocating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={16} /> Allocate Asset
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Active Handovers Table */}
      <div className="flex-1 min-w-0 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
        >
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]/50">
            <h2 className="text-lg font-bold text-[#111827]">Active Handover Logs</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input 
                type="text"
                placeholder="Filter logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#92E4BA]/50 focus:border-[#92E4BA] transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[#6B7280]">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Asset</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Expected Return</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Handover Date</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#6B7280]">
                      No active allocations found.
                    </td>
                  </tr>
                ) : (
                  filteredAllocations.map((alloc) => {
                    const isOverdue = new Date(alloc.expectedReturnDate) < new Date();
                    return (
                      <tr key={alloc.id} className="hover:bg-[#FAFAFA] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-[#111827] flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[10px] font-mono text-[#6B7280]">
                              {alloc.asset?.tag?.substring(0,2)}
                            </div>
                            [{alloc.asset?.tag}] {alloc.asset?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#111827]">
                          {alloc.user?.name || alloc.department?.name || "N/A"}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap font-medium ${isOverdue ? 'text-red-600' : 'text-[#6B7280]'}`}>
                          {fmtDate(alloc.expectedReturnDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#6B7280]">
                          {fmtDate(alloc.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOverdue ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">Overdue</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-[#e8faf3] text-[#1a7a4e] border border-[#92E4BA]/30 rounded-full text-xs font-semibold">On Schedule</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedAllocForReturn(alloc)}
                            className="bg-white border border-[#E5E7EB] text-[#111827] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#FAFAFA] hover:border-[#D1D5DB] transition-all shadow-sm group-hover:shadow"
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
        </motion.div>
      </div>

      {/* Return Modal (Using Framer Motion AnimatePresence) */}
      <AnimatePresence>
        {selectedAllocForReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAllocForReturn(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center bg-[#FAFAFA]/50">
                <h2 className="text-xl font-bold text-[#111827]">Process Return</h2>
                <button onClick={() => setSelectedAllocForReturn(null)} className="text-[#6B7280] hover:text-[#111827] transition-colors">
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleReturnSubmit} className="p-6 space-y-5">
                <input type="hidden" name="allocationId" value={selectedAllocForReturn.id} />
                <input type="hidden" name="assetId" value={selectedAllocForReturn.assetId} />
                
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] p-4 rounded-xl">
                  <div className="text-sm text-[#6B7280] mb-1">Returning Asset</div>
                  <div className="font-semibold text-[#111827]">
                    [{selectedAllocForReturn.asset?.tag}] {selectedAllocForReturn.asset?.name}
                  </div>
                  <div className="text-sm text-[#6B7280] mt-2">
                    Allocated to: {selectedAllocForReturn.user?.name || selectedAllocForReturn.department?.name}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#111827]">Return Condition</label>
                  <select name="condition" required className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#92E4BA]/50 focus:border-[#92E4BA] transition-all">
                    <option value="GOOD">Good / Working</option>
                    <option value="NEEDS_REPAIR">Needs Repair</option>
                    <option value="LOST">Lost</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#111827]">Return Notes (Optional)</label>
                  <textarea 
                    name="notes"
                    placeholder="Any issues or comments..."
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#92E4BA]/50 focus:border-[#92E4BA] transition-all resize-none h-24"
                  />
                </div>

                {returnError && (
                  <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">{returnError}</div>
                )}
                {returnSuccess && (
                  <div className="text-[#1a7a4e] text-sm font-medium bg-[#e8faf3] p-3 rounded-xl border border-[#92E4BA]/30">Asset returned successfully!</div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAllocForReturn(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#111827] font-semibold hover:bg-[#FAFAFA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={returning || returnSuccess}
                    className="flex-1 bg-[#111827] text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-black transition-all flex items-center justify-center shadow-md disabled:opacity-50"
                  >
                    {returning ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Confirm Return"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

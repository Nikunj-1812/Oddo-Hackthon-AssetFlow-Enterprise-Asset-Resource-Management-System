"use client";

import Link from "next/link";
import {
  Boxes, Calendar, Wrench, Clock, ArrowRight,
  TrendingUp, CheckCircle2, AlertCircle, Package
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { submitReturnRequest } from "@/features/allocations/actions";

interface Props {
  stats: {
    myAssetsCount: number;
    myBookingsCount: number;
    myRequestsCount: number;
    upcomingReturnsCount: number;
  };
  myAssets: any[];
  myBookings: any[];
  myRequests: any[];
}

const generateTrend = (base: number) =>
  Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, base + Math.floor(Math.random() * 3) - 1),
  }));

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA");
const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export default function EmployeeDashboard({ stats, myAssets, myBookings, myRequests }: Props) {
  const kpis = [
    {
      title: "My Assets",
      value: stats.myAssetsCount,
      icon: Boxes,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      href: "/dashboard/assets",
      data: generateTrend(stats.myAssetsCount),
    },
    {
      title: "Upcoming Bookings",
      value: stats.myBookingsCount,
      icon: Calendar,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      href: "/dashboard/bookings",
      data: generateTrend(stats.myBookingsCount),
    },
    {
      title: "Active Requests",
      value: stats.myRequestsCount,
      icon: Wrench,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      href: "/dashboard/maintenance",
      data: generateTrend(stats.myRequestsCount),
    },
    {
      title: "Pending Returns",
      value: stats.upcomingReturnsCount,
      icon: Clock,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      href: "/dashboard/allocations",
      data: generateTrend(stats.upcomingReturnsCount),
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={kpi.href}
                className="block bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#D1D5DB] transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.bg} ${kpi.color} ${kpi.border}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-[#111827]">{kpi.value}</h3>
                  <p className="text-sm font-medium text-[#6B7280] mt-1">{kpi.title}</p>
                </div>
                {/* Fake mini sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.data}>
                      <defs>
                        <linearGradient id={`gradE-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={kpi.title === "My Assets" ? "#10b981" : "#6366f1"} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={kpi.title === "My Assets" ? "#10b981" : "#6366f1"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="none" fill={`url(#gradE-${i})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ── MY HARDWARE ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Assigned Hardware</h2>
              <p className="text-sm text-[#6B7280]">Current active assignments</p>
            </div>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            {myAssets.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                <Package size={32} className="mx-auto mb-3 opacity-20" />
                <p>No assets currently assigned to you.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-[#E5E7EB] text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Asset</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Assigned Date</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {myAssets.slice(0, 5).map((alloc) => {
                    const isOverdue = alloc.expectedReturnDate && new Date(alloc.expectedReturnDate) < new Date();
                    return (
                      <tr key={alloc.id} className="hover:bg-[#FAFAFA] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#111827] flex items-center gap-2">
                            <Package size={14} className="text-[#9CA3AF]" />
                            [{alloc.asset?.tag}] {alloc.asset?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#6B7280]">
                          {fmtDate(alloc.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          {isOverdue ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                              <AlertCircle size={12} /> Overdue Return
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-[#e8faf3] text-[#1a7a4e] border border-[#92E4BA]/30 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                              <CheckCircle2 size={12} /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={async () => {
                              const notes = prompt("Enter any return comments/reason:") || "";
                              const res = await submitReturnRequest(alloc.id, notes);
                              if (res.error) alert(res.error);
                              else {
                                alert("Return request submitted to manager!");
                                window.location.reload();
                              }
                            }}
                            className="bg-white border border-[#E5E7EB] text-[#111827] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#FAFAFA] transition-all"
                          >
                            Request Return
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* ── MY REQUESTS ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">My Maintenance Requests</h2>
              <p className="text-sm text-[#6B7280]">Recent tickets</p>
            </div>
            <Link href="/dashboard/maintenance" className="text-sm font-semibold text-[#111827] hover:text-[#92E4BA] transition-colors flex items-center gap-1">
              Submit New <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-0 flex-1">
            {myRequests.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                <Wrench size={32} className="mx-auto mb-3 opacity-20" />
                <p>You have no recent maintenance requests.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {myRequests.map((req) => (
                  <div key={req.id} className="p-4 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between group">
                    <div>
                      <div className="font-semibold text-[#111827]">
                        {req.asset?.name}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-0.5 truncate max-w-[200px]">
                        {req.issueDescription}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-[#9CA3AF]">{fmtDate(req.createdAt)}</div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        req.status === "PENDING" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        req.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                        "bg-green-50 text-green-600 border border-green-100"
                      }`}>
                        {req.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

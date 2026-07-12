"use client";

import Link from "next/link";
import {
  Boxes, Users, Wrench, Calendar, IndianRupee,
  ArrowRight, TrendingUp, Building2, Package, AlertTriangle
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface Props {
  deptName: string;
  stats: {
    totalAssetsCost: number;
    departmentAssetsCount: number;
    employeesCount: number;
    activeRequestsCount: number;
    upcomingReturnsCount: number;
    bookingOverviewCount: number;
  };
  assets: any[];
  employees: any[];
}

const generateTrend = (base: number) =>
  Array.from({ length: 7 }, () => ({ v: Math.max(0, base + Math.floor(Math.random() * 4) - 2) }));

export default function DepartmentHeadDashboard({ deptName, stats, assets, employees }: Props) {
  const kpis = [
    { title: "Dept. Assets", value: stats.departmentAssetsCount, icon: Boxes, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", href: "/dashboard/assets" },
    { title: "Total Staff", value: stats.employeesCount, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", href: "/dashboard/organization" },
    { title: "Asset Value", value: `₹${stats.totalAssetsCost.toLocaleString()}`, icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", href: "/dashboard/assets" },
    { title: "Open Requests", value: stats.activeRequestsCount, icon: Wrench, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", href: "/dashboard/maintenance" },
    { title: "Upcoming Returns", value: stats.upcomingReturnsCount, icon: AlertTriangle, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", href: "/dashboard/allocations" },
    { title: "Active Bookings", value: stats.bookingOverviewCount, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", href: "/dashboard/bookings" },
  ];

  return (
    <div className="space-y-8">
      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <AreaChart data={generateTrend(typeof kpi.value === "number" ? kpi.value : 5)}>
                      <defs>
                        <linearGradient id={`gradH-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={kpi.title === "Asset Value" ? "#f59e0b" : "#6ecfa3"} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={kpi.title === "Asset Value" ? "#f59e0b" : "#6ecfa3"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="none" fill={`url(#gradH-${i})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── DEPARTMENT ASSETS ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Department Assets</h2>
              <p className="text-sm text-[#6B7280]">Recently allocated equipment</p>
            </div>
            <Link href="/dashboard/assets" className="text-sm font-semibold text-[#111827] hover:text-[#6ecfa3] transition-colors flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            {assets.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                <Package size={32} className="mx-auto mb-3 opacity-20" />
                <p>No assets currently assigned to this department.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-[#E5E7EB] text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Asset</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Category</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {assets.slice(0, 5).map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#111827]">[{asset.tag}] {asset.name}</div>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">
                        {asset.category?.name || "Uncategorized"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-[#111827]">
                        ₹{asset.cost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* ── DEPARTMENT STAFF ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Department Team</h2>
              <p className="text-sm text-[#6B7280]">Active staff members</p>
            </div>
            <Link href="/dashboard/organization" className="text-sm font-semibold text-[#111827] hover:text-[#6ecfa3] transition-colors flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            {employees.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                <Users size={32} className="mx-auto mb-3 opacity-20" />
                <p>No employees in this department.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-[#E5E7EB] text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Employee</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {employees.slice(0, 5).map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6ecfa3] to-[#3b82f6] flex items-center justify-center text-black font-bold text-xs shadow-sm">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-[#111827]">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">
                        {emp.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

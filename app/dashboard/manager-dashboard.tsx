"use client";

import Link from "next/link";
import {
  Boxes, BadgeCheck, AlertTriangle, RefreshCw, Wrench,
  Trash2, ArrowRight, PlusCircle, TrendingUp, TrendingDown,
  Activity, Clock, Package
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

interface Props {
  stats: {
    availableAssets: number;
    allocatedAssets: number;
    pendingTransfers: number;
    pendingReturns: number;
    pendingMaintenanceCount: number;
    assetsNearRetirementCount: number;
  };
  nearRetirementList: any[];
}

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA");

const generateTrend = (base: number, up: boolean) =>
  Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, base + (up ? i : -i) * Math.ceil(base * 0.05) + Math.floor(Math.random() * 3)),
  }));

const kpiConfig = (stats: Props["stats"]) => [
  {
    title: "Available Stock",
    value: stats.availableAssets,
    icon: Boxes,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    trend: "+12%",
    trendUp: true,
    data: generateTrend(stats.availableAssets, true),
  },
  {
    title: "Allocated Assets",
    value: stats.allocatedAssets,
    icon: BadgeCheck,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    trend: "+5%",
    trendUp: true,
    data: generateTrend(stats.allocatedAssets, true),
  },
  {
    title: "Pending Handovers",
    value: stats.pendingTransfers,
    icon: RefreshCw,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    trend: "−3%",
    trendUp: false,
    data: generateTrend(stats.pendingTransfers, false),
  },
  {
    title: "Overdue Returns",
    value: stats.pendingReturns,
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    trend: "+8%",
    trendUp: false,
    data: generateTrend(stats.pendingReturns, false),
  },
  {
    title: "Active Maintenance",
    value: stats.pendingMaintenanceCount,
    icon: Wrench,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    trend: "−2%",
    trendUp: false,
    data: generateTrend(stats.pendingMaintenanceCount, false),
  },
  {
    title: "Near Retirement",
    value: stats.assetsNearRetirementCount,
    icon: Trash2,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
    trend: "+1",
    trendUp: false,
    data: generateTrend(stats.assetsNearRetirementCount, false),
  },
];

const quickActions = [
  { href: "/dashboard/assets", label: "Register New Asset", desc: "Add asset to inventory", icon: PlusCircle, color: "text-[#92E4BA]" },
  { href: "/dashboard/allocations", label: "Allocate Asset", desc: "Assign to staff or dept", icon: BadgeCheck, color: "text-indigo-400" },
  { href: "/dashboard/allocations", label: "Process Return", desc: "Mark asset as returned", icon: RefreshCw, color: "text-amber-400" },
  { href: "/dashboard/maintenance", label: "Approve Maintenance", desc: "Review pending tickets", icon: Wrench, color: "text-purple-400" },
];

export default function ManagerDashboard({ stats, nearRetirementList }: Props) {
  const kpis = kpiConfig(stats);

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
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#D1D5DB] transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.bg} ${kpi.color} ${kpi.border}`}>
                    <Icon size={18} />
                  </div>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${kpi.trendUp ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
                    {kpi.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {kpi.trend}
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-[#111827]">{kpi.value.toLocaleString()}</h3>
                  <p className="text-sm font-medium text-[#6B7280] mt-1">{kpi.title}</p>
                </div>
                {/* Fake mini sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.data}>
                      <defs>
                        <linearGradient id={`gradM-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={kpi.trendUp ? "#10b981" : "#f59e0b"} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={kpi.trendUp ? "#10b981" : "#f59e0b"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="none" fill={`url(#gradM-${i})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── QUICK ACTIONS ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-[#E5E7EB] bg-[#FAFAFA]/50">
            <h2 className="text-lg font-bold text-[#111827]">Quick Actions</h2>
            <p className="text-sm text-[#6B7280]">Asset management shortcuts</p>
          </div>
          <div className="p-4 grid grid-cols-1 gap-2 flex-1">
            {quickActions.map((qa, idx) => (
              <Link 
                key={idx} 
                href={qa.href}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAFAFA] transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg bg-[#111827] flex items-center justify-center ${qa.color} group-hover:scale-105 transition-transform`}>
                  <qa.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#111827] truncate">{qa.label}</h4>
                  <p className="text-xs text-[#6B7280] truncate">{qa.desc}</p>
                </div>
                <ArrowRight size={16} className="text-[#9CA3AF] group-hover:text-[#111827] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── RETIREMENT QUEUE ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Retirement Queue Preview</h2>
              <p className="text-sm text-[#6B7280]">Assets requiring replacement evaluation</p>
            </div>
            <Link href="/dashboard/assets?filter=retirement" className="text-sm font-semibold text-[#111827] hover:text-[#92E4BA] transition-colors flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="p-0 overflow-x-auto flex-1">
            {nearRetirementList.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                <BadgeCheck size={32} className="mx-auto mb-3 opacity-20" />
                <p>No assets near retirement.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-[#E5E7EB] text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Asset</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Acquired Date</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Condition</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {nearRetirementList.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#111827] flex items-center gap-2">
                          <Package size={14} className="text-[#9CA3AF]" />
                          [{asset.tag}] {asset.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#6B7280]">
                        {fmtDate(asset.acquisitionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                          {asset.condition.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                         <Link href={`/dashboard/assets/${asset.id}`} className="text-sm font-semibold text-[#111827] hover:text-indigo-600 transition-colors">
                           Inspect
                         </Link>
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

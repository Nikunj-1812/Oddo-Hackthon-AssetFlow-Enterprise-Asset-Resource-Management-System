"use client";

import Link from "next/link";
import {
  Boxes, Users, Building2, Tag, CalendarDays, ClipboardCheck,
  UserCheck, Wrench, TrendingUp, TrendingDown, ArrowRight,
  BarChart3, Activity, Shield, Package, Search, ArrowRightLeft
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface Props {
  stats: {
    totalAssets: number;
    totalEmployees: number;
    departmentsCount: number;
    categoriesCount: number;
    activeBookingsCount: number;
    activeAuditsCount: number;
    pendingPromotionsCount: number;
    pendingMaintenanceCount: number;
    pendingTransfersCount?: number;
  };
  recentActivity: any[];
}

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD
const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const generateTrend = (base: number, up: boolean) =>
  Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, base + (up ? i : 7 - i) * Math.ceil(base * 0.04) + Math.floor(Math.random() * 2)),
  }));

export default function AdminDashboard({ stats, recentActivity }: Props) {
  const kpis = [
    { title: "Total Assets", value: stats.totalAssets, icon: Boxes, color: "text-[#1a7a4e]", bg: "bg-[#e8faf3]", border: "border-[#92E4BA]/30", trend: "+8%", trendUp: true, href: "/dashboard/assets" },
    { title: "Staff Members", value: stats.totalEmployees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", trend: "+2", trendUp: true, href: "/dashboard/organization" },
    { title: "Departments", value: stats.departmentsCount, icon: Building2, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", trend: "Stable", trendUp: true, href: "/dashboard/organization" },
    { title: "Asset Categories", value: stats.categoriesCount, icon: Tag, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", trend: "+1", trendUp: true, href: "/dashboard/assets" },
    { title: "Active Bookings", value: stats.activeBookingsCount, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", trend: "+12%", trendUp: true, href: "/dashboard/bookings" },
    { title: "Active Audits", value: stats.activeAuditsCount, icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", trend: "In Progress", trendUp: true, href: "/dashboard/audits" },
    { title: "Pending Transfers", value: stats.pendingTransfersCount || 0, icon: ArrowRightLeft, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100", trend: "Needs Approval", trendUp: false, href: "/dashboard/transfers" },
    { title: "Pending Maintenance", value: stats.pendingMaintenanceCount, icon: Wrench, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", trend: "Needs attention", trendUp: false, href: "/dashboard/maintenance" },
  ];

  const quickLinks = [
    { href: "/dashboard/assets", label: "Asset Directory", desc: "Manage all assets", icon: Boxes, color: "text-[#92E4BA]" },
    { href: "/dashboard/organization", label: "Organization", desc: "Staff & departments", icon: Building2, color: "text-indigo-400" },
    { href: "/dashboard/audits", label: "Audit Cycles", desc: "Compliance audits", icon: ClipboardCheck, color: "text-emerald-400" },
    { href: "/dashboard/transfers", label: "Transfers", desc: "Asset requests", icon: ArrowRightLeft, color: "text-cyan-400" },
    { href: "/dashboard/maintenance", label: "Maintenance", desc: "Repair queue", icon: Wrench, color: "text-red-400" },
    { href: "/dashboard/activity-logs", label: "Activity Logs", desc: "Security audit trail", icon: Shield, color: "text-purple-400" },
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
                    <AreaChart data={generateTrend(kpi.value, kpi.trendUp)}>
                      <defs>
                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={kpi.trendUp ? "#92E4BA" : "#f59e0b"} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={kpi.trendUp ? "#92E4BA" : "#f59e0b"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="none" fill={`url(#grad-${i})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── QUICK LINKS ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-[#E5E7EB] bg-[#FAFAFA]/50">
            <h2 className="text-lg font-bold text-[#111827]">Quick Links</h2>
            <p className="text-sm text-[#6B7280]">Direct access to key modules</p>
          </div>
          <div className="p-4 grid grid-cols-1 gap-2 flex-1">
            {quickLinks.map((ql, idx) => (
              <Link 
                key={idx} 
                href={ql.href}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAFAFA] transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg bg-[#111827] flex items-center justify-center ${ql.color} group-hover:scale-105 transition-transform`}>
                  <ql.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#111827] truncate">{ql.label}</h4>
                  <p className="text-xs text-[#6B7280] truncate">{ql.desc}</p>
                </div>
                <ArrowRight size={16} className="text-[#9CA3AF] group-hover:text-[#111827] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── RECENT ACTIVITY ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">System Activity</h2>
              <p className="text-sm text-[#6B7280]">Global audit log preview</p>
            </div>
            <Link href="/dashboard/activity-logs" className="text-sm font-semibold text-[#111827] hover:text-[#92E4BA] transition-colors flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="p-0 overflow-x-auto flex-1">
            {recentActivity.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                <Activity size={32} className="mx-auto mb-3 opacity-20" />
                <p>No recent activity recorded.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-[#E5E7EB] text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Action</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">User ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {recentActivity.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[#111827] font-medium">{fmtDate(log.timestamp)}</div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5">{fmtTime(log.timestamp)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#111827] flex items-center gap-2">
                          {log.targetType === "Asset" ? <Package size={14} className="text-blue-500" /> : 
                           log.targetType === "User" ? <Users size={14} className="text-indigo-500" /> :
                           log.targetType === "Allocation" ? <ClipboardCheck size={14} className="text-green-500" /> :
                           <Activity size={14} className="text-gray-400" />}
                          {log.action}
                        </div>
                        <div className="text-xs text-[#6B7280] mt-1 font-mono bg-[#FAFAFA] border border-[#E5E7EB] rounded px-1.5 py-0.5 inline-block">
                          Target: {log.targetType} #{log.targetId.substring(0,8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#6B7280] font-mono text-xs">
                        {log.userId}
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

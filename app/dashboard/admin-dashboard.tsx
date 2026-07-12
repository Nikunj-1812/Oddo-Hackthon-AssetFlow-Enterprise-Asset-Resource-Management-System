"use client";

import Link from "next/link";
import { fmtDate } from "@/lib/utils";
import {
  Boxes, Users, Building2, Tag, CalendarDays, ClipboardCheck,
  UserCheck, Wrench, TrendingUp, TrendingDown, ArrowRight,
  BarChart3, Activity, Shield, Package, Search, ArrowRightLeft,
  Clock
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

const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const generateTrend = (base: number, up: boolean) =>
  Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, base + (up ? i : 7 - i) * Math.ceil(base * 0.04) + Math.floor(Math.random() * 2)),
  }));

const getIcon = (targetType: string) => {
  const size = 16;
  switch (targetType) {
    case "Asset":
      return <Package size={size} className="text-blue-600" />;
    case "User":
      return <Users size={size} className="text-indigo-600" />;
    case "Allocation":
      return <ClipboardCheck size={size} className="text-emerald-600" />;
    case "MaintenanceRequest":
      return <Wrench size={size} className="text-amber-600" />;
    case "Audit":
    case "AuditCycle":
      return <Shield size={size} className="text-purple-600" />;
    case "TransferRequest":
      return <ArrowRightLeft size={size} className="text-cyan-600" />;
    default:
      return <Activity size={size} className="text-gray-600" />;
  }
};

const getIconBg = (targetType: string) => {
  switch (targetType) {
    case "Asset":
      return "bg-blue-50/70 border-blue-100";
    case "User":
      return "bg-indigo-50/70 border-indigo-100";
    case "Allocation":
      return "bg-emerald-50/70 border-emerald-100";
    case "MaintenanceRequest":
      return "bg-amber-50/70 border-amber-100";
    case "Audit":
    case "AuditCycle":
      return "bg-purple-50/70 border-purple-100";
    case "TransferRequest":
      return "bg-cyan-50/70 border-cyan-100";
    default:
      return "bg-gray-50/70 border-gray-100";
  }
};

const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-indigo-50 text-indigo-600 border-indigo-200/60",
    "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200/60",
    "bg-pink-50 text-pink-600 border-pink-200/60",
    "bg-blue-50 text-blue-600 border-blue-200/60",
    "bg-cyan-50 text-cyan-600 border-cyan-200/60",
    "bg-teal-50 text-teal-600 border-teal-200/60",
    "bg-violet-50 text-violet-600 border-violet-200/60",
  ];
  return colors[Math.abs(hash) % colors.length];
};

const renderActionText = (action: string) => {
  const words = action.split(" ");
  return (
    <span className="leading-relaxed text-[#374151]">
      {words.map((word, idx) => {
        const cleanWord = word.replace(/[,.:]/g, "");
        const suffix = word.slice(cleanWord.length);
        const space = idx < words.length - 1 ? " " : "";
        
        if (["APPROVED", "RESOLVED", "SUCCESS", "VERIFIED"].includes(cleanWord)) {
          return (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 mx-1 align-baseline">
              {cleanWord}
            </span>
          );
        }
        if (["PENDING", "IN_PROGRESS", "ONGOING", "TECHNICIAN_ASSIGNED"].includes(cleanWord)) {
          return (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50 mx-1 align-baseline">
              {cleanWord.replace("_", " ")}
            </span>
          );
        }
        if (["REJECTED", "CANCELLED", "FAILED", "DAMAGED", "LOST"].includes(cleanWord)) {
          return (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/50 mx-1 align-baseline">
              {cleanWord}
            </span>
          );
        }
        
        // Handle UUID/HEX highlights
        if (cleanWord.length > 20 && cleanWord.includes("-")) {
          return (
            <span key={idx} className="inline-flex">
              <code className="px-1.5 py-0.5 font-mono text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-150 rounded leading-none align-baseline">
                {cleanWord.substring(0, 8)}...
              </code>
              {suffix}{space}
            </span>
          );
        }

        return <span key={idx}>{word}{space}</span>;
      })}
    </span>
  );
};

export default function AdminDashboard({ stats, recentActivity }: Props) {
  const kpis = [
    { title: "Total Assets", value: stats.totalAssets, icon: Boxes, color: "text-[#1a7a4e]", bg: "bg-[#e8faf3]", border: "border-[#6ecfa3]/30", trend: "+8%", trendUp: true, href: "/dashboard/assets" },
    { title: "Staff Members", value: stats.totalEmployees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", trend: "+2", trendUp: true, href: "/dashboard/organization" },
    { title: "Departments", value: stats.departmentsCount, icon: Building2, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", trend: "Stable", trendUp: true, href: "/dashboard/organization" },
    { title: "Asset Categories", value: stats.categoriesCount, icon: Tag, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", trend: "+1", trendUp: true, href: "/dashboard/assets" },
    { title: "Active Bookings", value: stats.activeBookingsCount, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", trend: "+12%", trendUp: true, href: "/dashboard/bookings" },
    { title: "Active Audits", value: stats.activeAuditsCount, icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", trend: "In Progress", trendUp: true, href: "/dashboard/audits" },
    { title: "Pending Transfers", value: stats.pendingTransfersCount || 0, icon: ArrowRightLeft, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100", trend: "Needs Approval", trendUp: false, href: "/dashboard/transfers" },
    { title: "Pending Maintenance", value: stats.pendingMaintenanceCount, icon: Wrench, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", trend: "Needs attention", trendUp: false, href: "/dashboard/maintenance" },
  ];

  const quickLinks = [
    { href: "/dashboard/assets", label: "Asset Directory", desc: "Manage all assets", icon: Boxes, color: "text-[#6ecfa3]" },
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
                          <stop offset="5%" stopColor={kpi.trendUp ? "#6ecfa3" : "#f59e0b"} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={kpi.trendUp ? "#6ecfa3" : "#f59e0b"} stopOpacity={0}/>
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
            <Link href="/dashboard/activity-logs" className="text-sm font-semibold text-[#111827] hover:text-[#6ecfa3] transition-colors flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="p-0 overflow-x-auto flex-1 max-h-[480px]">
            {recentActivity.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                <Activity size={32} className="mx-auto mb-3 opacity-20" />
                <p>No recent activity recorded.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {recentActivity.map((log) => (
                  <div key={log.id} className="p-5 hover:bg-[#FAFAFA] transition-all duration-200 flex items-start justify-between gap-4 group">
                    <div className="flex items-start gap-4">
                      {/* Left Icon Badge */}
                      <div className={`mt-0.5 p-2 rounded-xl flex items-center justify-center border shadow-sm ${getIconBg(log.targetType)}`}>
                        {getIcon(log.targetType)}
                      </div>
                      
                      {/* Middle Content */}
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium">
                          {renderActionText(log.action)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                          <span className="font-mono bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                            {log.targetType} #{log.targetId.substring(0, 8)}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock size={12} className="shrink-0" />
                            {fmtDate(log.timestamp)} {fmtTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right User Info */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">User ID</span>
                          <span 
                            className="text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-150 px-1 py-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer select-all" 
                            title={log.userId}
                          >
                            {log.userId.substring(0, 8)}
                          </span>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shadow-sm ${getAvatarColor(log.userId)}`}>
                          {log.userId.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
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

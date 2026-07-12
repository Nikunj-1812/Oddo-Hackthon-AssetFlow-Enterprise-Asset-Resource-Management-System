"use client";

import { useEffect, useState } from "react";
import { getDashboardAlertStats } from "@/features/notifications/actions";
import { AlertCircle, Calendar, Clock, ClipboardCheck, Wrench, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DashboardAlerts() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      const res = await getDashboardAlertStats();
      if (res) {
        setStats(res);
      }
    }
    loadStats();
  }, []);

  if (!stats) return null;

  const hasAlerts = 
    stats.criticalAlertsCount > 0 ||
    stats.overdueReturnsCount > 0 ||
    stats.upcomingReturnsCount > 0 ||
    stats.upcomingBookingsCount > 0 ||
    stats.pendingMaintenanceCount > 0 ||
    stats.upcomingAuditsCount > 0;

  if (!hasAlerts) return null;

  return (
    <div className="space-y-3 mb-6 fontFamily-['Inter',_sans-serif]">
      {stats.criticalAlertsCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-900 border border-red-200 rounded-2xl shadow-sm">
          <ShieldAlert className="text-red-600 shrink-0 animate-pulse" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">Critical Security/System Alerts</h4>
            <p className="text-xs text-red-700 mt-0.5">You have {stats.criticalAlertsCount} unread critical system notifications.</p>
          </div>
          <Link href="/dashboard/notifications" className="text-xs font-bold text-red-700 hover:text-red-950 underline shrink-0">
            View Alerts
          </Link>
        </div>
      )}

      {stats.overdueReturnsCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 text-orange-900 border border-orange-200 rounded-2xl shadow-sm">
          <AlertCircle className="text-orange-600 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">Overdue Asset Returns</h4>
            <p className="text-xs text-orange-700 mt-0.5">There are {stats.overdueReturnsCount} assets that have passed their expected return date.</p>
          </div>
          <Link href="/dashboard/allocations" className="text-xs font-bold text-orange-700 hover:text-orange-950 underline shrink-0">
            Check Allocations
          </Link>
        </div>
      )}

      {stats.upcomingReturnsCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl shadow-sm">
          <Clock className="text-amber-600 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">Returns Due Within 24 Hours</h4>
            <p className="text-xs text-amber-700 mt-0.5">You have {stats.upcomingReturnsCount} assets scheduled to be returned today.</p>
          </div>
          <Link href="/dashboard/allocations" className="text-xs font-bold text-amber-700 hover:text-amber-950 underline shrink-0">
            Prepare Handover
          </Link>
        </div>
      )}

      {stats.upcomingBookingsCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl shadow-sm">
          <Calendar className="text-blue-600 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">Upcoming Reservation starting today</h4>
            <p className="text-xs text-blue-700 mt-0.5">You have {stats.upcomingBookingsCount} bookings starting in the next 24 hours.</p>
          </div>
          <Link href="/dashboard/bookings" className="text-xs font-bold text-blue-700 hover:text-blue-950 underline shrink-0">
            View Calendar
          </Link>
        </div>
      )}

      {stats.pendingMaintenanceCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-purple-50 text-purple-900 border border-purple-200 rounded-2xl shadow-sm">
          <Wrench className="text-purple-600 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">Pending Maintenance Approvals</h4>
            <p className="text-xs text-purple-700 mt-0.5">There are {stats.pendingMaintenanceCount} tickets awaiting review/technician assignment.</p>
          </div>
          <Link href="/dashboard/maintenance" className="text-xs font-bold text-purple-700 hover:text-purple-950 underline shrink-0">
            Open Queue
          </Link>
        </div>
      )}

      {stats.upcomingAuditsCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl shadow-sm">
          <ClipboardCheck className="text-emerald-600 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">Audit Cycle Deadlines</h4>
            <p className="text-xs text-emerald-700 mt-0.5">An active audit cycle is scheduled to end within the next 24 hours.</p>
          </div>
          <Link href="/dashboard/audits" className="text-xs font-bold text-emerald-700 hover:text-emerald-950 underline shrink-0">
            Verify Audits
          </Link>
        </div>
      )}
    </div>
  );
}

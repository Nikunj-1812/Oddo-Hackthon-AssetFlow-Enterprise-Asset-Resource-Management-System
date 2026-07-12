"use client";

import { useState, useEffect } from "react";
import { 
  getNotificationsAction, 
  markAsReadAction, 
  markAllAsReadAction, 
  deleteNotificationAction,
  archiveNotificationAction,
  archiveAllNotificationsAction
} from "@/features/notifications/actions";
import { toast } from "sonner";
import { Search, Bell, Check, Trash2, Archive, ArrowLeft, ChevronLeft, ChevronRight, Inbox, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NotificationsClient({ initialData }: any) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [readFilter, setReadFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchFiltered = async (targetPage = page) => {
    setLoading(true);
    const filters: any = {
      page: targetPage,
      limit: 20,
      search,
    };
    if (category !== "ALL") filters.category = category;
    if (priority !== "ALL") filters.priority = priority;
    if (readFilter !== undefined) filters.read = readFilter;

    const res = await getNotificationsAction(filters);
    if (res) {
      setData(res);
      setPage(targetPage);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiltered(1);
  }, [category, priority, readFilter, search]);

  const handleMarkRead = async (id: string) => {
    const res = await markAsReadAction(id);
    if (res.success) {
      fetchFiltered();
    }
  };

  const handleArchive = async (id: string) => {
    const res = await archiveNotificationAction(id);
    if (res.success) {
      toast.success("Notification archived");
      fetchFiltered();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteNotificationAction(id);
    if (res.success) {
      toast.success("Notification deleted");
      fetchFiltered();
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllAsReadAction();
    if (res.success) {
      toast.success("All marked as read");
      fetchFiltered(1);
    }
  };

  const handleArchiveAll = async () => {
    const res = await archiveAllNotificationsAction();
    if (res.success) {
      toast.success("All archived");
      fetchFiltered(1);
    }
  };

  // Helper to group items by Date relative string (Today, Yesterday, Last Week, Older)
  const groupNotificationsByDate = (items: any[]) => {
    const groups: { [key: string]: any[] } = {
      "Today": [],
      "Yesterday": [],
      "Older": []
    };

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    items.forEach(item => {
      const itemDate = new Date(item.createdAt);
      if (itemDate.toDateString() === today.toDateString()) {
        groups["Today"].push(item);
      } else if (itemDate.toDateString() === yesterday.toDateString()) {
        groups["Yesterday"].push(item);
      } else {
        groups["Older"].push(item);
      }
    });

    return groups;
  };

  const grouped = groupNotificationsByDate(data.items || []);

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200";
      case "WARNING": return "bg-amber-100 text-amber-800 border-amber-200";
      case "SUCCESS": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "APPROVAL": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getCategoryColor = (c: string) => {
    switch (c) {
      case "ALLOCATION": return "text-purple-600";
      case "BOOKING": return "text-blue-600";
      case "MAINTENANCE": return "text-red-600";
      case "AUDIT": return "text-emerald-600";
      default: return "text-slate-600";
    }
  };

  return (
    <div className="space-y-6 fontFamily-['Inter',_sans-serif]">
      {/* Search and Filters panel */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
          <Input
            placeholder="Search notification messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl outline-none text-sm bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="ALLOCATION">Allocations</option>
              <option value="BOOKING">Bookings</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="AUDIT">Audits</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          <div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl outline-none text-sm bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="INFO">Info</option>
              <option value="SUCCESS">Success</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
              <option value="APPROVAL">Approval</option>
            </select>
          </div>

          <div>
            <select
              value={readFilter === undefined ? "ALL" : readFilter ? "READ" : "UNREAD"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "ALL") setReadFilter(undefined);
                else if (val === "READ") setReadFilter(true);
                else setReadFilter(false);
              }}
              className="p-2 border border-slate-200 rounded-xl outline-none text-sm bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="UNREAD">Unread Only</option>
              <option value="READ">Read Only</option>
            </select>
          </div>

          <Button onClick={() => fetchFiltered(page)} variant="outline" className="rounded-xl p-2.5">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500 font-medium">
          Showing {data.items?.length || 0} of {data.total || 0} notifications
        </span>
        <div className="flex gap-2">
          <Button onClick={handleMarkAllRead} variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 text-slate-700">
            <Check size={14} /> Mark all read
          </Button>
          <Button onClick={handleArchiveAll} variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 text-slate-700">
            <Archive size={14} /> Archive all active
          </Button>
        </div>
      </div>

      {/* List items */}
      <div className="space-y-8">
        {data.items?.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <Inbox size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Notifications</h3>
            <p className="text-slate-500 text-sm mt-1">There are no notifications matching your active filters.</p>
          </div>
        ) : (
          Object.keys(grouped).map(groupName => {
            const list = grouped[groupName];
            if (list.length === 0) return null;

            return (
              <div key={groupName} className="space-y-3">
                <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider pl-2">
                  {groupName}
                </h4>

                <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] divide-y divide-slate-100">
                  {list.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-5 flex items-start gap-4 transition-colors hover:bg-slate-50 relative group ${!notif.read ? "bg-emerald-50/5" : ""}`}
                    >
                      <div className={`mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full ${!notif.read ? "bg-red-500 animate-pulse" : "bg-transparent"}`} />

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getPriorityStyle(notif.priority)}`}>
                            {notif.priority}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(notif.category)}`}>
                            {notif.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h5 className={`font-bold text-base ${!notif.read ? "text-slate-900" : "text-slate-700"}`}>
                          {notif.title}
                        </h5>

                        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
                          {notif.message}
                        </p>
                      </div>

                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <Button 
                            onClick={() => handleMarkRead(notif.id)} 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                          >
                            <Check size={14} />
                          </Button>
                        )}
                        <Button 
                          onClick={() => handleArchive(notif.id)} 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                        >
                          <Archive size={14} />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(notif.id)} 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {data.total > 20 && (
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => fetchFiltered(page - 1)}
            className="rounded-xl flex items-center gap-1.5"
          >
            <ChevronLeft size={16} /> Previous
          </Button>
          <span className="text-sm font-semibold text-slate-700 mx-2">
            Page {page} of {Math.ceil(data.total / 20)}
          </span>
          <Button
            variant="outline"
            disabled={page >= Math.ceil(data.total / 20)}
            onClick={() => fetchFiltered(page + 1)}
            className="rounded-xl flex items-center gap-1.5"
          >
            Next <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

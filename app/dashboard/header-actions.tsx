"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, HelpCircle, Check, X, Eye, ShieldAlert, Archive, Inbox, Info, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getNotificationsAction, 
  markAsReadAction, 
  markAllAsReadAction, 
  deleteNotificationAction,
  getUserNotificationSettingsAction,
  updateNotificationSettingsAction
} from "@/features/notifications/actions";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeaderActions() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    enableReminders: true,
    emailNotifications: true,
    browserNotifications: true,
    reminderTimingHours: 24
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await getNotificationsAction({ limit: 10 });
    if (res && res.items) {
      setNotifications(res.items);
      const unread = res.items.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    const res = await getUserNotificationSettingsAction();
    if (res) {
      setSettings(res);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    const res = await markAllAsReadAction();
    if (res.success) {
      toast.success("All marked as read");
      fetchNotifications();
    } else {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id: string) => {
    const res = await markAsReadAction(id);
    if (res.success) {
      fetchNotifications();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await deleteNotificationAction(id);
    if (res.success) {
      toast.success("Notification deleted");
      fetchNotifications();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateNotificationSettingsAction(settings);
    if (res.success) {
      toast.success("Preferences updated successfully");
      setSettingsOpen(false);
    } else {
      toast.error("Failed to update preferences");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-50 text-red-700 border-red-200";
      case "WARNING": return "bg-amber-50 text-amber-700 border-amber-200";
      case "SUCCESS": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "APPROVAL": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Notification Bell */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
            notifOpen 
              ? "bg-[#6ecfa3]/10 border-[#6ecfa3]/30 text-[#207a4a]" 
              : "bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827]"
          }`}
        >
          <Bell size={18} className={unreadCount > 0 ? "animate-bounce" : ""} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 border border-white text-[9px] text-white flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#FAFAFA]/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#111827]">Notifications</h3>
                  <button onClick={fetchNotifications} className="text-[#6B7280] hover:text-[#111827]">
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#6B7280] hover:text-[#111827] font-medium flex items-center gap-1 transition-colors"
                  >
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[#6B7280]">
                    <Inbox size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">All caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E7EB]">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkRead(notif.id)}
                        className={`p-4 hover:bg-[#FAFAFA] transition-colors relative group cursor-pointer ${notif.read ? "opacity-60" : "bg-[#6ecfa3]/5"}`}
                      >
                        <div className="flex gap-3">
                          <div className={`shrink-0 w-2 h-2 mt-1.5 rounded-full ${!notif.read ? "bg-red-500" : "bg-transparent"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getPriorityColor(notif.priority)}`}>
                                {notif.priority}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {notif.category}
                              </span>
                            </div>
                            <p className={`text-sm font-semibold mt-1 truncate ${!notif.read ? "text-[#111827]" : "text-[#6B7280]"}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] mt-1.5 font-medium">
                              {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button 
                            onClick={(e) => handleDelete(notif.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-red-500 transition-all shrink-0 self-start"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-[#E5E7EB] bg-[#FAFAFA]/50 text-center flex justify-between px-4">
                <Link href="/dashboard/notifications" className="text-xs font-semibold text-[#111827] hover:text-[#6ecfa3] transition-colors">
                  View Full Center
                </Link>
                <button onClick={() => { setSettingsOpen(true); setNotifOpen(false); }} className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1">
                  <Settings size={12} /> Preferences
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal (Dialog) */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              ref={settingsRef}
              className="bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#111827]">Notification Preferences</h3>
                <button onClick={() => setSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <label className="text-sm font-semibold text-slate-800">Enable Reminders</label>
                    <p className="text-xs text-slate-500">Receive proactive warning reminders</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.enableReminders}
                    onChange={(e) => setSettings({ ...settings, enableReminders: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <label className="text-sm font-semibold text-slate-800">Email Notifications</label>
                    <p className="text-xs text-slate-500">Send digests/alerts to your email</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <label className="text-sm font-semibold text-slate-800">Browser Push Notifications</label>
                    <p className="text-xs text-slate-500">Real-time screen notifications</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.browserNotifications}
                    onChange={(e) => setSettings({ ...settings, browserNotifications: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800 block mb-1">Reminder Trigger Window (Hours)</label>
                  <select 
                    value={settings.reminderTimingHours} 
                    onChange={(e) => setSettings({ ...settings, reminderTimingHours: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none text-sm bg-white"
                  >
                    <option value={2}>2 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (Default)</option>
                    <option value={48}>48 Hours</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <button className="w-9 h-9 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827] flex items-center justify-center transition-all">
        <HelpCircle size={18} />
      </button>
    </div>
  );
}

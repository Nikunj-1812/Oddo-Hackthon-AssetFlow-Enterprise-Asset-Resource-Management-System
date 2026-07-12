"use client";

import { useState, useEffect } from "react";
import { Bell, ShieldAlert, BadgeInfo, CheckCircle, Trash2, CheckSquare } from "lucide-react";
import { 
  getNotificationsAction, 
  markAsReadAction, 
  markAllAsReadAction, 
  deleteNotificationAction 
} from "@/features/notifications/actions";

export default function HeaderActions() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  const fetchNotifications = async () => {
    const data = await getNotificationsAction();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 20 seconds for real-time compliance feel
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    const res = await markAsReadAction(id);
    if (!res.error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllAsReadAction();
    if (!res.error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteNotificationAction(id);
    if (!res.error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px", fontFamily: "'Inter', sans-serif" }}>
      {/* SYSTEM STATUS */}
      <span
        style={{
          fontSize: "0.75rem",
          color: "#6b7280",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        Status:
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
          }}
        />
        <strong style={{ color: "#111827", fontWeight: 600 }}>System Online</strong>
      </span>

      {/* BELL TRIGGER ICON */}
      <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowDrawer(true)}>
        <Bell size={20} style={{ color: "#4b5563" }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontSize: "0.62rem",
              fontWeight: 700,
              borderRadius: "50%",
              width: "15px",
              height: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 2px #ffffff",
            }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* NOTIFICATIONS SLIDE-OVER DRAWER */}
      {showDrawer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "360px",
            height: "100vh",
            backgroundColor: "#ffffff",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.06)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #e5e7eb",
          }}
        >
          {/* Header */}
          <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={18} style={{ color: "#7cd4a5" }} />
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>
                Notification Center
              </h2>
            </div>
            <button 
              onClick={() => setShowDrawer(false)} 
              style={{ border: "none", background: "transparent", fontSize: "1.2rem", cursor: "pointer", color: "#9ca3af" }}
            >
              ✕
            </button>
          </div>

          {/* Action trigger bar */}
          {notifications.length > 0 && (
            <div style={{ padding: "10px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6366f1",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <CheckSquare size={13} /> Mark all read
              </button>
            </div>
          )}

          {/* Inbox list */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {notifications.length === 0 ? (
              <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", padding: "2rem", textAlign: "center" }}>
                <Bell size={28} style={{ color: "#d1d5db", marginBottom: "8px" }} />
                <span style={{ fontSize: "0.8rem" }}>No notifications registered.</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #f3f4f6",
                    backgroundColor: item.read ? "#ffffff" : "#f9fbf9",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.825rem", fontWeight: 700, color: item.read ? "#374151" : "#111827" }}>
                      {item.title}
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {!item.read && (
                        <button
                          onClick={() => handleMarkRead(item.id)}
                          title="Mark read"
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: "#10b981" }}
                        >
                          <CheckCircle size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete notification"
                        style={{ border: "none", background: "transparent", cursor: "pointer", color: "#ef4444" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", lineHeight: 1.4 }}>
                    {item.message}
                  </p>

                  <span style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 500 }}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {item.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

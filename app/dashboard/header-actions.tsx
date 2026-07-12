"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, User, HelpCircle, ExternalLink } from "lucide-react";

const mockNotifications = [
  {
    id: 1,
    type: "maintenance",
    title: "Maintenance request approved",
    body: "MacBook Pro [AST-0042] repair approved by manager.",
    time: "2m ago",
    unread: true,
    color: "#92E4BA",
  },
  {
    id: 2,
    type: "booking",
    title: "Upcoming booking reminder",
    body: "Conference Room A booked for 10:00 AM tomorrow.",
    time: "1h ago",
    unread: true,
    color: "#6366f1",
  },
  {
    id: 3,
    type: "allocation",
    title: "Asset return overdue",
    body: "Dell Monitor [AST-0017] return is 3 days overdue.",
    time: "3h ago",
    unread: false,
    color: "#ef4444",
  },
  {
    id: 4,
    type: "system",
    title: "Audit cycle due soon",
    body: "Q3 asset audit cycle closes in 5 days.",
    time: "Yesterday",
    unread: false,
    color: "#f59e0b",
  },
];

export default function HeaderActions() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

      {/* Notification Bell */}
      <div ref={notifRef} style={{ position: "relative" }}>
        <button
          id="notif-bell-btn"
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "9px",
            border: "1px solid #f0f0f0",
            background: notifOpen ? "#f0faf5" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            transition: "all 0.18s ease",
          }}
        >
          <Bell size={15} color="#6b7280" />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#92E4BA",
                border: "2px solid #ffffff",
              }}
            />
          )}
        </button>

        {/* Notification Dropdown */}
        {notifOpen && (
          <div
            className="animate-scale-in"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "360px",
              background: "#ffffff",
              border: "1px solid #f0f0f0",
              borderRadius: "14px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.1)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: "0.72rem",
                    color: "#1a7a4e",
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "14px 18px",
                    borderBottom: "1px solid #f9fafb",
                    background: notif.unread ? "#fafcfb" : "#ffffff",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f0faf5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notif.unread ? "#fafcfb" : "#ffffff")
                  }
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: `${notif.color}18`,
                      border: `1.5px solid ${notif.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: notif.color,
                        display: "block",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: notif.unread ? 700 : 500, color: "#111827" }}>
                        {notif.title}
                      </p>
                      {notif.unread && (
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#92E4BA",
                            flexShrink: 0,
                            marginTop: "4px",
                          }}
                        />
                      )}
                    </div>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.4 }}>
                      {notif.body}
                    </p>
                    <span style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "4px", display: "block" }}>
                      {notif.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 18px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
              <button
                style={{
                  fontSize: "0.78rem",
                  color: "#1a7a4e",
                  fontWeight: 600,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                View all notifications <ExternalLink size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <button
        id="settings-btn"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "9px",
          border: "1px solid #f0f0f0",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.18s ease",
          color: "#6b7280",
        }}
        title="Settings"
      >
        <Settings size={15} />
      </button>

      {/* Help */}
      <button
        id="help-btn"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "9px",
          border: "1px solid #f0f0f0",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.18s ease",
          color: "#6b7280",
        }}
        title="Help"
      >
        <HelpCircle size={15} />
      </button>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Building2,
  Users,
  Shield,
  Clock,
  UserCheck,
  UserX,
  X,
  Mail,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  CheckCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  initialUsers: any[];
  departments: any[];
}

const roleColors: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: "#fee2e2", color: "#991b1b" },
  ASSET_MANAGER: { bg: "#eff6ff", color: "#1d4ed8" },
  DEPARTMENT_HEAD: { bg: "#fef3c7", color: "#92400e" },
  EMPLOYEE: { bg: "#ecfdf5", color: "#047857" },
};

const fmtDate = (d: string | Date) => {
  return new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD format
};

export default function OrganizationClient({ initialUsers, departments }: Props) {
  const [users] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // ── FILTERED USERS ──
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = !deptFilter || user.departmentId === deptFilter;
      const matchRole = !roleFilter || user.role === roleFilter;
      const matchStatus = !statusFilter || user.status === statusFilter;
      return matchSearch && matchDept && matchRole && matchStatus;
    });
  }, [users, search, deptFilter, roleFilter, statusFilter]);

  // ── STATS ──
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const depts = departments.length;
    return { total, active, admins, depts };
  }, [users, departments]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="page-header animate-fade-up">
        <div>
          <h1 className="page-title">Organization Workspace</h1>
          <p className="page-subtitle">
            Manage your company's directory, departments, and user access levels
          </p>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div
        className="animate-fade-up delay-100"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {[
          { title: "Total Staff", val: stats.total, icon: Users, color: "#6366f1", bg: "#eff6ff" },
          { title: "Active Accounts", val: stats.active, icon: UserCheck, color: "#10b981", bg: "#ecfdf4" },
          { title: "Departments", val: stats.depts, icon: Building2, color: "#f59e0b", bg: "#fffbeb" },
          { title: "System Admins", val: stats.admins, icon: Shield, color: "#ef4444", bg: "#fef2f2" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="kpi-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span className="kpi-label">{stat.title}</span>
                  <h3 className="kpi-value" style={{ marginTop: "6px" }}>{stat.val}</h3>
                </div>
                <div className="kpi-icon-wrap" style={{ background: stat.bg }}>
                  <Icon size={20} color={stat.color} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#9ca3af", marginTop: "2px" }}>
                <TrendingUp size={10} color="#10b981" />
                <span>Live sync active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TABS ── */}
      <Tabs defaultValue="staff" style={{ width: "100%" }} className="animate-fade-up delay-200">
        <TabsList
          style={{
            background: "#ffffff",
            border: "1px solid #f0f0f0",
            padding: "4px",
            borderRadius: "10px",
            display: "inline-flex",
            marginBottom: "16px",
          }}
        >
          <TabsTrigger
            value="staff"
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Staff Roster ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger
            value="departments"
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Departments ({departments.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: STAFF ROSTER ── */}
        <TabsContent value="staff" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Search & Filters */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #f0f0f0",
              borderRadius: "12px",
              padding: "14px 16px",
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 2, minWidth: "220px", display: "flex", alignItems: "center", gap: "8px", background: "#f7f8f8", borderRadius: "9px", padding: "8px 12px" }}>
              <Search size={14} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.835rem", color: "#374151", width: "100%", fontFamily: "inherit" }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.835rem", outline: "none", cursor: "pointer", background: "#ffffff", minWidth: "150px" }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.835rem", outline: "none", cursor: "pointer", background: "#ffffff", minWidth: "150px" }}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ASSET_MANAGER">ASSET MANAGER</option>
              <option value="DEPARTMENT_HEAD">DEPARTMENT HEAD</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "0.835rem", outline: "none", cursor: "pointer", background: "#ffffff", minWidth: "120px" }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="erp-table-container" style={{ overflowX: "auto" }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                      <Users size={32} style={{ margin: "0 auto 8px", display: "block" }} />
                      No staff members found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const rc = roleColors[user.role] || { bg: "#f3f4f6", color: "#4b5563" };
                    return (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "#92E4BA",
                                color: "#1a4a2e",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.835rem" }}>
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#6b7280" }}>{user.email}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              background: rc.bg,
                              color: rc.color,
                            }}
                          >
                            {user.role.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ color: "#374151", fontWeight: 500 }}>
                          {user.department?.name || (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>None</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              user.status === "ACTIVE" ? "status-available" : "status-retired"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td style={{ color: "#6b7280" }}>
                          {fmtDate(user.createdAt)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              background: "#f7f8f8",
                              border: "1px solid #f0f0f0",
                              borderRadius: "7px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              color: "#374151",
                            }}
                          >
                            Profile <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── TAB 2: DEPARTMENTS ── */}
        <TabsContent value="departments">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "18px",
            }}
          >
            {departments.map((dept) => (
              <Card key={dept.id} style={{ border: "1px solid #f0f0f0", borderRadius: "12px", overflow: "hidden" }}>
                <CardContent style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Building2 size={16} color="#6366f1" />
                      <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                        {dept.name}
                      </h3>
                    </div>
                    <Badge variant="outline" style={{ background: "#e8faf3", color: "#1a7a4e", borderColor: "#bbf7d0", fontWeight: 700 }}>
                      {dept.employees.length} Staff
                    </Badge>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid #f9fafb", paddingBottom: "12px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Manager
                      </div>
                      <div style={{ fontSize: "0.825rem", color: "#374151", fontWeight: 600, marginTop: "2px" }}>
                        {dept.manager?.name || (
                          <span style={{ color: "#9ca3af", fontStyle: "italic", fontWeight: 400 }}>Unassigned</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Created On
                      </div>
                      <div style={{ fontSize: "0.825rem", color: "#374151", fontWeight: 600, marginTop: "2px" }}>
                        {fmtDate(dept.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                      Staff Roster preview
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {dept.employees.length === 0 ? (
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>
                          No staff in this department
                        </div>
                      ) : (
                        dept.employees.slice(0, 3).map((e: any) => (
                          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#92E4BA" }} />
                            <span style={{ fontSize: "0.78rem", color: "#374151", fontWeight: 500 }}>
                              {e.name}
                            </span>
                            <span style={{ fontSize: "0.68rem", color: "#9ca3af", marginLeft: "auto" }}>
                              {e.role.replace("_", " ")}
                            </span>
                          </div>
                        ))
                      )}
                      {dept.employees.length > 3 && (
                        <div style={{ fontSize: "0.72rem", color: "#1a7a4e", fontWeight: 600, marginTop: "2px" }}>
                          + {dept.employees.length - 3} more team members
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── PROFILE SHEET / RIGHT DRAWER ── */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 200,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="animate-slide-right"
            style={{
              width: "400px",
              height: "100vh",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid #f0f0f0",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "22px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Staff Profile
                </div>
                <h2 style={{ margin: "4px 0 0 0", fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                  {selectedUser.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Big initials badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#e8faf3",
                    color: "#1a7a4e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    fontWeight: 800,
                  }}
                >
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span
                    className="status-badge"
                    style={{
                      background: roleColors[selectedUser.role]?.bg || "#f3f4f6",
                      color: roleColors[selectedUser.role]?.color || "#4b5563",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {selectedUser.role.replace("_", " ")}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                    <span className={`status-badge ${selectedUser.status === "ACTIVE" ? "status-available" : "status-retired"}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attributes Card */}
              <div
                style={{
                  background: "#fafafa",
                  border: "1px solid #f0f0f0",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <Mail size={14} color="#9ca3af" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700 }}>EMAIL ADDRESS</div>
                    <div style={{ fontSize: "0.825rem", color: "#374151", fontWeight: 600 }}>{selectedUser.email}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <Building2 size={14} color="#9ca3af" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700 }}>DEPARTMENT</div>
                    <div style={{ fontSize: "0.825rem", color: "#374151", fontWeight: 600 }}>
                      {selectedUser.department?.name || "None Assigned"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <Clock size={14} color="#9ca3af" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700 }}>MEMBER SINCE</div>
                    <div style={{ fontSize: "0.825rem", color: "#374151", fontWeight: 600 }}>
                      {new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Context Links */}
              <div>
                <div style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                  Operational Views
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <a
                    href="/dashboard/allocations"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: "#374151",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    View active allocations
                    <ExternalLink size={12} color="#9ca3af" />
                  </a>
                  <a
                    href="/dashboard/maintenance"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: "#374151",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    View reported issues
                    <ExternalLink size={12} color="#9ca3af" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

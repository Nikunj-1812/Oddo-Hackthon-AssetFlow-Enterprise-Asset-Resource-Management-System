import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Activity, Clock, ShieldCheck, Database, Layers } from "lucide-react";

export default async function ActivityLogsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const role = (user as any).role || "EMPLOYEE";
  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all audit trail activity logs
  const logs = await prisma.activityLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  const renderBadgeGrid = (val: any) => {
    if (!val) return null;
    let parsed: Record<string, any> = {};
    if (typeof val === "string") {
      try {
        parsed = JSON.parse(val);
      } catch {
        return <span style={{ color: "#6b7280" }}>{val}</span>;
      }
    } else {
      parsed = val;
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "500px" }}>
        {Object.entries(parsed).map(([key, value]) => {
          if (value === null || value === undefined || typeof value === "object") return null;
          // Hide internal keys to keep it clean and executive-level readable
          if (key === "id" || key === "categoryId" || key === "userId") return null;
          
          return (
            <span
              key={key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#f9fafb",
                color: "#374151",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                border: "1px solid #e5e7eb",
                fontWeight: 500,
              }}
            >
              <span style={{ color: "#6b7280", fontWeight: 600 }}>{key}:</span> {String(value)}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* HEADER SECTION */}
      <div>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>
          System Security Logs
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
          Immutable compliance audit trail showing user check-outs, database entries, and authorization upgrades.
        </p>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div 
        style={{ 
          backgroundColor: "#ffffff", 
          borderRadius: "16px", 
          border: "1px solid #e5e7eb", 
          overflowX: "auto", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)" 
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", backgroundColor: "#fafafa" }}>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Timestamp</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Operation Action</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Module Scope</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Target Identifier</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Modified Properties</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                  No security logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.2s" }} className="table-row-hover">
                  <td style={{ padding: "14px 18px", color: "#6b7280" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} style={{ color: "#9ca3af" }} />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 700, color: "#111827" }}>
                    {log.action}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: 600, color: "#4b5563" }}>
                      <Layers size={13} style={{ color: "#9ca3af" }} />
                      {log.targetType}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span 
                      style={{ 
                        fontFamily: "monospace", 
                        fontSize: "0.75rem", 
                        backgroundColor: "#f3f4f6", 
                        padding: "3px 8px", 
                        borderRadius: "6px", 
                        color: "#4b5563",
                        border: "1px solid #e5e7eb"
                      }}
                    >
                      {log.targetId.substring(0, 18)}...
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {log.oldValue || log.newValue ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {log.oldValue && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b91c1c", backgroundColor: "#fef2f2", padding: "2px 6px", borderRadius: "4px" }}>PREV</span>
                            {renderBadgeGrid(log.oldValue)}
                          </div>
                        )}
                        {log.newValue && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#047857", backgroundColor: "#ecfdf5", padding: "2px 6px", borderRadius: "4px" }}>NEW</span>
                            {renderBadgeGrid(log.newValue)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

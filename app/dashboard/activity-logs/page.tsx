import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Activity, Clock, ShieldCheck, Database, Layers,
  Package, Users, ClipboardCheck, Wrench, Shield,
  ArrowRightLeft
} from "lucide-react";

const getIcon = (targetType: string) => {
  const size = 14;
  switch (targetType) {
    case "Asset":
      return <Package size={size} style={{ color: "#2563eb" }} />;
    case "User":
      return <Users size={size} style={{ color: "#4f46e5" }} />;
    case "Allocation":
      return <ClipboardCheck size={size} style={{ color: "#059669" }} />;
    case "MaintenanceRequest":
      return <Wrench size={size} style={{ color: "#d97706" }} />;
    case "Audit":
    case "AuditCycle":
      return <Shield size={size} style={{ color: "#7c3aed" }} />;
    case "TransferRequest":
      return <ArrowRightLeft size={size} style={{ color: "#0891b2" }} />;
    default:
      return <Activity size={size} style={{ color: "#6b7280" }} />;
  }
};

const getIconBg = (targetType: string) => {
  switch (targetType) {
    case "Asset":
      return "#eff6ff";
    case "User":
      return "#e0e7ff";
    case "Allocation":
      return "#e8faf3";
    case "MaintenanceRequest":
      return "#fff7ed";
    case "Audit":
    case "AuditCycle":
      return "#f5f3ff";
    case "TransferRequest":
      return "#ecfdf5";
    default:
      return "#f3f4f6";
  }
};

const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "background: #e0e7ff; color: #4f46e5; border-color: #c7d2fe;",
    "background: #fae8ff; color: #c084fc; border-color: #f5d0fe;",
    "background: #fce7f3; color: #db2777; border-color: #fbcfe8;",
    "background: #eff6ff; color: #2563eb; border-color: #bfdbfe;",
    "background: #ecfeff; color: #0891b2; border-color: #c5f2f7;",
    "background: #e6fbf3; color: #059669; border-color: #a7f3d0;",
    "background: #f5f3ff; color: #7c3aed; border-color: #ddd6fe;",
  ];
  return colors[Math.abs(hash) % colors.length];
};

const renderActionText = (action: string) => {
  const words = action.split(" ");
  return (
    <span style={{ lineHeight: "1.4", color: "#111827", display: "inline-block" }}>
      {words.map((word, idx) => {
        const cleanWord = word.replace(/[,.:]/g, "");
        const suffix = word.slice(cleanWord.length);
        const space = idx < words.length - 1 ? " " : "";
        
        if (["APPROVED", "RESOLVED", "SUCCESS", "VERIFIED"].includes(cleanWord)) {
          return (
            <span key={idx} style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "12px", fontSize: "0.68rem", fontWeight: 700, backgroundColor: "#e8faf3", color: "#10b981", border: "1px solid #bbf7d0", margin: "0 4px", verticalAlign: "middle" }}>
              {cleanWord}
            </span>
          );
        }
        if (["PENDING", "IN_PROGRESS", "ONGOING", "TECHNICIAN_ASSIGNED"].includes(cleanWord)) {
          return (
            <span key={idx} style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "12px", fontSize: "0.68rem", fontWeight: 700, backgroundColor: "#fff7ed", color: "#ea580c", border: "1px solid #ffedd5", margin: "0 4px", verticalAlign: "middle" }}>
              {cleanWord.replace("_", " ")}
            </span>
          );
        }
        if (["REJECTED", "CANCELLED", "FAILED", "DAMAGED", "LOST"].includes(cleanWord)) {
          return (
            <span key={idx} style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "12px", fontSize: "0.68rem", fontWeight: 700, backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", margin: "0 4px", verticalAlign: "middle" }}>
              {cleanWord}
            </span>
          );
        }
        
        // Handle UUID/HEX highlights
        if (cleanWord.length > 20 && cleanWord.includes("-")) {
          return (
            <span key={idx} style={{ display: "inline-flex" }}>
              <code style={{ padding: "2px 5px", fontFamily: "monospace", fontSize: "0.72rem", color: "#4f46e5", backgroundColor: "#e0e7ff", border: "1px solid #c7d2fe", borderRadius: "4px", lineHeight: "1" }}>
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

  const formatKeyLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const renderBadgeGrid = (val: any) => {
    if (!val) return null;
    let parsed: Record<string, any> = {};
    if (typeof val === "string") {
      try {
        parsed = JSON.parse(val);
      } catch {
        return <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>{val}</span>;
      }
    } else {
      parsed = val;
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "450px" }}>
        {Object.entries(parsed).map(([key, value]) => {
          if (value === null || value === undefined || typeof value === "object") return null;
          // Hide internal or redundant audit log keys to keep it clean and executive-level readable
          if ([
            "id", "categoryId", "userId", "passwordHash", 
            "createdAt", "updatedAt", "imageKey", "documentKey"
          ].includes(key)) {
            return null;
          }
          
          let displayVal = String(value);
          // Simple ISO date strings detection & formatting
          if (displayVal.includes("T") && displayVal.endsWith("Z") && displayVal.length > 20) {
            try {
              displayVal = new Date(displayVal).toLocaleDateString("en-CA");
            } catch {
              // fallback
            }
          }
          
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
              <span style={{ color: "#6b7280", fontWeight: 600 }}>{formatKeyLabel(key)}:</span> {displayVal}
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
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Actor</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Modified Properties</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                  No security logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.2s" }} className="table-row-hover">
                  <td style={{ padding: "14px 18px", color: "#4b5563" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600, color: "#111827" }}>
                        {new Date(log.timestamp).toLocaleDateString("en-CA")}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={11} />
                        {new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 500 }}>
                    {renderActionText(log.action)}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span 
                      style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "6px", 
                        fontSize: "0.75rem", 
                        fontWeight: 700, 
                        padding: "4px 10px",
                        borderRadius: "8px",
                        background: getIconBg(log.targetType),
                        border: "1px solid rgba(0,0,0,0.05)"
                      }}
                    >
                      {getIcon(log.targetType)}
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
                      title={log.targetId}
                    >
                      {log.targetId.substring(0, 8)}...
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div 
                        style={{ 
                          width: "28px", 
                          height: "28px", 
                          borderRadius: "50%", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontWeight: 700, 
                          fontSize: "0.7rem", 
                          border: "1px solid",
                          ...(() => {
                            // Extract styling attributes safely from returned styles string
                            const stylesStr = getAvatarColor(log.userId);
                            const styles: any = {};
                            stylesStr.split(";").forEach((s: string) => {
                              const [k, v] = s.split(":");
                              if (k && v) styles[k.trim().replace(/-./g, x => x[1].toUpperCase())] = v.trim();
                            });
                            return styles;
                          })()
                        }}
                      >
                        {log.userId.substring(0, 2).toUpperCase()}
                      </div>
                      <span 
                        style={{ 
                          fontFamily: "monospace", 
                          fontSize: "0.72rem", 
                          color: "#6b7280",
                          backgroundColor: "#fafafa",
                          border: "1px solid #e5e7eb",
                          padding: "1px 5px",
                          borderRadius: "4px"
                        }}
                        title={log.userId}
                      >
                        {log.userId.substring(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {log.oldValue || log.newValue ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {log.oldValue && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#b91c1c", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", padding: "2px 6px", borderRadius: "4px", width: "42px", textAlign: "center" }}>PREV</span>
                            {renderBadgeGrid(log.oldValue)}
                          </div>
                        )}
                        {log.newValue && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#047857", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "2px 6px", borderRadius: "4px", width: "42px", textAlign: "center" }}>NEW</span>
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

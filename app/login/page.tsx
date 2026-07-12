"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/features/auth/actions";
import { Zap, Eye, EyeOff, ArrowRight, Shield, BarChart3, Users } from "lucide-react";

const features = [
  { icon: Shield, text: "Role-based access control" },
  { icon: BarChart3, text: "Real-time asset analytics" },
  { icon: Users, text: "Multi-department workflows" },
];

const DEMO_USERS = [
  { role: "Admin", email: "admin@assetflow.com", password: "admin123", name: "Admin User" },
  { role: "Asset Manager", email: "manager@assetflow.com", password: "manager123", name: "Sarah Jenkins" },
  { role: "Department Head", email: "head@assetflow.com", password: "manager123", name: "Vikram Mehta" },
  { role: "Employee", email: "priya@assetflow.com", password: "employee123", name: "Priya Sharma" },
  { role: "Employee", email: "raj@assetflow.com", password: "employee123", name: "Raj Patel" }
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">

        {/* ── LEFT: Form Panel ── */}
        <div className="auth-form-side">
          <div className="auth-form-inner animate-fade-up">

            {/* Brand */}
            <div className="auth-brand-logo">
              <div className="auth-brand-mark">
                <Zap size={19} fill="#1a4a2e" color="#1a4a2e" />
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
                AssetFlow ERP
              </span>
            </div>

            <div style={{ textAlign: "center" }}>
              <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>
                Welcome back
              </h1>
              <p style={{ margin: "6px 0 0 0", fontSize: "0.825rem", color: "#6b7280" }}>
                Sign in to your enterprise portal
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="animate-fade-in"
                style={{
                  width: "100%",
                  background: "#fef2f2",
                  border: "1px solid #fee2e2",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  boxSizing: "border-box",
                }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div className="auth-input-group">
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>
                  Work Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="auth-input"
                />
              </div>

              <div className="auth-input-group">
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="auth-input"
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: "0.775rem",
                    color: "#1a7a4e",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
                style={{ marginTop: "4px" }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <svg
                      style={{ animation: "spin-slow 1s linear infinite" }}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    Sign In <ArrowRight size={15} />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                style={{
                  marginTop: "8px",
                  padding: "11px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  border: "1.5px dashed #d1d5db",
                  background: "transparent",
                  color: "#4b5563",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#92E4BA"; e.currentTarget.style.color = "#1a7a4e"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#4b5563"; }}
              >
                View Demo Accounts
              </button>
            </form>

            <p style={{ fontSize: "0.775rem", color: "#9ca3af", margin: 0, textAlign: "center" }}>
              Don't have an account?{" "}
              <Link href="/signup" style={{ color: "#1a7a4e", fontWeight: 600, textDecoration: "none" }}>
                Request access
              </Link>
            </p>
          </div>
        </div>

        {/* ── RIGHT: Brand Panel ── */}
        <div className="auth-panel-side">
          {/* Decorative bubbles */}
          <div className="auth-panel-bubble" style={{ width: 280, height: 280, top: -80, right: -80 }} />
          <div className="auth-panel-bubble" style={{ width: 180, height: 180, bottom: -50, left: -50, background: "rgba(255,255,255,0.1)" }} />
          <div className="auth-panel-bubble" style={{ width: 100, height: 100, top: "40%", left: "10%", background: "rgba(255,255,255,0.08)" }} />

          <div
            className="animate-fade-up"
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              maxWidth: "300px",
            }}
          >
            <div
              className="animate-float"
              style={{
                width: 72,
                height: 72,
                borderRadius: "20px",
                background: "rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255,255,255,0.4)",
              }}
            >
              <Zap size={32} fill="#1a4a2e" color="#1a4a2e" />
            </div>

            <div>
              <h2
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color: "#1a4a2e",
                  margin: 0,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                }}
              >
                Enterprise Asset
                <br />Management
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#2d6a4a", lineHeight: 1.65, margin: "12px 0 0 0" }}>
                Streamline your organization's assets, resources, and workflows from a single control center.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", alignItems: "flex-start" }}>
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className={`animate-fade-up delay-${(i + 1) * 100}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={13} color="#1a4a2e" />
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1a4a2e" }}>
                      {f.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <Link href="/signup" className="auth-outline-btn">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#1c1c1c", borderRadius: "12px", width: "100%", maxWidth: "650px", padding: "24px", color: "#e5e7eb", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)", border: "1px solid #333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Demo Accounts</h3>
              <button type="button" onClick={() => setShowDemoModal(false)} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1.5rem", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #333" }}>
                    <th style={{ padding: "12px 8px", color: "#9ca3af", fontWeight: 600 }}>Role</th>
                    <th style={{ padding: "12px 8px", color: "#9ca3af", fontWeight: 600 }}>Email</th>
                    <th style={{ padding: "12px 8px", color: "#9ca3af", fontWeight: 600 }}>Password</th>
                    <th style={{ padding: "12px 8px", color: "#9ca3af", fontWeight: 600 }}>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_USERS.map((user, i) => (
                    <tr 
                      key={i} 
                      onClick={() => {
                        setEmail(user.email);
                        setPassword(user.password);
                        setShowDemoModal(false);
                      }}
                      style={{ borderBottom: "1px solid #2d2d2d", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2d2d2d"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "14px 8px", fontWeight: 700, color: "#fff" }}>{user.role}</td>
                      <td style={{ padding: "14px 8px" }}><span style={{ background: "#333", padding: "4px 8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.8rem" }}>{user.email}</span></td>
                      <td style={{ padding: "14px 8px" }}><span style={{ background: "#333", padding: "4px 8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.8rem" }}>{user.password}</span></td>
                      <td style={{ padding: "14px 8px", color: "#d1d5db" }}>{user.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

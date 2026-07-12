"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPasswordAction } from "@/features/auth/recovery";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token") || "";

  const [btnHovered, setBtnHovered] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token is missing. Please initiate recovery again.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    
    setError(null);
    setSuccess(false);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("token", token);
    
    const result = await resetPasswordAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #eefdf7 0%, #ffffff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(146, 228, 186, 0.22), 0 8px 24px rgba(0,0,0,0.06)",
          padding: "2.5rem",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
            Reset Your Password
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "6px", lineHeight: 1.5 }}>
            Type in your new secure password below to regain system access.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ borderBottom: `1.5px solid ${passFocus ? "#6ecfa3" : "#e5e7eb"}`, transition: "border-color 0.2s" }}>
            <input
              name="password"
              type="password"
              placeholder="New Secure Password (min 8 characters)"
              required
              disabled={!token}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                padding: "10px 4px",
                fontSize: "0.85rem",
                color: "#374151",
                backgroundColor: "transparent",
                boxSizing: "border-box",
              }}
              onFocus={() => setPassFocus(true)}
              onBlur={() => setPassFocus(false)}
            />
          </div>

          {error && <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600 }}>{error}</span>}
          {success && (
            <span style={{ color: "#047857", backgroundColor: "#ecfdf5", padding: "10px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600, border: "1px solid #d1fae5" }}>
              Password updated successfully! Redirecting to login...
            </span>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              width: "100%",
              backgroundColor: (loading || !token) ? "#aef3d0" : (btnHovered ? "#53ba8d" : "#6ecfa3"),
              color: "#1e293b",
              borderRadius: "25px",
              padding: "11px",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(146, 228, 186, 0.4)",
              transition: "all 0.25s ease",
              marginTop: "8px",
            }}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
          >
            {loading ? "SAVING..." : "UPDATE PASSWORD"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link
            href="/login"
            style={{
              fontSize: "0.8rem",
              color: "#6b7280",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Cancel and Return
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#fafafa", fontFamily: "sans-serif" }}>
        Loading recovery session...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

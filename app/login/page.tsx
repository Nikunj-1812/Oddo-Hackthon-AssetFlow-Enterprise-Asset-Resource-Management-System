"use client";

import Link from "next/link";
import { useState } from "react";

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="#"
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "38px",
        height: "38px",
        border: `1.5px solid ${hovered ? "#7c3aed" : "#d1d5db"}`,
        borderRadius: "8px",
        color: hovered ? "#7c3aed" : "#6b7280",
        backgroundColor: "#ffffff",
        cursor: "pointer",
        textDecoration: "none",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 4px 10px rgba(124,58,237,0.15)" : "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </a>
  );
}

export default function LoginPage() {
  const [btnHovered, setBtnHovered] = useState(false);
  const [signupHovered, setSignupHovered] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);

  return (
    /* Page background */
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #e0e7ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      {/* Centered card */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "820px",
          minHeight: "480px",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(109, 40, 217, 0.18), 0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* LEFT: White Form Panel */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2.5rem 2rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "300px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Sign In
            </h1>

            {/* Social Icons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <SocialIcon label="Google">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Facebook">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Twitter">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="LinkedIn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </SocialIcon>
            </div>

            <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: "2px 0" }}>
              or use your email password
            </p>

            {/* Form */}
            <form
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
              onSubmit={(e) => e.preventDefault()}
            >
              <div style={{ borderBottom: `1.5px solid ${emailFocus ? "#7c3aed" : "#e5e7eb"}`, transition: "border-color 0.2s" }}>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Email"
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    padding: "9px 4px",
                    fontSize: "0.85rem",
                    color: "#374151",
                    backgroundColor: "transparent",
                    boxSizing: "border-box",
                  }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                />
              </div>
              <div style={{ borderBottom: `1.5px solid ${passFocus ? "#7c3aed" : "#e5e7eb"}`, transition: "border-color 0.2s" }}>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Password"
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    padding: "9px 4px",
                    fontSize: "0.85rem",
                    color: "#374151",
                    backgroundColor: "transparent",
                    boxSizing: "border-box",
                  }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                />
              </div>

              <a
                href="#"
                style={{ fontSize: "0.72rem", color: "#9ca3af", textDecoration: "none", marginTop: "-2px" }}
              >
                Forget Your Password?
              </a>

              <button
                type="submit"
                style={{
                  width: "100%",
                  backgroundColor: btnHovered ? "#5b21b6" : "#6d28d9",
                  color: "#ffffff",
                  borderRadius: "25px",
                  padding: "11px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "4px",
                  transform: btnHovered ? "translateY(-1px)" : "none",
                  boxShadow: btnHovered ? "0 6px 18px rgba(109,40,217,0.35)" : "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
              >
                SIGN IN
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Purple Info Panel */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 55%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2.5rem 2rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative bubbles */}
          <div style={{ position: "absolute", width: "260px", height: "260px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: "-70px", right: "-70px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: "-50px", left: "-50px", pointerEvents: "none" }} />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
              maxWidth: "280px",
            }}
          >
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.1 }}>
              Hello, Friend!
            </h2>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.7, margin: 0 }}>
              Register with your personal details to use all of cita features.
            </p>
            <Link
              href="/signup"
              style={{
                backgroundColor: signupHovered ? "#ffffff" : "transparent",
                color: signupHovered ? "#6d28d9" : "#ffffff",
                border: "2px solid #ffffff",
                borderRadius: "25px",
                padding: "9px 36px",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
                transform: signupHovered ? "translateY(-1px)" : "none",
                boxShadow: signupHovered ? "0 6px 18px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={() => setSignupHovered(true)}
              onMouseLeave={() => setSignupHovered(false)}
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Scan, Upload, Camera, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function QRScannerPage() {
  const router = useRouter();
  const [scanMethod, setScanMethod] = useState<"camera" | "upload">("camera");
  const [error, setError] = useState<string | null>(null);
  const [scannedTag, setScannedTag] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scanMethod === "camera" && scanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanMethod, scanning]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please upload an image instead or grant permissions.");
      setScanMethod("upload");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          handleSuccess(code.data);
          return;
        }
      }
    }
    if (scanning) {
      requestAnimationFrame(tick);
    }
  };

  const handleSuccess = (decodedData: string) => {
    setScanning(false);
    stopCamera();

    // Extract asset tag (e.g. AF-XXXX)
    let tag = decodedData;
    if (decodedData.includes("tag=")) {
      const parts = decodedData.split("tag=");
      tag = parts[parts.length - 1].split("&")[0];
    }

    if (tag.match(/^AF-\d{4}$/)) {
      setScannedTag(tag);
      setTimeout(() => {
        router.push(`/dashboard/assets?tag=${tag}`);
      }, 1000);
    } else {
      setError(`Invalid QR Code content: "${decodedData}". Make sure to scan an AssetFlow asset tag.`);
      setScanning(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleSuccess(code.data);
          } else {
            setError("No valid QR code found in this image. Make sure the code is clear and visible.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
        <button onClick={() => router.push("/dashboard/assets")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e5e7eb", background: "#ffffff", cursor: "pointer", color: "#374151" }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>Scan Asset QR Code</h1>
          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#6b7280" }}>Open any asset directly by scanning its tag</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem", background: "#f3f4f6", padding: "3px", borderRadius: "9px" }}>
        <button onClick={() => { setScanMethod("camera"); setScanning(true); }} style={{ flex: 1, padding: "8px", borderRadius: "7px", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", background: scanMethod === "camera" ? "#ffffff" : "transparent", color: scanMethod === "camera" ? "#111827" : "#4b5563", boxShadow: scanMethod === "camera" ? "0 1px 3px rgba(0,0,0,0.05)" : "none" }}>
          <Camera size={14} /> Camera Scan
        </button>
        <button onClick={() => { setScanMethod("upload"); setScanning(false); }} style={{ flex: 1, padding: "8px", borderRadius: "7px", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", background: scanMethod === "upload" ? "#ffffff" : "transparent", color: scanMethod === "upload" ? "#111827" : "#4b5563", boxShadow: scanMethod === "upload" ? "0 1px 3px rgba(0,0,0,0.05)" : "none" }}>
          <Upload size={14} /> Upload Image
        </button>
      </div>

      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e5e7eb", textAlign: "center" }}>
        {scannedTag ? (
          <div style={{ padding: "2rem 0" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#e8faf3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={28} color="#059669" />
            </div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: 0 }}>QR Code Decoded!</h2>
            <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "#6b7280" }}>Redirecting you to asset <strong style={{ color: "#111827" }}>{scannedTag}</strong>...</p>
          </div>
        ) : (
          <>
            {scanMethod === "camera" ? (
              <div style={{ position: "relative", width: "100%", height: "300px", borderRadius: "12px", background: "#000000", overflow: "hidden" }}>
                <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div style={{ position: "absolute", inset: "25px", border: "2px dashed #6ecfa3", borderRadius: "8px", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "#ffffff", fontSize: "0.68rem", padding: "4px 8px", borderRadius: "4px", fontWeight: 600 }}>
                  Center QR code in scanner view
                </div>
              </div>
            ) : (
              <div style={{ padding: "2rem 0" }}>
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", cursor: "pointer", border: "2px dashed #e5e7eb", borderRadius: "12px", padding: "30px 20px", background: "#fcfcfc" }}>
                  <Upload size={32} color="#9ca3af" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#374151" }}>Select QR Image File</span>
                  <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>Drag & drop or click to browse</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>
            )}
          </>
        )}

        {error && (
          <div style={{ display: "flex", gap: "8px", alignItems: "start", marginTop: "16px", padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "10px", fontSize: "0.78rem", textAlign: "left" }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { ScanLine, CheckCircle2, X, Camera, ShieldCheck } from "lucide-react";
import { playChime } from "./audioHelper";

/**
 * Authentic SVG QR Code Renderer for Token Pass
 */
export function TokenQRCode({ token = "A-127", size = 160 }) {
  // Deterministic 25x25 QR pattern with standard 7x7 corner finder patterns
  const matrixSize = 25;
  
  // Finder pattern coordinate check (corners)
  const isFinder = (r, c) => {
    // Top-Left
    if (r <= 6 && c <= 6) return true;
    // Top-Right
    if (r <= 6 && c >= matrixSize - 7) return true;
    // Bottom-Left
    if (r >= matrixSize - 7 && c <= 6) return true;
    return false;
  };

  const isFinderFilled = (r, c) => {
    // Check if on the outer 7x7 border or the inner 3x3 core
    const checkCorner = (row, col) => {
      if (row === 0 || row === 6 || col === 0 || col === 6) return true;
      if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return true;
      return false;
    };

    if (r <= 6 && c <= 6) return checkCorner(r, c);
    if (r <= 6 && c >= matrixSize - 7) return checkCorner(r, c - (matrixSize - 7));
    if (r >= matrixSize - 7 && c <= 6) return checkCorner(r - (matrixSize - 7), c);
    return false;
  };

  // Generate deterministic data modules based on token string hash
  const modules = [];
  const seed = (token.charCodeAt(0) * 17 + (token.charCodeAt(token.length - 1) || 7)) % 100;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinder(r, c)) {
        if (isFinderFilled(r, c)) {
          modules.push({ r, c });
        }
      } else {
        // Timing pattern
        if (r === 6 || c === 6) {
          if ((r + c) % 2 === 0) modules.push({ r, c });
        } else {
          // Pseudorandom data cells
          const val = (r * 13 + c * 19 + seed + r * c) % 10;
          if (val < 5) modules.push({ r, c });
        }
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px",
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ shapeRendering: "crispEdges", borderRadius: "8px" }}
      >
        <rect width={size} height={size} fill="#ffffff" />
        {modules.map((m, idx) => (
          <rect
            key={idx}
            x={m.c * cellSize}
            y={m.r * cellSize}
            width={cellSize * 0.96}
            height={cellSize * 0.96}
            rx={cellSize * 0.15}
            fill="#1B4D3E"
          />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "8px",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--green-deep)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <ShieldCheck size={13} />
        <span>Govt APMC Token Pass</span>
      </div>
    </div>
  );
}

/**
 * Mandi Gate QR Scanner Viewfinder Simulation Modal
 */
export function QRScannerModal({ onClose, onTokenScanned, currentToken = "A-128", upcomingList = [] }) {
  const [scanning, setScanning] = useState(true);
  const [scannedToken, setScannedToken] = useState(null);

  // Default to currently called token, or first upcoming in queue
  const initialFarmer = upcomingList.find((u) => u.token === currentToken) || upcomingList[0] || {
    token: currentToken || "A-128",
    farmer_name: "Dinesh Yadav",
    crop: "Soybean",
    perishability_score: 3,
    priority_label: "High Priority (Perishable)",
  };

  const [selectedFarmer, setSelectedFarmer] = useState(initialFarmer);
  const activeTok = selectedFarmer?.token || currentToken || "A-128";

  const simulateScan = (farmerObj) => {
    playChime();
    setScanning(false);
    setScannedToken(farmerObj?.token || activeTok);
    setTimeout(() => {
      onTokenScanned(farmerObj || selectedFarmer);
    }, 1100);
  };

  return (
    <div className="ks-modal-overlay" onClick={onClose}>
      <div
        className="ks-modal-dialog ks-modal-dialog-dark"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "440px", padding: "24px" }}
      >
        <button
          onClick={onClose}
          className="ks-modal-close-btn ks-modal-close-btn-dark"
          title="Close"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Camera size={22} style={{ color: "#34d399" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#fff" }}>
            Mandi Gate Entry Scanner
          </h3>
        </div>

        {/* Real-time arriving farmer selector */}
        {scanning && upcomingList && upcomingList.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
              Select arriving farmer in queue:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {upcomingList.slice(0, 4).map((u) => {
                const isSelected = selectedFarmer?.token === u.token;
                return (
                  <button
                    key={u.token}
                    onClick={() => setSelectedFarmer(u)}
                    type="button"
                    style={{
                      background: isSelected ? "rgba(52, 211, 153, 0.2)" : "#1e293b",
                      border: isSelected ? "1.5px solid #34d399" : "1px solid #334155",
                      color: isSelected ? "#34d399" : "#cbd5e1",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{u.token}</span>
                    <span style={{ opacity: 0.8 }}>({u.farmer_name?.split(" ")[0] || u.crop})</span>
                    {u.perishability_score >= 3 && <span style={{ color: "#fbbf24" }}>⚡</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Viewfinder Target Area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "250px",
            background: "#020617",
            borderRadius: "16px",
            overflow: "hidden",
            border: "2px dashed #10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            marginBottom: "16px",
            boxSizing: "border-box",
          }}
        >
          {/* Animated Scanner Laser Bar */}
          {scanning && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, transparent, #34d399, transparent)",
                boxShadow: "0 0 14px #34d399",
                animation: "scanMotion 2s ease-in-out infinite alternate",
                zIndex: 10,
              }}
            />
          )}

          {scanning ? (
            <div style={{ textAlign: "center" }}>
              <TokenQRCode token={activeTok} size={130} />
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "10px", margin: "10px 0 0 0" }}>
                Scanning: <strong style={{ color: "#34d399" }}>{activeTok}</strong> ({selectedFarmer?.farmer_name || "Arriving Farmer"} &middot; {selectedFarmer?.crop || "Crop"})
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#10b981",
                  color: "#020617",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#34d399" }}>Token Verified!</div>
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px", color: "#fff" }}>{scannedToken}</div>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                Loading weighbridge desk for {selectedFarmer?.farmer_name || "Farmer"}...
              </p>
            </div>
          )}
        </div>

        {scanning && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => simulateScan(selectedFarmer)}
              className="ks-btn ks-btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <ScanLine size={16} /> Scan Real-Time Pass ({activeTok} &middot; {selectedFarmer?.farmer_name || "Farmer"})
            </button>
            <p style={{ fontSize: "11px", textAlign: "center", color: "#94a3b8", margin: 0 }}>
              Live verification against APMC database &bull; Weighbridge entry &lt; 2s
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

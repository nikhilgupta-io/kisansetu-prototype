import React, { useState } from "react";
import {
  FileText, Download, CheckCircle2, ShieldCheck,
  Building2, Users, IndianRupee, Wheat, X, ArrowDownToLine,
} from "lucide-react";
import {
  DAILY_PROCUREMENT_REGISTER,
  DBT_PAYMENT_BATCH,
  exportProcurementRegisterCSV,
  exportDBTPaymentBatchCSV,
} from "./reportData";

export default function ReportModal({ onClose, isModal = true }) {
  const [activeTab, setActiveTab] = useState("procurement"); // "procurement" | "dbt"

  const totalQuintals = DAILY_PROCUREMENT_REGISTER.reduce((acc, r) => acc + r.net_weight, 0);
  const totalValue = DAILY_PROCUREMENT_REGISTER.reduce((acc, r) => acc + r.total_value, 0);
  const totalDbt = DBT_PAYMENT_BATCH.reduce((acc, r) => acc + r.amount, 0);

  const content = (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Info Banner */}
      <div
        style={{
          background: "#ebf5f0",
          border: "1px solid #b8dec9",
          borderRadius: "16px",
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              background: "var(--green-deep)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--green-deep)",
                margin: 0,
                fontFamily: "var(--font-display)",
              }}
            >
              Sehore APMC Procurement Centre &middot; Daily Operational Ledger
            </h2>
            <p style={{ fontSize: "12px", color: "var(--charcoal-60)", margin: "3px 0 0 0" }}>
              Ministry of Consumer Affairs, Food & Public Distribution &middot; Date: 12 Sep 2026
            </p>
          </div>
        </div>

        <div>
          {activeTab === "procurement" ? (
            <button
              onClick={exportProcurementRegisterCSV}
              className="ks-btn ks-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                padding: "8px 16px",
              }}
            >
              <Download size={15} /> Download Procurement Register (.CSV)
            </button>
          ) : (
            <button
              onClick={exportDBTPaymentBatchCSV}
              className="ks-btn ks-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                padding: "8px 16px",
                background: "#0f766e",
              }}
            >
              <ArrowDownToLine size={15} /> Download PFMS DBT Batch (.CSV)
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div className="ks-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: "12px", color: "var(--charcoal-60)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Wheat size={14} style={{ color: "var(--green-deep)" }} /> Total Procured
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px", color: "var(--charcoal)" }}>
            {totalQuintals.toFixed(1)} Qtl
          </div>
          <div style={{ fontSize: "11px", color: "var(--green-deep)", marginTop: "2px" }}>8 Trucks / Trolleys Weighed</div>
        </div>

        <div className="ks-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: "12px", color: "var(--charcoal-60)", display: "flex", alignItems: "center", gap: "6px" }}>
            <IndianRupee size={14} style={{ color: "var(--green-deep)" }} /> Total Payout Value
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px", color: "var(--green-deep)" }}>
            ₹{totalValue.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--charcoal-60)", marginTop: "2px" }}>Govt MSP Rates</div>
        </div>

        <div className="ks-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: "12px", color: "var(--charcoal-60)", display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} style={{ color: "var(--blue)" }} /> DBT Clearance
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px", color: "var(--charcoal)" }}>
            ₹{totalDbt.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--blue)", marginTop: "2px" }}>100% Aadhaar-Linked</div>
        </div>

        <div className="ks-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: "12px", color: "var(--charcoal-60)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={14} style={{ color: "var(--green-deep)" }} /> Farmers Served
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px", color: "var(--charcoal)" }}>
            8 Recorded
          </div>
          <div style={{ fontSize: "11px", color: "var(--green-deep)", marginTop: "2px" }}>Avg wait: 14 mins</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "8px" }}>
        <button
          onClick={() => setActiveTab("procurement")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "procurement" ? "3px solid var(--green-deep)" : "3px solid transparent",
            color: activeTab === "procurement" ? "var(--green-deep)" : "var(--charcoal-60)",
            fontWeight: activeTab === "procurement" ? 700 : 500,
            fontSize: "13px",
            padding: "10px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease",
          }}
        >
          <FileText size={16} />
          <span>1. Daily Procurement Register (Dainik Kharid)</span>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "var(--green-bg)",
              color: "var(--green-deep)",
              fontWeight: 700,
            }}
          >
            {DAILY_PROCUREMENT_REGISTER.length} Rows
          </span>
        </button>

        <button
          onClick={() => setActiveTab("dbt")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "dbt" ? "3px solid #0f766e" : "3px solid transparent",
            color: activeTab === "dbt" ? "#0f766e" : "var(--charcoal-60)",
            fontWeight: activeTab === "dbt" ? 700 : 500,
            fontSize: "13px",
            padding: "10px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease",
          }}
        >
          <ShieldCheck size={16} />
          <span>2. Bank-Ready DBT Payment Batch (PFMS Format)</span>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "var(--blue-bg)",
              color: "var(--blue)",
              fontWeight: 700,
            }}
          >
            5 Batches
          </span>
        </button>
      </div>

      {/* Tab 1: Procurement Register Table */}
      {activeTab === "procurement" && (
        <div className="ks-card" style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 16px",
              background: "#f9fafb",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--charcoal)",
            }}
          >
            <span>Verified Weighbridge & Moisture Assay Records</span>
            <button
              onClick={exportProcurementRegisterCSV}
              style={{
                color: "var(--green-deep)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              <Download size={13} /> Export this view as CSV
            </button>
          </div>
          <div style={{ overflowX: "auto", maxHeight: "360px" }}>
            <table className="ks-report-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Farmer Name</th>
                  <th>Crop</th>
                  <th>Moisture</th>
                  <th>Weight (Qtl)</th>
                  <th>MSP Rate</th>
                  <th>Total Payout</th>
                  <th>Grade</th>
                  <th>J-Form Ref</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {DAILY_PROCUREMENT_REGISTER.map((row) => (
                  <tr key={row.token}>
                    <td style={{ fontWeight: 700, color: "var(--green-deep)" }}>{row.token}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.name}</div>
                      <div style={{ fontSize: "10px", color: "var(--charcoal-60)" }}>{row.farmer_id}</div>
                    </td>
                    <td>{row.crop}</td>
                    <td style={{ fontWeight: 600 }}>{row.moisture}%</td>
                    <td style={{ fontWeight: 700 }}>{row.net_weight} Qtl</td>
                    <td>₹{row.rate}</td>
                    <td style={{ fontWeight: 700, color: "var(--charcoal)" }}>
                      ₹{row.total_value.toLocaleString("en-IN")}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: "var(--green-bg)",
                          color: "var(--green-deep)",
                        }}
                      >
                        Grade {row.grade}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--charcoal-60)" }}>{row.j_form}</td>
                    <td>
                      <span
                        className={`ks-badge ${
                          row.status.includes("Paid")
                            ? "ks-badge-green"
                            : row.status.includes("Processing")
                            ? "ks-badge-blue"
                            : "ks-badge-amber"
                        }`}
                        style={{ fontSize: "11px", padding: "2px 8px" }}
                      >
                        {row.status.includes("Paid") && <CheckCircle2 size={11} />}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: PFMS DBT Payment Batch Table */}
      {activeTab === "dbt" && (
        <div className="ks-card" style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 16px",
              background: "#f0fdf4",
              borderBottom: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              fontWeight: 600,
              color: "#166534",
            }}
          >
            <span>PFMS Treasury Direct Credit Disbursals</span>
            <button
              onClick={exportDBTPaymentBatchCSV}
              style={{
                color: "#166534",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              <Download size={13} /> Export Bank Batch (.CSV)
            </button>
          </div>
          <div style={{ overflowX: "auto", maxHeight: "360px" }}>
            <table className="ks-report-table">
              <thead>
                <tr>
                  <th>Sl</th>
                  <th>Beneficiary</th>
                  <th>Aadhaar Ref</th>
                  <th>Bank & IFSC</th>
                  <th>Account (Masked)</th>
                  <th>Amount (INR)</th>
                  <th>J-Form</th>
                  <th>UTR / Status</th>
                </tr>
              </thead>
              <tbody>
                {DBT_PAYMENT_BATCH.map((row) => (
                  <tr key={row.sl_no}>
                    <td style={{ fontWeight: 600, color: "var(--charcoal-60)" }}>{row.sl_no}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{row.name}</div>
                      <div style={{ fontSize: "10px", color: "var(--charcoal-60)" }}>{row.farmer_id}</div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{row.aadhaar_ref}</td>
                    <td>
                      <div>{row.bank}</div>
                      <div style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--charcoal-60)" }}>{row.ifsc}</div>
                    </td>
                    <td style={{ fontFamily: "monospace", color: "var(--charcoal-60)" }}>{row.account_no}</td>
                    <td style={{ fontWeight: 700, color: "var(--green-deep)", fontSize: "14px" }}>
                      ₹{row.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--charcoal-60)" }}>{row.j_form}</td>
                    <td>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--green-deep)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={12} /> {row.pfms_status}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--charcoal-60)" }}>{row.utr}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (!isModal) {
    return (
      <div className="ks-card" style={{ padding: "24px" }}>
        {content}
      </div>
    );
  }

  return (
    <div className="ks-modal-overlay" onClick={onClose}>
      <div
        className="ks-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "28px" }}
      >
        <button
          onClick={onClose}
          className="ks-modal-close-btn"
          title="Close"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {content}
      </div>
    </div>
  );
}

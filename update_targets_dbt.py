#!/usr/bin/env python3
import sys

with open("/home/aquib/Documents/kishan/kisansetu-prototype-frontend/src/App.jsx", "r") as f:
    text = f.read()

# 1. Update TARGET_DATA and DBT_DATA definitions in AdminDashboard
old_target_data = '''  // Government Target Monitor Data (Item a)
  const TARGET_DATA = {
    seasonTargetMT: 500000,
    procuredMT: 342180,
    targetPct: 68.4,
    dailyInfluxMT: 14820,
    remainingDays: 11,
    districts: [
      { name: "Sehore", target: 100000, actual: 82400, pct: 82.4, status: "Ahead of Schedule", arrivalsToday: 3420 },
      { name: "Vidisha", target: 110000, actual: 94200, pct: 85.6, status: "Near Target Capacity", arrivalsToday: 4180 },
      { name: "Bhopal", target: 90000, actual: 58900, pct: 65.4, status: "On Track", arrivalsToday: 2650 },
      { name: "Raisen", target: 85000, actual: 48300, pct: 56.8, status: "Moderate Influx", arrivalsToday: 2190 },
      { name: "Ujjain", target: 115000, actual: 58380, pct: 50.8, status: "Ramping Influx", arrivalsToday: 2380 },
    ],
    crops: [
      { name: "Wheat (गेहूं)", volumeMT: 198460, pct: 58.0, msp: "₹2,275/Qtl", valueCr: "₹451.5 Cr", isPerishable: false },
      { name: "Paddy (धान)", volumeMT: 82120, pct: 24.0, msp: "₹2,300/Qtl", valueCr: "₹188.9 Cr", isPerishable: false },
      { name: "Soybean (सोयाबीन)", volumeMT: 41060, pct: 12.0, msp: "₹4,892/Qtl", valueCr: "₹200.8 Cr", isPerishable: true },
      { name: "Mustard (सरसों)", volumeMT: 20540, pct: 6.0, msp: "₹5,650/Qtl", valueCr: "₹116.0 Cr", isPerishable: true },
    ],
  };

  // Real-Time PFMS DBT Outflow Data (Item b)
  const DBT_DATA = {
    totalCommittedCr: 778.50,
    disbursedCr: 684.20,
    disbursedPct: 87.9,
    pipelineCr: 89.10,
    failedCr: 5.20,
    slaCompliancePct: 96.4,
    avgTatHours: 18.2,
    pipelineStages: [
      { step: "1. Scale Weighed", lots: "12,430 lots", amount: "₹778.5 Cr", note: "100% digital weighbridge verified" },
      { step: "2. J-Form Issued", lots: "12,140 lots", amount: "₹760.8 Cr", note: "Mandi Secretary e-signed" },
      { step: "3. PFMS Batch Pushed", lots: "11,890 lots", amount: "₹744.1 Cr", note: "SBI/RBI Treasury queue" },
      { step: "4. DBT Bank Credit", lots: "10,938 lots", amount: "₹684.2 Cr", note: "Aadhaar UTR confirmed" },
    ],
    recentTrans: [
      { farmer: "Dinesh Yadav", fid: "FR-98217", crop: "Soybean", amount: "₹2,19,161", bank: "Bank of Baroda (...9012)", utr: "BARB77123991", tat: "11h 05m", status: "Settled" },
      { farmer: "Mohan Singh", fid: "FR-98215", crop: "Paddy", amount: "₹1,13,850", bank: "State Bank of India (...4819)", utr: "SBIN89210452", tat: "14h 22m", status: "Settled" },
      { farmer: "Suresh Kumar", fid: "FR-98214", crop: "Wheat", amount: "₹1,47,875", bank: "Punjab National Bank (...6612)", utr: "PUNB00481923", tat: "19h 40m", status: "Settled" },
      { farmer: "Ram Lal", fid: "FR-98213", crop: "Wheat", amount: "₹1,02,375", bank: "Central Bank of India (...3190)", utr: "Batch #MP-2026-09", tat: "In Flight (6h)", status: "PFMS Batch" },
    ],
  };'''

new_target_data = '''  // Government Target Monitor Data (Dynamically adapted to active scope)
  const targetPctCalc = Math.min(100, Math.round(((activeScopeData.procuredMT || 0) / Math.max(activeScopeData.targetMT || 1, 1)) * 1000) / 10);
  const dailyInfluxCalc = selectedMandiId === "all" ? (activeStateObj.dailyInfluxMT || 14820) : Math.max(120, Math.round(activeScopeData.targetMT * 0.035));
  const remainingDaysCalc = selectedMandiId === "all" ? (activeStateObj.remainingDays || 11) : Math.max(1, Math.round((activeScopeData.quotaRemainingMT || 0) / Math.max(dailyInfluxCalc, 1)));

  const TARGET_DATA = {
    seasonTargetMT: activeScopeData.targetMT || 500000,
    procuredMT: activeScopeData.procuredMT || 382910,
    targetPct: targetPctCalc,
    quotaRemainingMT: activeScopeData.quotaRemainingMT || 0,
    quotaRemainingPct: activeScopeData.quotaRemainingPct || 0,
    dailyInfluxMT: dailyInfluxCalc,
    remainingDays: remainingDaysCalc,
    districts: selectedState === "MP" ? [
      { name: "Sehore", target: 100000, actual: 82400, pct: 82.4, status: "Ahead of Schedule", arrivalsToday: 3420 },
      { name: "Vidisha", target: 110000, actual: 94200, pct: 85.6, status: "Near Target Capacity", arrivalsToday: 4180 },
      { name: "Bhopal", target: 90000, actual: 58900, pct: 65.4, status: "On Track", arrivalsToday: 2650 },
      { name: "Raisen", target: 85000, actual: 48300, pct: 56.8, status: "Moderate Influx", arrivalsToday: 2190 },
      { name: "Ujjain", target: 115000, actual: 58380, pct: 50.8, status: "Ramping Influx", arrivalsToday: 2380 },
    ] : (activeStateObj.mandis || []).map((m) => ({
      name: m.name.split(" ")[0],
      target: m.mspQuotaMT,
      actual: m.procuredMT,
      pct: Math.round((m.procuredMT / Math.max(m.mspQuotaMT, 1)) * 100),
      status: m.status === "Critical" ? "Near Target Capacity" : "On Track",
      arrivalsToday: Math.round(m.procuredMT * 0.02),
    })),
    crops: activeScopeData.cropStocks || [
      { name: "Wheat (गेहूं)", volumeMT: 198460, pct: 58.0, msp: "₹2,275/Qtl", valueCr: "₹451.5 Cr", isPerishable: false },
      { name: "Paddy (धान)", volumeMT: 82120, pct: 24.0, msp: "₹2,300/Qtl", valueCr: "₹188.9 Cr", isPerishable: false },
      { name: "Soybean (सोयाबीन)", volumeMT: 41060, pct: 12.0, msp: "₹4,892/Qtl", valueCr: "₹200.8 Cr", isPerishable: true },
      { name: "Mustard (सरसों)", volumeMT: 20540, pct: 6.0, msp: "₹5,650/Qtl", valueCr: "₹116.0 Cr", isPerishable: true },
    ],
  };

  // Real-Time PFMS DBT Outflow Data (Dynamically adapted to active scope)
  const dbtDisbursed = activeScopeData.dbtTransferredCr || 718.30;
  const dbtPipeline = activeScopeData.dbtPipelineCr || 58.30;
  const dbtCommitted = Math.round((dbtDisbursed + dbtPipeline) * 10) / 10;
  const dbtPctCalc = Math.round((dbtDisbursed / Math.max(dbtCommitted, 1)) * 1000) / 10;

  const DBT_DATA = {
    totalCommittedCr: dbtCommitted,
    disbursedCr: dbtDisbursed,
    disbursedPct: dbtPctCalc,
    pipelineCr: dbtPipeline,
    failedCr: Math.round(dbtPipeline * 0.05 * 10) / 10,
    slaCompliancePct: activeMandiObj?.dbtSuccessPct || 96.4,
    avgTatHours: activeScopeData.avgTatHours || 17.2,
    pipelineStages: [
      { step: "1. Scale Weighed", lots: `${(activeScopeData.farmers || 12430).toLocaleString()} lots`, amount: `₹${dbtCommitted} Cr`, note: "100% digital weighbridge verified" },
      { step: "2. J-Form Issued", lots: `${Math.round((activeScopeData.farmers || 12430) * 0.98).toLocaleString()} lots`, amount: `₹${Math.round((dbtDisbursed + dbtPipeline * 0.8) * 10) / 10} Cr`, note: "Mandi Secretary e-signed" },
      { step: "3. PFMS Batch Pushed", lots: `${Math.round((activeScopeData.farmers || 12430) * 0.95).toLocaleString()} lots`, amount: `₹${Math.round((dbtDisbursed + dbtPipeline * 0.4) * 10) / 10} Cr`, note: "SBI/RBI Treasury queue" },
      { step: "4. DBT Bank Credit", lots: `${Math.round((activeScopeData.farmers || 12430) * 0.88).toLocaleString()} lots`, amount: `₹${dbtDisbursed} Cr`, note: "Aadhaar UTR confirmed" },
    ],
    recentTrans: [
      { farmer: "Dinesh Yadav", fid: "FR-98217", crop: "Soybean", amount: "₹2,19,161", bank: "Bank of Baroda (...9012)", utr: "BARB77123991", tat: "11h 05m", status: "Settled" },
      { farmer: "Mohan Singh", fid: "FR-98215", crop: "Paddy", amount: "₹1,13,850", bank: "State Bank of India (...4819)", utr: "SBIN89210452", tat: "14h 22m", status: "Settled" },
      { farmer: "Suresh Kumar", fid: "FR-98214", crop: "Wheat", amount: "₹1,47,875", bank: "Punjab National Bank (...6612)", utr: "PUNB00481923", tat: "19h 40m", status: "Settled" },
      { farmer: "Ram Lal", fid: "FR-98213", crop: "Wheat", amount: "₹1,02,375", bank: "Central Bank of India (...3190)", utr: "Batch #MP-2026-09", tat: "In Flight (6h)", status: "PFMS Batch" },
    ],
  };'''

if old_target_data in text:
    text = text.replace(old_target_data, new_target_data, 1)
    print("Updated TARGET_DATA and DBT_DATA dynamically.")
else:
    print("Warning: old_target_data block not found")

# 2. Update Overview Header & Buttons
old_ov_header = '''            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="ks-display text-2xl font-bold">State Procurement Command Center</h2>
                  <span className="ks-badge ks-badge-green text-xs" style={{ fontSize: "10px" }}>Live APMC Grid</span>
                </div>
                <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                  Department of Food, Civil Supplies & Consumer Affairs &middot; Madhya Pradesh Central Zone
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage("targets")}
                  className="ks-btn text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 border cursor-pointer hover:bg-slate-50"
                  style={{ background: "#fff", borderColor: "var(--border)" }}
                >
                  <TrendingUp size={13} /> Target Analytics
                </button>
                <button
                  onClick={() => setPage("weather")}
                  className="ks-btn text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 border cursor-pointer hover:bg-amber-50"
                  style={{ background: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }}
                >
                  <CloudRain size={13} /> Weather Alert (85%)
                </button>
              </div>
            </div>'''

new_ov_header = '''            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="ks-display text-2xl font-bold">
                    {selectedMandiId === "all" ? `${activeStateObj.name} Command Center` : activeMandiObj?.name}
                  </h2>
                  <span className="ks-badge ks-badge-green text-xs" style={{ fontSize: "10px" }}>
                    {selectedMandiId === "all" ? "Live APMC Grid" : "Focused Mandi View"}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                  Department of Food, Civil Supplies &amp; Consumer Affairs &middot; {activeStateObj.name} ({activeScopeData.district || activeStateObj.zone})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPage("storage")}
                  className="ks-btn text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 border cursor-pointer hover:bg-slate-50"
                  style={{ background: "#fff", borderColor: "var(--border)" }}
                >
                  <Warehouse size={13} className="text-emerald-700" /> Storage &amp; Silos ({((activeScopeData.storageCapacityMT || 330000) / 100000).toFixed(1)}L MT)
                </button>
                <button
                  onClick={() => setPage("targets")}
                  className="ks-btn text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 border cursor-pointer hover:bg-slate-50"
                  style={{ background: "#fff", borderColor: "var(--border)" }}
                >
                  <TrendingUp size={13} /> Target &amp; DBT Ledger
                </button>
                <button
                  onClick={() => setPage("weather")}
                  className="ks-btn text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 border cursor-pointer hover:bg-amber-50"
                  style={{ background: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }}
                >
                  <CloudRain size={13} /> Weather Alert (85%)
                </button>
              </div>
            </div>'''

if old_ov_header in text:
    text = text.replace(old_ov_header, new_ov_header, 1)
    print("Updated overview header.")
else:
    print("Warning: old_ov_header not found")

# 3. Add highlighted MSP Quota Remaining in Season Target card
old_target_card_stats = '''                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span><strong>{TARGET_DATA.procuredMT.toLocaleString()} MT</strong> procured</span>
                  <span>Target: <strong>{TARGET_DATA.seasonTargetMT.toLocaleString()} MT</strong></span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Daily Influx: <strong>{TARGET_DATA.dailyInfluxMT.toLocaleString()} MT / day</strong></span>
                  <span className="text-emerald-700 font-semibold">~{TARGET_DATA.remainingDays} days to target</span>
                </div>'''

new_target_card_stats = '''                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span><strong>{TARGET_DATA.procuredMT.toLocaleString()} MT</strong> procured</span>
                  <span>Target: <strong>{TARGET_DATA.seasonTargetMT.toLocaleString()} MT</strong></span>
                </div>

                {/* Highlighted MSP Quota Remaining */}
                <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs mb-1">
                  <span className="text-emerald-950 font-semibold flex items-center gap-1.5">
                    <Scale size={13} className="text-emerald-700" />
                    <span>MSP Quota Remaining:</span>
                  </span>
                  <span className={`font-extrabold ${TARGET_DATA.quotaRemainingMT === 0 ? "text-red-700" : "text-emerald-800"}`}>
                    {TARGET_DATA.quotaRemainingMT === 0 ? "Exhausted (0 MT)" : `${TARGET_DATA.quotaRemainingMT.toLocaleString()} MT (${TARGET_DATA.quotaRemainingPct}% Open)`}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Daily Influx: <strong>{TARGET_DATA.dailyInfluxMT.toLocaleString()} MT / day</strong></span>
                  <span className="text-emerald-700 font-semibold">~{TARGET_DATA.remainingDays} days to target</span>
                </div>'''

if old_target_card_stats in text:
    text = text.replace(old_target_card_stats, new_target_card_stats, 1)
    print("Updated Target Card with MSP Quota Remaining badge.")
else:
    print("Warning: old_target_card_stats not found")

with open("/home/aquib/Documents/kishan/kisansetu-prototype-frontend/src/App.jsx", "w") as f:
    f.write(text)

print("Finished updating App.jsx.")

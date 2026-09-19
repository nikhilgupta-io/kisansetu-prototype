#!/usr/bin/env python3
import sys

with open("/home/aquib/Documents/kishan/kisansetu-prototype-frontend/src/App.jsx.bak", "r") as f:
    text = f.read()

# 1. Update imports in App.jsx
old_import = 'getAdminOverview, getDemandCapacity, getImbalances, applyAllocationAction,'
new_import = 'getAdminOverview, getAdminStorage, getAdminDbtQuota, getDemandCapacity, getImbalances, applyAllocationAction,'
if old_import in text:
    text = text.replace(old_import, new_import, 1)

old_lucide = 'BrainCircuit, Radar, Scale, Package, LineChart, Cpu, Satellite, TrainTrack,'
new_lucide = 'BrainCircuit, Radar, Scale, Package, LineChart, Cpu, Satellite, TrainTrack,\n  Warehouse, Boxes, Database, Filter, ArrowDownUp, Check,'
if old_lucide in text:
    text = text.replace(old_lucide, new_lucide, 1)

# 2. Add CONSTANTS above function AdminDashboard
with open("/home/aquib/Documents/kishan/kisansetu-prototype-frontend/update_admin_ui.py") as f:
    lines = f.readlines()

# Extract CONSTANTS_CODE
constants_code = ""
start = False
for line in lines:
    if line.startswith("CONSTANTS_CODE = '''"):
        start = True
        continue
    if start and line.startswith("'''"):
        break
    if start:
        constants_code += line

# Add helper components: MandiDbtQuotaTable and RealTimeCropStorageSection
helper_components = '''
/* ------------------------------------------------------------------ */
/* Mandi-Wise DBT & MSP Quota Remaining Ledger Component               */
/* ------------------------------------------------------------------ */

function MandiDbtQuotaTable({ mandis, selectedMandiId, onSelectMandi }) {
  return (
    <div className="ks-card p-5" style={{ background: "#fff", border: "1px solid var(--border)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
              <IndianRupee size={15} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              Mandi-Wise DBT Transferred &amp; Remaining MSP Quota Ledger
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of public treasury disbursements, remaining procurement allocations &amp; yard storage
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full w-fit">
          Live PFMS &amp; APMC Sync
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="ks-table">
          <thead>
            <tr>
              <th>Mandi / Hub</th>
              <th>District</th>
              <th>Sanctioned Quota</th>
              <th>Procured to Date</th>
              <th>MSP Quota Remaining</th>
              <th>Total DBT Transferred</th>
              <th>Pipeline (In Flight)</th>
              <th>Settlement TAT</th>
              <th>Storage Occupancy</th>
              <th>Scope Filter</th>
            </tr>
          </thead>
          <tbody>
            {mandis.map((m) => {
              const isSelected = selectedMandiId === m.id;
              const remMT = m.quotaRemainingMT != null ? m.quotaRemainingMT : Math.max(0, (m.mspQuotaMT || 50000) - (m.procuredMT || 30000));
              const remPct = m.quotaRemainingPct != null ? m.quotaRemainingPct : Math.round((remMT / Math.max(m.mspQuotaMT || 50000, 1)) * 100);
              const isExhausted = remMT === 0;
              const isCritical = remPct < 15;
              const dbtCr = m.dbtTransferredCr != null ? m.dbtTransferredCr : 45.0;
              const pipeCr = m.dbtPipelineCr != null ? m.dbtPipelineCr : 3.5;
              const tat = m.dbtTatHours ? `${m.dbtTatHours}h` : "16.5h";
              const occPct = m.storageOccupancyPct != null ? m.storageOccupancyPct : 60;

              return (
                <tr
                  key={m.id}
                  className={`transition-colors ${isSelected ? "bg-emerald-50/70 font-semibold" : "hover:bg-slate-50/60"}`}
                >
                  <td>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                          Active Scope
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{m.centre_type || m.type}</div>
                  </td>
                  <td className="text-xs text-slate-600">{m.district || "Central Zone"}</td>
                  <td className="text-xs font-semibold text-slate-700">{(m.mspQuotaMT || 0).toLocaleString()} MT</td>
                  <td>
                    <div className="text-xs text-slate-800 font-semibold">{(m.procuredMT || 0).toLocaleString()} MT</div>
                    <div className="text-[10px] text-slate-400">
                      {Math.round(((m.procuredMT || 0) / Math.max(m.mspQuotaMT || 1, 1)) * 100)}% achieved
                    </div>
                  </td>
                  <td>
                    {isExhausted ? (
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                        Exhausted (0 MT)
                      </span>
                    ) : isCritical ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {remMT.toLocaleString()} MT ({remPct}%)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {remMT.toLocaleString()} MT ({remPct}%)
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-900">₹ {dbtCr.toFixed(2)} Cr</span>
                  </td>
                  <td className="text-xs text-slate-600">₹ {pipeCr.toFixed(2)} Cr</td>
                  <td>
                    <span className="text-xs text-slate-700">{tat}</span>
                    <span className="text-[10px] text-emerald-700 block">96.4% &lt;24h</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, occPct)}%`,
                            background: occPct > 90 ? "#DC2626" : occPct > 70 ? "#D97706" : "var(--green-deep)",
                          }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${occPct > 90 ? "text-red-700" : occPct > 70 ? "text-amber-700" : "text-emerald-700"}`}>
                        {occPct}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onSelectMandi(isSelected ? "all" : m.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                        isSelected
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 shadow-xs"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <RotateCcw size={11} /> Reset
                        </>
                      ) : (
                        <>
                          <Check size={11} /> Inspect
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Real-Time Crop Storage Overview Component                           */
/* ------------------------------------------------------------------ */

function RealTimeCropStorageSection({ scopeData, mandis, selectedMandiId, onSelectMandi, onNavigateWeather }) {
  const occPct = scopeData.storageOccupancyPct || 61.2;
  const isCriticalStorage = occPct > 90;

  return (
    <div className="ks-card p-5 mb-6" style={{ background: "#fff", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
            <Warehouse size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">
                Real-Time Crop Storage Overview {scopeData.isMandi ? `· ${scopeData.name}` : "Across All Mandis"}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCriticalStorage ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                {isCriticalStorage ? "Storage Saturated (>90%)" : "61.2% Occupancy · Healthy Buffer"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live capacity telemetry across FCI/CWC modern steel silos, state warehousing godowns &amp; CAP open plinths
            </p>
          </div>
        </div>

        <div className="text-right flex items-center gap-2">
          <span className="text-xs text-slate-500">Intake Buffer:</span>
          <span className="text-sm font-bold text-emerald-700">
            {scopeData.storageAvailableMT.toLocaleString()} MT Open
          </span>
        </div>
      </div>

      {/* Master Capacity Bar */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
          <span className="text-slate-800">
            Total Storage Stored: <strong>{scopeData.storageUsedMT.toLocaleString()} MT</strong> / {scopeData.storageCapacityMT.toLocaleString()} MT
          </span>
          <span className={occPct > 90 ? "text-red-700 font-bold" : "text-emerald-700 font-bold"}>
            {occPct}% Capacity Utilized ({scopeData.storageAvailableMT.toLocaleString()} MT Buffer Remaining)
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, occPct)}%`,
              background: occPct > 90
                ? "linear-gradient(90deg, #DC2626 0%, #991B1B 100%)"
                : occPct > 70
                ? "linear-gradient(90deg, #D97706 0%, #B45309 100%)"
                : "linear-gradient(90deg, var(--green-deep) 0%, #2E7D32 100%)",
            }}
          />
        </div>
      </div>

      {/* 3 Facility Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {/* Silos Card */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <Boxes size={15} className="text-emerald-700" />
              <span>Hermetic Steel Silos</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Zero Spoilage
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {(scopeData.silosUsedMT || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {(scopeData.silosCapacityMT || 0).toLocaleString()} MT</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 my-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-700"
              style={{ width: `${scopeData.silosCapacityMT > 0 ? Math.round((scopeData.silosUsedMT / scopeData.silosCapacityMT) * 100) : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Automated aeration &amp; nitrogen purge. Digital thermistor sensor cables maintain &lt;12% grain moisture safe for 12+ months.
          </p>
        </div>

        {/* Covered Warehouses Card */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <Building2 size={15} className="text-blue-700" />
              <span>Covered Godowns (CWC/SWC)</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
              Bagged Stacks
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {(scopeData.coveredUsedMT || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {(scopeData.coveredCapacityMT || 0).toLocaleString()} MT</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 my-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-700"
              style={{ width: `${scopeData.coveredCapacityMT > 0 ? Math.round((scopeData.coveredUsedMT / scopeData.coveredCapacityMT) * 100) : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Conventional pucca godowns. 50kg jute gunny bag stacking on wooden crates with routine prophylactic fumigation.
          </p>
        </div>

        {/* CAP / Open Plinths Card */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <CloudRain size={15} className="text-amber-700" />
              <span>CAP Open Plinths</span>
            </div>
            {scopeData.openGrainAtRiskMT > 0 ? (
              <button
                type="button"
                onClick={onNavigateWeather}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 transition cursor-pointer"
              >
                🚨 {scopeData.openGrainAtRiskMT.toLocaleString()} MT at Risk
              </button>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                Tarpaulin Protected
              </span>
            )}
          </div>
          <div className="text-lg font-bold text-slate-900">
            {(scopeData.openPlinthUsedMT || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {(scopeData.openPlinthCapacityMT || 0).toLocaleString()} MT</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 my-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-600"
              style={{ width: `${scopeData.openPlinthCapacityMT > 0 ? Math.round((scopeData.openPlinthUsedMT / scopeData.openPlinthCapacityMT) * 100) : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Cover and Plinth storage. Grain stacks covered with 250-micron LDPE tarpaulins. Actively monitored via IMD Doppler radar alerts.
          </p>
        </div>
      </div>

      {/* Crop Breakdown in Storage */}
      <div className="pt-4 border-t border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Current Grain Reserves in Storage (By Crop)</span>
          <span className="text-[11px] text-slate-500 font-normal">Physical Stock In Inventory</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(scopeData.cropStocks || []).map((cs) => (
            <div key={cs.crop} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                <span className="text-slate-800">{cs.crop}</span>
                <span className="text-emerald-700 text-[11px]">{cs.pct}%</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{(cs.volumeMT || 0).toLocaleString()} MT</div>
              {cs.msp && <div className="text-[10px] text-slate-400 mt-0.5">Govt MSP: {cs.msp}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'''

# Insert constants and helper components right before function AdminDashboard
admin_target = "function AdminDashboard({ page, setPage, completed, allocationApplied, applyAllocation, resetAllocation }) {"
if admin_target in text:
    text = text.replace(admin_target, constants_code + "\n" + helper_components + "\n" + admin_target, 1)
    print("Injected CONSTANTS and helper components.")
else:
    print("Error: admin_target not found!")
    sys.exit(1)

with open("/home/aquib/Documents/kishan/kisansetu-prototype-frontend/src/App.jsx", "w") as f:
    f.write(text)

print("Step 1 complete.")

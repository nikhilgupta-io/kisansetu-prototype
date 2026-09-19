#!/usr/bin/env python3
"""
Applies AdminDashboard updates to App.jsx:
- State > Mandi scope state and calculations
- Top jurisdiction filter bar
- Real-time crop storage overview
- Mandi-wise DBT transferred + MSP quota remaining ledger
- Dedicated storage view
"""

with open("/home/aquib/Documents/kishan/kisansetu-prototype-frontend/src/App.jsx", "r") as f:
    code = f.read()

# 1. State hooks & scope data inside AdminDashboard
target_state_hook = '  const [mandiFilter, setMandiFilter] = useState("all");'

replacement_state_hook = '''  const [mandiFilter, setMandiFilter] = useState("all");

  // Regional State > Mandi Jurisdiction Scope
  const [selectedState, setSelectedState] = useState("MP");
  const [selectedMandiId, setSelectedMandiId] = useState("all");

  const activeStateObj = STATE_REGISTRY.find((s) => s.id === selectedState) || STATE_REGISTRY[0];

  const activeStateMandis = selectedState === "MP"
    ? CENTRES.map((c) => {
        const metric = MANDI_METRICS_DATA[c.id] || {};
        return {
          ...c,
          ...metric,
          id: c.id,
          name: c.name,
          name_hi: c.name_hi,
          district: metric.district || "Sehore",
          centre_type: metric.centre_type || c.type,
          type: metric.centre_type || c.type,
          mspQuotaMT: metric.mspQuotaMT || 30000,
          procuredMT: metric.procuredMT || 20000,
          quotaRemainingMT: metric.quotaRemainingMT || 10000,
          quotaRemainingPct: metric.quotaRemainingPct || 33.3,
          dbtTransferredCr: metric.dbtTransferredCr || 40.0,
          dbtPipelineCr: metric.dbtPipelineCr || 3.0,
          dbtTatHours: metric.dbtTatHours || 16.5,
          storageCapacityMT: metric.storageCapacityMT || 20000,
          storageUsedMT: metric.storageUsedMT || 12000,
          storageOccupancyPct: metric.storageOccupancyPct || 60.0,
          silosMT: metric.silosMT || 0,
          silosUsedMT: metric.silosUsedMT || 0,
          coveredMT: metric.coveredMT || 15000,
          coveredUsedMT: metric.coveredUsedMT || 9000,
          openPlinthMT: metric.openPlinthMT || 5000,
          openPlinthUsedMT: metric.openPlinthUsedMT || 3000,
          openGrainAtRiskMT: metric.openGrainAtRiskMT || 0,
          cropsInStorage: metric.cropsInStorage || [],
          queue: c.queue,
          status: metric.liveStatus || c.status,
        };
      })
    : (activeStateObj.mandis || []);

  const activeMandiObj = selectedMandiId !== "all"
    ? activeStateMandis.find((m) => m.id === Number(selectedMandiId)) || null
    : null;

  const activeScopeData = activeMandiObj ? {
    name: activeMandiObj.name,
    district: activeMandiObj.district,
    state: activeStateObj.name,
    isMandi: true,
    targetMT: activeMandiObj.mspQuotaMT,
    procuredMT: activeMandiObj.procuredMT,
    quotaRemainingMT: activeMandiObj.quotaRemainingMT,
    quotaRemainingPct: activeMandiObj.quotaRemainingPct,
    dbtTransferredCr: activeMandiObj.dbtTransferredCr,
    dbtPipelineCr: activeMandiObj.dbtPipelineCr,
    avgTatHours: activeMandiObj.dbtTatHours,
    storageCapacityMT: activeMandiObj.storageCapacityMT,
    storageUsedMT: activeMandiObj.storageUsedMT,
    storageAvailableMT: Math.max(0, activeMandiObj.storageCapacityMT - activeMandiObj.storageUsedMT),
    storageOccupancyPct: activeMandiObj.storageOccupancyPct,
    silosCapacityMT: activeMandiObj.silosCapacityMT || activeMandiObj.silosMT || 0,
    silosUsedMT: activeMandiObj.silosUsedMT || 0,
    coveredCapacityMT: activeMandiObj.coveredCapacityMT || activeMandiObj.coveredMT || 0,
    coveredUsedMT: activeMandiObj.coveredUsedMT || 0,
    openPlinthCapacityMT: activeMandiObj.openPlinthCapacityMT || activeMandiObj.openPlinthMT || 0,
    openPlinthUsedMT: activeMandiObj.openPlinthUsedMT || 0,
    openGrainAtRiskMT: activeMandiObj.openGrainAtRiskMT || 0,
    cropStocks: activeMandiObj.cropsInStorage && activeMandiObj.cropsInStorage.length > 0
      ? activeMandiObj.cropsInStorage
      : [
          { crop: "Wheat", volumeMT: Math.round(activeMandiObj.storageUsedMT * 0.62), pct: 62.0, msp: "₹2,275/Qtl", tone: "green" },
          { crop: "Soybean / Pulses", volumeMT: Math.round(activeMandiObj.storageUsedMT * 0.38), pct: 38.0, msp: "₹4,892/Qtl", tone: "amber" },
        ],
    farmers: activeMandiObj.registeredFarmers || 1850,
    completed: activeMandiObj.todayCompleted || 120,
    waiting: activeMandiObj.queue || 15,
    delayed: activeMandiObj.status === "Critical" ? 12 : 0,
  } : {
    name: `${activeStateObj.name} (State Aggregate · ${activeStateObj.totalMandis} Mandis)`,
    district: activeStateObj.zone,
    state: activeStateObj.name,
    isMandi: false,
    targetMT: activeStateObj.seasonTargetMT,
    procuredMT: activeStateObj.procuredMT,
    quotaRemainingMT: activeStateObj.quotaRemainingMT,
    quotaRemainingPct: activeStateObj.quotaRemainingPct,
    dbtTransferredCr: activeStateObj.dbtTransferredCr,
    dbtPipelineCr: activeStateObj.dbtPipelineCr,
    avgTatHours: activeStateObj.avgTatHours,
    storageCapacityMT: activeStateObj.storageCapacityMT,
    storageUsedMT: activeStateObj.storageUsedMT,
    storageAvailableMT: activeStateObj.storageAvailableMT,
    storageOccupancyPct: activeStateObj.storageOccupancyPct,
    silosCapacityMT: activeStateObj.silosCapacityMT,
    silosUsedMT: activeStateObj.silosUsedMT,
    coveredCapacityMT: activeStateObj.coveredCapacityMT,
    coveredUsedMT: activeStateObj.coveredUsedMT,
    openPlinthCapacityMT: activeStateObj.openPlinthCapacityMT,
    openPlinthUsedMT: activeStateObj.openPlinthUsedMT,
    openGrainAtRiskMT: activeStateObj.openGrainAtRiskMT,
    cropStocks: activeStateObj.cropStocks,
    farmers: 12430,
    completed: completed || 8920,
    waiting: 1284,
    delayed: 97,
  };

  const activeScopeStatus = activeMandiObj
    ? (activeMandiObj.storageOccupancyPct > 90
        ? { label: "Critical Storage Alert", bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" }
        : activeMandiObj.storageOccupancyPct > 70
        ? { label: "Busy Influx", bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" }
        : { label: "Normal Buffer", bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" })
    : { label: `${activeStateObj.statusBadge}`, bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" };'''

if target_state_hook in code:
    code = code.replace(target_state_hook, replacement_state_hook, 1)
    print("Injected state hooks.")
else:
    print("Warning: target_state_hook not found")

# 2. Update links array to include storage
old_links = '''  const links = [
    { id: "overview", label: "Command Overview", icon: LayoutGrid },
    { id: "targets", label: "Procurement & DBT", icon: TrendingUp },
    { id: "weather", label: "IMD Weather Alert", icon: CloudRain, badge: "85% Rain" },'''

new_links = '''  const links = [
    { id: "overview", label: "Command Overview", icon: LayoutGrid },
    { id: "targets", label: "Procurement & DBT", icon: TrendingUp },
    { id: "storage", label: "Crop Storage & Silos", icon: Warehouse, badge: `${(activeScopeData.storageCapacityMT / 100000).toFixed(1)}L MT` },
    { id: "weather", label: "IMD Weather Alert", icon: CloudRain, badge: "85% Rain" },'''

if old_links in code:
    code = code.replace(old_links, new_links, 1)
    print("Injected storage link into sidebar.")
else:
    print("Warning: old_links not found")

# 3. Add Top Jurisdiction Filter Bar right above {/* VIEW 1: COMMAND OVERVIEW */}
old_main_top = '''      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        {/* VIEW 1: COMMAND OVERVIEW */}'''

new_main_top = '''      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        {/* TOP REGIONAL JURISDICTION FILTER BAR: STATE > MANDI */}
        <div className="ks-card p-3.5 mb-6 border transition-all" style={{ background: "#fff", borderColor: "var(--border)" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Filter size={13} className="text-emerald-700" />
                <span>Jurisdiction:</span>
              </span>

              {/* State Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs">
                <Globe size={13} className="text-emerald-700 shrink-0" />
                <span className="text-[11px] text-slate-500 font-semibold">State:</span>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedMandiId("all");
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  {STATE_REGISTRY.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.id === "MP" ? "(Active Cluster · 12 Mandis)" : `(${st.totalMandis} Mandis)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandi Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs">
                <Building2 size={13} className="text-emerald-700 shrink-0" />
                <span className="text-[11px] text-slate-500 font-semibold">Mandi:</span>
                <select
                  value={selectedMandiId}
                  onChange={(e) => setSelectedMandiId(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-[240px] truncate"
                >
                  <option value="all">All Mandis ({activeStateObj.totalMandis} Hubs · State Aggregate)</option>
                  {activeStateMandis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.district ? `${m.district} · ` : ""}{m.centre_type || m.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset to All Mandis chip */}
              {selectedMandiId !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedMandiId("all")}
                  className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2.5 py-1 cursor-pointer transition flex items-center gap-1 shadow-xs"
                >
                  <RotateCcw size={11} />
                  <span>View All {activeStateObj.name} Mandis</span>
                </button>
              )}
            </div>

            {/* Status & Scope Pill */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-slate-400 font-medium">Active Scope</div>
                <div className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                  {selectedMandiId === "all" ? `${activeStateObj.name} Zone` : activeMandiObj?.name}
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                style={{
                  background: activeScopeStatus.bg,
                  color: activeScopeStatus.color,
                  borderColor: activeScopeStatus.border,
                }}
              >
                {activeScopeStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* VIEW 1: COMMAND OVERVIEW */}'''

if old_main_top in code:
    code = code.replace(old_main_top, new_main_top, 1)
    print("Injected top jurisdiction filter bar.")
else:
    print("Warning: old_main_top not found")

# 4. In overview: Add Storage and DBT Quota table after stat tiles
old_tiles = '''            {/* 4 Stat Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatTile label="Total Farmers Registered" value={stats.total_farmers.toLocaleString()} icon={Users} />
              <StatTile label="Completed Today" value={stats.completed.toLocaleString()} icon={CheckCircle2} />
              <StatTile label="Waiting in Queue" value={stats.waiting.toLocaleString()} icon={Clock} />
              <StatTile label="Capacity Reallocated" value={stats.delayed.toLocaleString()} icon={AlertTriangle} />
            </div>'''

new_tiles = '''            {/* 4 Stat Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatTile label="Total Farmers Registered" value={(activeScopeData.farmers || stats.total_farmers).toLocaleString()} icon={Users} />
              <StatTile label="Completed Today" value={(activeScopeData.completed || stats.completed).toLocaleString()} icon={CheckCircle2} />
              <StatTile label="Waiting in Queue" value={(activeScopeData.waiting || stats.waiting).toLocaleString()} icon={Clock} />
              <StatTile label="Capacity Reallocated" value={(activeScopeData.delayed || stats.delayed).toLocaleString()} icon={AlertTriangle} />
            </div>

            {/* REAL-TIME CROP STORAGE OVERVIEW ACROSS MANDIS */}
            <RealTimeCropStorageSection
              scopeData={activeScopeData}
              mandis={activeStateMandis}
              selectedMandiId={selectedMandiId}
              onSelectMandi={setSelectedMandiId}
              onNavigateWeather={() => setPage("weather")}
            />

            {/* MANDI-WISE TOTAL DBT TRANSFERRED + REMAINING MSP QUOTA LEDGER */}
            <div className="mb-6">
              <MandiDbtQuotaTable
                mandis={activeStateMandis}
                selectedMandiId={selectedMandiId}
                onSelectMandi={setSelectedMandiId}
              />
            </div>'''

if old_tiles in code:
    code = code.replace(old_tiles, new_tiles, 1)
    print("Injected RealTimeCropStorageSection & MandiDbtQuotaTable in overview.")
else:
    print("Warning: old_tiles not found")

# 5. In targets: Add MandiDbtQuotaTable
old_targets_end = '''                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}'''

new_targets_end = '''                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* MANDI-WISE TOTAL DBT TRANSFERRED + REMAINING MSP QUOTA LEDGER */}
            <MandiDbtQuotaTable
              mandis={activeStateMandis}
              selectedMandiId={selectedMandiId}
              onSelectMandi={setSelectedMandiId}
            />
          </div>
        )}

        {/* VIEW: REAL-TIME CROP STORAGE & TERMINAL SILO NETWORK */}
        {page === "storage" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="ks-display text-2xl font-bold">State Grain Storage &amp; Terminal Silos</h2>
                  <span className="ks-badge ks-badge-green text-xs">CWC &amp; FCI Network</span>
                </div>
                <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                  Live warehousing telemetry across central zone silos, state SWC godowns &amp; open-plinth grain buffers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPage("weather")}
                className="ks-btn text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 border cursor-pointer hover:bg-amber-50"
                style={{ background: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }}
              >
                <CloudRain size={13} /> Inspect Open Grain Under Rain Risk
              </button>
            </div>

            <RealTimeCropStorageSection
              scopeData={activeScopeData}
              mandis={activeStateMandis}
              selectedMandiId={selectedMandiId}
              onSelectMandi={setSelectedMandiId}
              onNavigateWeather={() => setPage("weather")}
            />

            <MandiDbtQuotaTable
              mandis={activeStateMandis}
              selectedMandiId={selectedMandiId}
              onSelectMandi={setSelectedMandiId}
            />
          </div>
        )}'''

if old_targets_end in code:
    code = code.replace(old_targets_end, new_targets_end, 1)
    print("Injected storage view & MandiDbtQuotaTable in targets.")
else:
    print("Warning: old_targets_end not found")

with open("/home/aquib/Documents/kishan/kisansetu-prototype-frontend/src/App.jsx", "w") as f:
    f.write(code)

print("Finished applying changes to App.jsx.")

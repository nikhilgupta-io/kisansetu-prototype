import { useState, useEffect } from "react";
import {
  getFarmerDashboard, getFarmerStatus, getSlots, bookSlot,
  getQueue, advanceQueue, resetQueue,
  getMandiDashboard, getMandiUpcoming, startProcessing, completeProcurement,
  getAdminOverview, getDemandCapacity, getImbalances, applyAllocationAction,
  getCropPerishability,
} from "./api";
import {
  Wheat, Clock, CheckCircle2, Circle, Calendar,
  ArrowRight, Users, TrendingUp, AlertTriangle, Wifi, WifiOff,
  Globe, Home as HomeIcon, BarChart3, Settings, Bell, Search,
  ScanLine, ClipboardList, ChevronRight, Download, CalendarPlus,
  UserCog, LayoutGrid, MapPinned, FileBarChart, ListChecks,
  PhoneCall, Phone, Smartphone, IndianRupee, Sparkles, RotateCcw,
  Volume2, FileSpreadsheet, Zap, Info, CloudRain, ShieldAlert,
  CloudLightning, ShieldCheck, Droplets, Landmark, Layers,
  Compass, Radio, Navigation, Building2, Truck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";
import IVRSimulator from "./IVRSimulator";
import { queueOfflineAction, getPendingCount, syncNow, startAutoSync, onSyncChange } from "./syncManager";
import { playChime, speakVernacular } from "./audioHelper";
import { TokenQRCode, QRScannerModal } from "./qrHelper";
import ReportModal from "./ReportModal";

/* ------------------------------------------------------------------ */
/* Tokens & mock data                                                  */
/* ------------------------------------------------------------------ */

const T = {
  en: {
    greeting: "Namaste, Ram Lal!",
    nextProcurement: "Your Next Procurement",
    slotConfirmed: "Slot Confirmed",
    viewQueue: "View Queue",
    viewStatus: "View Procurement Status",
    bookSlot: "Book Slot",
    myQueue: "My Queue",
    procurementStatus: "Procurement Status",
    paymentDetails: "Payment Details",
    arriveNote: "Your slot is confirmed. Please arrive 15 minutes before your scheduled time.",
    home: "Home",
    queue: "Queue",
    status: "Status",
  },
  hi: {
    greeting: "नमस्ते, रामलाल जी!",
    nextProcurement: "आपकी अगली खरीद",
    slotConfirmed: "स्लॉट पक्का हुआ",
    viewQueue: "कतार देखें",
    viewStatus: "खरीद की स्थिति देखें",
    bookSlot: "स्लॉट बुक करें",
    myQueue: "मेरी कतार",
    procurementStatus: "खरीद की स्थिति",
    paymentDetails: "भुगतान विवरण",
    arriveNote: "आपका स्लॉट पक्का हो गया है। कृपया तय समय से 15 मिनट पहले पहुँचें।",
    home: "होम",
    queue: "कतार",
    status: "स्थिति",
  },
};

const FARMER = {
  name: { en: "Ram Lal", hi: "रामलाल" },
  id: "FR-98213",
  crop: { en: "Wheat", hi: "गेहूं" },
  centre: { en: "Sehore Procurement Centre", hi: "सीहोर खरीद केंद्र" },
  token: "A-127",
  slotDate: "12 September 2026",
  slotTime: "10:30 AM \u2013 11:30 AM",
  quantity: "42.5 Quintal",
  expectedQty: "40 Quintal",
  rate: "\u20B92,175 / Quintal",
  value: "\u20B992,437.50",
  qualityGrade: "A",
};

const SLOTS = [
  { id: "s1", time: "08:00 AM \u2013 09:00 AM", left: 12, tag: "open" },
  { id: "s2", time: "09:00 AM \u2013 10:00 AM", left: 8, tag: "open" },
  { id: "s3", time: "10:30 AM \u2013 11:30 AM", left: 6, tag: "recommended" },
  { id: "s4", time: "11:00 AM \u2013 12:00 PM", left: 3, tag: "limited" },
  { id: "s5", time: "12:00 PM \u2013 01:00 PM", left: 0, tag: "full" },
];

const CENTRES = [
  // 10-km Hyper-Local Radial Cluster (Sehore Central Hub)
  { id: 1, name: "Sehore Main APMC Mandi", name_hi: "सीहोर मुख्य मंडी", type: "Main Hub", distanceKm: 0.0, queue: 48, capacity: 98, openQuotaMT: 0, status: "Critical", x: 28, y: 55, isHub: true, inCluster10km: true },
  { id: 2, name: "Ichhawar Sub-Mandi", name_hi: "इछावर उप-मंडी", type: "Sub-Mandi", distanceKm: 7.2, queue: 8, capacity: 38, openQuotaMT: 420, status: "Normal", x: 26, y: 63, inCluster10km: true },
  { id: 3, name: "Bilkisganj Rural Yard", name_hi: "बिलकिसगंज ग्रामीण केंद्र", type: "Rural Yard", distanceKm: 9.4, queue: 4, capacity: 25, openQuotaMT: 650, status: "Normal", x: 34, y: 56, inCluster10km: true },
  { id: 4, name: "Phanda Logistics Yard", name_hi: "फंदा उपार्जन केंद्र", type: "Sub-Mandi", distanceKm: 9.8, queue: 6, capacity: 31, openQuotaMT: 510, status: "Normal", x: 38, y: 52, inCluster10km: true },
  { id: 5, name: "Shyampur Agro Center", name_hi: "श्यामपुर उप-मंडी", type: "Sub-Mandi", distanceKm: 11.2, queue: 11, capacity: 46, openQuotaMT: 380, status: "Normal", x: 25, y: 46, inCluster10km: true },
  { id: 6, name: "Doraha Kisan Yard", name_hi: "दोराहा किसान केंद्र", type: "Rural Yard", distanceKm: 12.0, queue: 5, capacity: 29, openQuotaMT: 340, status: "Normal", x: 33, y: 47, inCluster10km: true },
  { id: 7, name: "Ashta Grain Hub", name_hi: "आष्टा अनाज मंडी", type: "Regional Hub", distanceKm: 14.5, queue: 21, capacity: 68, openQuotaMT: 720, status: "Busy", x: 19, y: 60, inCluster10km: false },
  
  // Regional District Mandis
  { id: 8, name: "Vidisha Main APMC", name_hi: "विदिशा मुख्य मंडी", type: "Main Hub", distanceKm: 42.0, queue: 42, capacity: 94, openQuotaMT: 850, status: "Critical", x: 70, y: 34, inCluster10km: false },
  { id: 9, name: "Gulabganj Sub-Mandi", name_hi: "गुलाबगंज उप-मंडी", type: "Sub-Mandi", distanceKm: 48.5, queue: 7, capacity: 34, openQuotaMT: 480, status: "Normal", x: 75, y: 28, inCluster10km: false },
  { id: 10, name: "Bhopal Bairagarh Terminal", name_hi: "भोपाल बैरागढ़ टर्मिनल", type: "Mega Hub", distanceKm: 35.0, queue: 15, capacity: 45, openQuotaMT: 1850, status: "Normal", x: 50, y: 50, inCluster10km: false },
  { id: 11, name: "Raisen Krishi Mandi", name_hi: "रायसेन कृषि मंडी", type: "Main Hub", distanceKm: 58.0, queue: 11, capacity: 54, openQuotaMT: 920, status: "Normal", x: 66, y: 66, inCluster10km: false },
  { id: 12, name: "Ujjain Central Mandi", name_hi: "उज्जैन केंद्रीय मंडी", type: "Regional Terminal", distanceKm: 92.0, queue: 14, capacity: 50, openQuotaMT: 1200, status: "Normal", x: 16, y: 78, inCluster10km: false },
];

const DEMAND_BASE = [
  { hour: "08 AM", demand: 40, capacity: 60 },
  { hour: "09 AM", demand: 55, capacity: 60 },
  { hour: "10 AM", demand: 78, capacity: 60 },
  { hour: "11 AM", demand: 82, capacity: 60 },
  { hour: "12 PM", demand: 50, capacity: 60 },
  { hour: "01 PM", demand: 30, capacity: 60 },
];

const DEMAND_FIXED = [
  { hour: "08 AM", demand: 40, capacity: 60 },
  { hour: "09 AM", demand: 55, capacity: 60 },
  { hour: "10 AM", demand: 64, capacity: 60 },
  { hour: "11 AM", demand: 68, capacity: 60 },
  { hour: "12 PM", demand: 64, capacity: 60 },
  { hour: "01 PM", demand: 30, capacity: 60 },
];

/* ------------------------------------------------------------------ */
/* Small shared bits                                                   */
/* ------------------------------------------------------------------ */

function Badge({ tone = "green", children, icon: Icon }) {
  return (
    <span className={`ks-badge ks-badge-${tone}`}>
      {Icon && <Icon size={13} />}
      {children}
    </span>
  );
}

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="ks-card p-5 flex items-center gap-4">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 44, height: 44, background: "var(--green-bg)" }}
      >
        <Icon size={20} style={{ color: "var(--green-deep)" }} />
      </div>
      <div>
        <div className="ks-display text-2xl font-bold" style={{ color: "var(--charcoal)" }}>
          {value}
        </div>
        <div className="text-sm" style={{ color: "var(--charcoal-60)" }}>{label}</div>
      </div>
    </div>
  );
}

function DemoSwitcher({ role, setRole }) {
  const items = [
    { id: "landing", label: "Landing" },
    { id: "farmer", label: "Farmer" },
    { id: "mandi", label: "Mandi Staff" },
    { id: "admin", label: "Admin" },
  ];
  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 flex gap-1 p-1"
      style={{ transform: "translateX(-50%)", background: "#fff", border: "1px dashed var(--border)", borderRadius: 999, boxShadow: "0 6px 20px rgba(38,36,32,0.12)" }}
    >
      <span className="text-xs px-2 flex items-center" style={{ color: "var(--charcoal-60)" }}>Demo view:</span>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => setRole(it.id)}
          className="ks-btn text-xs px-3 py-1.5"
          style={
            role === it.id
              ? { background: "var(--green-deep)", color: "#fff" }
              : { background: "transparent", color: "var(--charcoal-60)" }
          }
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LANDING                                                            */
/* ------------------------------------------------------------------ */

function Landing({ goFarmer, goMandi, goAdmin }) {
  return (
    <div className="ks-root min-h-screen">
      <header className="flex items-center justify-between px-8 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "var(--green-deep)" }}>
            <Wheat size={19} color="#fff" />
          </div>
          <span className="ks-display text-xl font-bold">KisanSetu</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "var(--charcoal-60)" }}>
          <span>Home</span>
          <span>How It Works</span>
          <span>About</span>
          <span className="flex items-center gap-1"><Globe size={15} /> EN</span>
        </nav>
        <button className="ks-btn ks-btn-primary text-sm px-5 py-2.5" onClick={goFarmer}>Get Started</button>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-14">
        {/* <span className="ks-badge ks-badge-green mb-6"><Sparkles size={13} /> Smart India Hackathon 2026 &middot; PS 26032</span> */}
        <h1 className="ks-display font-bold leading-tight mt-5" style={{ fontSize: "56px" }}>KisanSetu</h1>
        <p className="ks-display font-semibold mt-2" style={{ fontSize: "22px", color: "var(--green-deep)" }}>
          Smart Procurement. Less Waiting.
        </p>
        <p className="mt-5 max-w-xl mx-auto" style={{ color: "var(--charcoal-60)", lineHeight: 1.7 }}>
          Book your procurement slot, track your queue, and stay informed about your procurement
          status &mdash; even with unreliable connectivity.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button onClick={goFarmer} className="ks-btn ks-btn-primary px-6 py-3 flex items-center gap-2">
            I'm a Farmer <ArrowRight size={16} />
          </button>
          <button onClick={goMandi} className="ks-btn ks-btn-outline px-6 py-3">Mandi Staff</button>
          <button onClick={goAdmin} className="ks-btn ks-btn-outline px-6 py-3">Admin</button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-4 pb-16">
        {[
          { icon: Smartphone, title: "Dual-Channel Booking", body: "Smartphone web app + Toll-free IVR voice call for basic keypad phones." },
          { icon: Sparkles, title: "Crop Loss Prevention", body: "Perishable crops (Soybean, Mustard) get prioritized early morning slots." },
          { icon: Clock, title: "Live Queue & Tokens", body: "Live token estimates replace hours of chaotic waiting outside mandis." },
          { icon: WifiOff, title: "Offline-First Sync", body: "Mandi staff can weigh & log trucks offline; auto-syncs when signal returns." },
        ].map((f) => (
          <div key={f.title} className="ks-card p-5">
            <div className="flex items-center justify-center rounded-full mb-3" style={{ width: 40, height: 40, background: "var(--green-bg)" }}>
              <f.icon size={19} style={{ color: "var(--green-deep)" }} />
            </div>
            <div className="font-semibold text-sm mb-1">{f.title}</div>
            <div className="text-xs" style={{ color: "var(--charcoal-60)", lineHeight: 1.5 }}>{f.body}</div>
          </div>
        ))}
      </section>

      <section className="py-14" style={{ background: "var(--green-deep)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-sm font-medium mb-8 tracking-wide" style={{ color: "#BFD8C7" }}>
            How it works
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Register", "Book Slot", "Get Token", "Procurement", "Payment"].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="ks-card px-4 py-2.5 text-sm font-semibold" style={{ border: "none" }}>{step}</div>
                {i < arr.length - 1 && <ChevronRight size={16} color="#8FB89B" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — shared chrome                                             */
/* ------------------------------------------------------------------ */

function FarmerChrome({ lang, setLang, offline, setOffline, view, setView, children }) {
  const t = T[lang];
  const nav = [
    { id: "dashboard", icon: HomeIcon, label: t.home },
    { id: "book", icon: Smartphone, label: lang === "en" ? "Book Online" : "ऑनलाइन बुक" },
    { id: "ivr", icon: PhoneCall, label: lang === "en" ? "Call (IVR)" : "कॉल बुकिंग" },
    { id: "queue", icon: ListChecks, label: t.queue },
    { id: "statusPage", icon: ClipboardList, label: t.status },
  ];
  
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Start auto-sync engine
    startAutoSync(15000);
    // Listen for sync changes
    const unsub = onSyncChange((count) => setPendingCount(count));
    // Initial count
    getPendingCount().then(setPendingCount);
    return unsub;
  }, []);

  return (
    <div className="ks-root min-h-screen pb-24 md:pb-6">
      <header className="flex flex-wrap items-center justify-between px-5 py-3.5 gap-2" style={{ borderBottom: "1px solid var(--border)", background: "#fff" }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("dashboard")}>
          <div className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: "var(--green-deep)" }}>
            <Wheat size={15} color="#fff" />
          </div>
          <span className="ks-display font-bold text-base">KisanSetu</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--cream-2)" }}>
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: view === n.id ? "var(--green-deep)" : "transparent",
                color: view === n.id ? "#fff" : "var(--charcoal-60)",
              }}
            >
              <n.icon size={14} />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffline(!offline)}
            className="ks-btn flex items-center gap-1.5 text-xs px-2.5 py-1.5"
            style={offline ? { background: "var(--amber-bg)", color: "var(--amber)" } : { background: "var(--green-bg)", color: "var(--green-deep)" }}
            title="Simulate offline mode"
          >
            {offline ? <WifiOff size={13} /> : <Wifi size={13} />}
            {offline ? "Poor Connectivity" : "Online"}
          </button>
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="ks-btn flex items-center gap-1 text-xs px-2.5 py-1.5"
            style={{ background: "var(--cream-2)", color: "var(--charcoal)" }}
          >
            <Globe size={13} /> {lang === "en" ? "हिंदी" : "EN"}
          </button>
          <Bell size={18} style={{ color: "var(--charcoal-60)" }} />
        </div>
      </header>

      {offline && (
        <div className="flex items-center gap-2 px-5 py-2 text-xs font-medium" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
          <WifiOff size={13} /> Offline mode active &middot; changes will sync automatically &middot; Pending sync: {pendingCount}
        </div>
      )}

      <main className="max-w-md mx-auto px-4 py-5">{children}</main>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2.5 z-50 shadow-lg"
        style={{ background: "#fff", borderTop: "1px solid var(--border)" }}
      >
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className="flex flex-col items-center gap-1 text-xs px-2 py-1"
            style={{ color: view === n.id ? "var(--green-deep)" : "var(--charcoal-60)", fontWeight: view === n.id ? 700 : 500 }}
          >
            <n.icon size={18} />
            <span style={{ fontSize: "11px" }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — dashboard                                                   */
/* ------------------------------------------------------------------ */

function FarmerDashboard({ lang, setView, procurementDone, setProcurementDone }) {
  const t = T[lang];
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFarmerDashboard("FR-98213", null).then((data) => {
      if (data) {
        setDashData(data);
        if (data.procurement_done) setProcurementDone(true);
      }
      setLoading(false);
    });
  }, [procurementDone]);

  // Use API data if available, otherwise fall back to hardcoded FARMER
  const centre = dashData?.centre ? dashData.centre : FARMER.centre;
  const centreName = dashData?.centre ? (lang === "hi" ? dashData.centre.name_hi : dashData.centre.name) : FARMER.centre[lang];
  const slotDate = dashData?.slot ? dashData.slot.date : FARMER.slotDate;
  const slotTime = dashData?.slot ? dashData.slot.display_time : FARMER.slotTime;
  const token = dashData?.token || FARMER.token;
  const waitMin = dashData?.estimated_wait_min ?? 17;
  const isDone = dashData?.procurement_done ?? procurementDone;

  return (
    <div>
      {/* 1. Header Greeting */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="ks-display text-2xl font-bold tracking-tight mb-0.5">{t.greeting}</h2>
          <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
            {lang === "hi" ? "पंजीकरण आईडी: FR-98213 · सीहोर खरीद केंद्र" : "Registration ID: FR-98213 · Sehore Procurement Centre"}
          </p>
        </div>
        <Badge tone="green" icon={CheckCircle2}>Active Farmer</Badge>
      </div>

      {/* 2. Hero Confirmed Ticket Card (Right at Top) */}
      <div className="ks-card p-5 mb-4 shadow-sm" style={{ background: "var(--green-deep)", border: "none", color: "#fff" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: "#CFE3D5" }} />
            <span className="text-sm font-medium" style={{ color: "#CFE3D5" }}>{t.nextProcurement}</span>
          </div>
          <Badge tone="green" icon={CheckCircle2}>{t.slotConfirmed}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
          <div>
            <div style={{ color: "#9FC2AA", fontSize: "11px" }}>Date</div>
            <div className="font-semibold text-white">{slotDate}</div>
          </div>
          <div>
            <div style={{ color: "#9FC2AA", fontSize: "11px" }}>Time Slot</div>
            <div className="font-semibold text-white">{slotTime.split(" – ")[0]}</div>
          </div>
          <div>
            <div style={{ color: "#9FC2AA", fontSize: "11px" }}>Token No.</div>
            <div className="font-bold text-2xl text-white">{token}</div>
          </div>
          <div>
            <div style={{ color: "#9FC2AA", fontSize: "11px" }}>Est. Waiting</div>
            <div className="font-semibold text-white">{waitMin}–{waitMin + 5} min</div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => setView("queue")}
            className="ks-btn text-xs font-bold px-4 py-2.5 flex-1 flex items-center justify-center gap-1.5 shadow-xs transition-all hover:bg-slate-50 cursor-pointer"
            style={{ background: "#fff", color: "var(--green-deep)" }}
          >
            <ListChecks size={15} />
            <span>{t.viewQueue}</span>
          </button>
          <button
            onClick={() => setView("statusPage")}
            className="ks-btn text-xs font-semibold px-4 py-2.5 flex-1 flex items-center justify-center gap-1.5 transition-all hover:bg-white/20 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <ClipboardList size={15} />
            <span>{t.viewStatus}</span>
          </button>
        </div>

        {/* Vernacular Audio Guidance */}
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <button
            onClick={() => {
              playChime();
              const text = lang === "hi"
                ? `नमस्ते रामलाल जी! आपका टोकन नंबर ${token} पक्का है। सीहोर खरीद केंद्र पर समय ${slotTime} है। अनुमानित प्रतीक्षा समय ${waitMin} मिनट है।`
                : `Hello Ram Lal! Your token ${token} is confirmed at ${centreName}. Time slot: ${slotTime}. Estimated wait: ${waitMin} minutes.`;
              speakVernacular(text, lang);
            }}
            className="ks-btn w-full py-2 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer hover:bg-white/25"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
          >
            <Volume2 size={15} />
            <span>{lang === "hi" ? "बोलकर सुनें (Voice Guidance Audio)" : "Listen Ticket Details (Audio)"}</span>
          </button>
          <div className="text-[11px] text-center mt-1.5 opacity-75" style={{ color: "#CFE3D5" }}>
            {lang === "hi"
              ? "🔊 वॉयस सहायता: कम पढ़े-लिखे किसान भाइयों के लिए टोकन व समय हिंदी में बोलकर सुनाता है"
              : "🔊 Voice Guidance: Reads pass details aloud for accessibility"}
          </div>
        </div>
      </div>

      {/* 3. Important Notification Note */}
      <div className="flex items-start gap-2.5 ks-card p-3.5 mb-5" style={{ background: "var(--blue-bg)", border: "none" }}>
        <Bell size={16} style={{ color: "var(--blue)", marginTop: 2, flexShrink: 0 }} />
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--blue)" }}>
          {isDone
            ? "Procurement completed successfully. Payment has been initiated."
            : T[lang].arriveNote}
        </p>
      </div>

      {/* 4. Services & Quick Actions Grid (Clean, Matching Landing Page) */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-sm font-bold tracking-tight" style={{ color: "var(--charcoal)" }}>
            {lang === "hi" ? "सेवाएं व बुकिंग माध्यम" : "Services & Booking Channels"}
          </h3>
          <span className="text-xs" style={{ color: "var(--charcoal-60)" }}>
            {lang === "hi" ? "ऑनलाइन या फोन कॉल" : "Online or Toll-Free"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Smartphone Booking */}
          <button
            onClick={() => setView("book")}
            className="ks-card p-4 text-left transition-all hover:shadow-sm cursor-pointer group flex flex-col justify-between"
            style={{ background: "#ffffff", border: "1px solid var(--border)" }}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}
                >
                  <Smartphone size={18} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                  {lang === "hi" ? "AI प्राथमिकता" : "AI Priority"}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">
                {lang === "hi" ? "स्मार्टफोन ऑनलाइन बुकिंग" : "Book Slot (App)"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === "hi"
                  ? "फसल पेरिशेबिलिटी प्राथमिकता व मंडी गेट हेतु डिजिटल QR पास।"
                  : "Crop perishability priority booking with instant gate QR pass."}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: "var(--green-deep)" }}>
              <span>{lang === "hi" ? "स्लॉट बुक करें" : "Book Online"}</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Card 2: IVR Call Booking */}
          <button
            onClick={() => setView("ivr")}
            className="ks-card p-4 text-left transition-all hover:shadow-sm cursor-pointer group flex flex-col justify-between"
            style={{ background: "#ffffff", border: "1px solid var(--border)" }}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--amber-bg)", color: "var(--amber)" }}
                >
                  <PhoneCall size={18} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
                  {lang === "hi" ? "बिना इंटरनेट" : "Zero Internet"}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">
                {lang === "hi" ? "कॉल बुकिंग (IVR 1800)" : "Call Booking (IVR)"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === "hi"
                  ? "साधारण फोन के कीपैड से कॉल करें व सीधा SMS टोकन पाएं।"
                  : "Dial toll-free 1800 from keypad phone; receive instant SMS ticket."}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: "var(--amber)" }}>
              <span>{lang === "hi" ? "डायलपैड सिम्युलेटर" : "Open Keypad Call"}</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Card 3: Live Queue Tracker */}
          <button
            onClick={() => setView("queue")}
            className="ks-card p-4 text-left transition-all hover:shadow-sm cursor-pointer group flex flex-col justify-between"
            style={{ background: "#ffffff", border: "1px solid var(--border)" }}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
                >
                  <ListChecks size={18} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}>
                  {lang === "hi" ? "लाइव" : "Live Tracker"}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">
                {t.myQueue}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === "hi"
                  ? "मंडी काउंटर 1 की लाइव कतार व आगे खड़े किसानों की स्थिति।"
                  : "Track current counter token, waiting farmers, and time estimates."}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: "var(--blue)" }}>
              <span>{t.viewQueue}</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Card 4: Payment & DBT Status */}
          <button
            onClick={() => setView("statusPage")}
            className="ks-card p-4 text-left transition-all hover:shadow-sm cursor-pointer group flex flex-col justify-between"
            style={{ background: "#ffffff", border: "1px solid var(--border)" }}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--cream-2)", color: "var(--charcoal)" }}
                >
                  <IndianRupee size={18} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--cream-2)", color: "var(--charcoal)" }}>
                  DBT PFMS
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">
                {t.procurementStatus}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === "hi"
                  ? "वजन पर्ची, MSP दर व बैंक खाते में DBT भुगतान का विवरण।"
                  : "View weighing slip, MSP value, and direct bank transfer record."}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: "var(--charcoal)" }}>
              <span>{t.viewStatus}</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — book slot (Smartphone Self-Service)                       */
/* ------------------------------------------------------------------ */

function BookSlot({ onConfirmed, onSwitchToIVR, lang = "en" }) {
  const [step, setStep] = useState(1);
  const [chosenCrop, setChosenCrop] = useState("Wheat");
  const [chosenCentre, setChosenCentre] = useState(1);
  const [chosenDate, setChosenDate] = useState("2026-09-12");
  const [chosenSlot, setChosenSlot] = useState(null);
  const [apiSlots, setApiSlots] = useState(null);
  const [recommendedSlot, setRecommendedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const crops = [
    { name: "Wheat", name_hi: "गेहूं", score: 1, label: "Low Risk", desc: "Dry grain · Standard load balancing" },
    { name: "Soybean", name_hi: "सोयाबीन", score: 3, label: "High Spoilage Risk", desc: "Oil oxidation · Early slots prioritized!" },
    { name: "Paddy", name_hi: "धान", score: 2, label: "Medium Risk", desc: "Moisture sensitive · Early slot preference" },
    { name: "Mustard", name_hi: "सरसों", score: 3, label: "High Spoilage Risk", desc: "Oilseed spoilage · Express priority" },
    { name: "Maize", name_hi: "मक्का", score: 2, label: "Medium Risk", desc: "Moisture sensitive · Balanced slots" },
  ];

  const centres = CENTRES;

  const loadSlotsForSelection = async () => {
    setLoadingSlots(true);
    let queryFarmer = "FR-98213";
    if (chosenCrop === "Soybean") queryFarmer = "FR-98217";
    else if (chosenCrop === "Paddy") queryFarmer = "FR-98215";

    const data = await getSlots(chosenCentre, chosenDate, null, queryFarmer);
    if (data && data.slots) {
      setApiSlots(data.slots);
      if (data.recommended) {
        setRecommendedSlot(data.recommended);
      } else {
        setRecommendedSlot(data.slots.find((s) => s.tag === "recommended") || null);
      }
    }
    setLoadingSlots(false);
  };

  useEffect(() => {
    loadSlotsForSelection();
  }, [chosenCentre, chosenCrop]);

  const slotsToShow = (apiSlots && apiSlots.length > 0) ? apiSlots : SLOTS.map((s) => ({
    ...s, slots_left: s.left, display_time: s.time,
  }));

  const steps = [
    lang === "hi" ? "फसल व केंद्र" : "Crop & Centre",
    lang === "hi" ? "स्लॉट चयन" : "Select Slot",
    lang === "hi" ? "पुष्टि" : "Confirm",
  ];

  const tagStyle = (tag) => {
    if (tag === "full") return { tone: "red", dot: "ks-dot-red", label: "Full" };
    if (tag === "limited") return { tone: "amber", dot: "ks-dot-amber", label: "Limited" };
    return { tone: "green", dot: "ks-dot-green", label: "Available" };
  };

  const selectedCropMeta = crops.find((c) => c.name === chosenCrop) || crops[0];

  const handleBooking = async () => {
    let queryFarmer = "FR-98213";
    if (chosenCrop === "Soybean") queryFarmer = "FR-98217";
    else if (chosenCrop === "Paddy") queryFarmer = "FR-98215";

    let result = null;
    if (chosenSlot) {
      result = await bookSlot(queryFarmer, chosenCentre, chosenSlot);
    }

    const centreObj = centres.find((c) => c.id === chosenCentre);
    const slotObj = slotsToShow.find((s) => s.id === chosenSlot);
    const isPerishable = chosenCrop === "Soybean" || chosenCrop === "Paddy" || (selectedCropMeta && selectedCropMeta.score >= 2);
    const isRerouted = chosenCentre === 2 && chosenCrop === "Soybean";

    onConfirmed({
      token: result?.booking?.token || (chosenCrop === "Soybean" ? "A-128" : "A-127"),
      slotTime: slotObj?.display_time || slotObj?.time || "10:30 AM – 11:30 AM",
      slotDate: chosenDate,
      centreName: centreObj ? (lang === "hi" ? centreObj.name_hi : centreObj.name) : "Sehore Procurement Centre",
      crop: lang === "hi" ? selectedCropMeta.name_hi : selectedCropMeta.name,
      cropName: chosenCrop,
      isPerishable: isPerishable,
      perishabilityScore: selectedCropMeta?.score || (chosenCrop === "Soybean" ? 3 : 1),
      isRerouted: isRerouted,
    });
  };

  return (
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      {/* Switch to IVR toggle banner */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Smartphone size={16} style={{ color: "var(--green-deep)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--green-deep)" }}>
            {lang === "hi" ? "स्मार्टफोन ऑनलाइन स्लॉट बुकिंग" : "Smartphone Self-Service Booking"}
          </span>
        </div>
        {onSwitchToIVR && (
          <button
            onClick={onSwitchToIVR}
            className="text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline"
            style={{ color: "var(--amber)" }}
          >
            <PhoneCall size={13} /> {lang === "hi" ? "बेसिक फोन? कॉल बुक करें" : "Feature phone? Try IVR"}
          </button>
        )}
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-5">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center rounded-full text-xs font-bold"
              style={{
                width: 24, height: 24,
                background: step >= i + 1 ? "var(--green-deep)" : "var(--cream-2)",
                color: step >= i + 1 ? "#fff" : "var(--charcoal-60)",
              }}
            >
              {i + 1}
            </div>
            <span className="text-xs font-medium" style={{ color: step >= i + 1 ? "var(--charcoal)" : "var(--charcoal-60)" }}>{s}</span>
            {i < steps.length - 1 && <div className="flex-1 h-px" style={{ background: "var(--border)" }} />}
          </div>
        ))}
      </div>

      {/* STEP 1: Select Crop & Centre */}
      {step === 1 && (
        <div className="ks-card p-5">
          <h3 className="font-semibold text-base mb-3">
            {lang === "hi" ? "फसल और खरीद केंद्र चुनें" : "Select Crop & Procurement Centre"}
          </h3>

          {/* Crop Selector */}
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--charcoal-60)" }}>
            {lang === "hi" ? "आप कौन सी फसल ला रहे हैं?" : "What crop are you bringing?"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {crops.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setChosenCrop(c.name)}
                className="p-2.5 rounded-xl border text-left transition-all cursor-pointer"
                style={{
                  background: chosenCrop === c.name ? "var(--green-bg)" : "#fff",
                  borderColor: chosenCrop === c.name ? "var(--green-deep)" : "var(--border)",
                  borderWidth: chosenCrop === c.name ? 1.5 : 1,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{lang === "hi" ? c.name_hi : c.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: c.score === 3 ? "var(--red-bg)" : c.score === 2 ? "var(--amber-bg)" : "var(--green-bg)",
                      color: c.score === 3 ? "var(--red)" : c.score === 2 ? "var(--amber)" : "var(--green-deep)",
                    }}
                  >
                    {c.label}
                  </span>
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--charcoal-60)" }}>{c.desc}</div>
              </button>
            ))}
          </div>

          {/* Perishability Priority Badge Notice */}
          {selectedCropMeta.score === 3 && (
            <div className="p-3 rounded-xl mb-3 flex items-start gap-2" style={{ background: "var(--red-bg)", border: "1px solid #F5C6CB" }}>
              <AlertTriangle size={16} style={{ color: "var(--red)", marginTop: 2, flexShrink: 0 }} />
              <div className="text-xs" style={{ color: "#7A1C24" }}>
                <strong>{lang === "hi" ? "उच्च फसल नुकसान जोखिम:" : "High Perishability Priority Active:"}</strong>{" "}
                {lang === "hi"
                  ? `${selectedCropMeta.name_hi} के लिए इंजन सबसे सुबह का स्लॉट प्राथमिकता पर आवंटित करेगा ताकि उपज खराब न हो।`
                  : `${selectedCropMeta.name} is prioritized for earliest morning slots to minimize post-harvest loss.`}
              </div>
            </div>
          )}

          {/* 10-km Hyper-Local Cluster Auto-Reroute Banner when Sehore Soybean is Full */}
          {chosenCrop === "Soybean" && chosenCentre === 1 && (
            <div className="p-3.5 rounded-xl mb-4 border border-amber-300 bg-amber-50 animate-fade-in shadow-xs">
              <div className="flex items-start gap-2.5">
                <Compass className="text-amber-700 shrink-0 mt-0.5" size={18} />
                <div className="text-xs flex-1">
                  <div className="font-bold text-amber-950 flex items-center justify-between">
                    <span>{lang === "hi" ? "सीहोर मुख्य मंडी सोयाबीन कोटा पूर्ण (100%)" : "Sehore Main Mandi Soybean Quota Full (100%)"}</span>
                    <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold">10-km Mesh Active</span>
                  </div>
                  <p className="text-amber-850 mt-1 leading-relaxed" style={{ color: "#78350f" }}>
                    {lang === "hi"
                      ? "सीहोर में बफर क्षमता समाप्त। 10-किमी क्लस्टर के तहत इछावर उप-मंडी (7.2 किमी दूर · 22 मिनट) में 420 MT कोटा और 0-वेट स्केल उपलब्ध है।"
                      : "Sehore yard at 98% capacity. Nearest 10-km satellite: Ichhawar Sub-Mandi (7.2 km away · 22 min drive) has 420 MT open quota & zero-wait scale."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => setChosenCentre(2)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Zap size={13} /> {lang === "hi" ? "इछावर उप-मंडी (7.2 किमी) में 1-टैप रीरूट लें" : "Accept 1-Tap Reroute to Ichhawar (7.2 km)"}
                    </button>
                    <span className="text-[11px] font-medium text-emerald-800">
                      ✓ {lang === "hi" ? "सरकारी MSP ₹4,892 सुरक्षित" : "Full MSP ₹4,892 Guaranteed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Banner showing active 10-km reroute pass when Ichhawar is selected */}
          {chosenCrop === "Soybean" && chosenCentre === 2 && (
            <div className="p-3.5 rounded-xl mb-4 border border-emerald-300 bg-emerald-50 animate-fade-in shadow-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-emerald-700 shrink-0 mt-0.5" size={18} />
                <div className="text-xs flex-1">
                  <div className="font-bold text-emerald-950 flex items-center justify-between">
                    <span>{lang === "hi" ? "✓ 10-किमी रीरूट पास लागू: इछावर उप-मंडी (7.2 किमी)" : "✓ 10-km Reroute Pass Applied: Ichhawar Sub-Mandi (7.2 km)"}</span>
                    <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-bold">Relief Yard</span>
                  </div>
                  <p className="text-emerald-900 mt-1 leading-relaxed">
                    {lang === "hi"
                      ? "इछावर उप-मंडी में 420 MT खुला सरकारी कोटा उपलब्ध है। शून्य प्रतीक्षा समय + J-फॉर्म पर ₹3.50/किमी-क्विंटल ईंधन परिवहन भत्ता क्रेडिट शामिल है।"
                      : "420 MT open government MSP quota at Ichhawar. Guaranteed zero yard waiting time + ₹3.50/km-quintal transit fuel subsidy added to your e-J-Form."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Centre Selector */}
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--charcoal-60)" }}>
            {lang === "hi" ? "खरीद केंद्र चुनें (10-किमी क्लस्टर नेटवर्क):" : "Choose Procurement Centre (10-km Cluster Network):"}
          </label>
          <select
            value={chosenCentre}
            onChange={(e) => setChosenCentre(Number(e.target.value))}
            className="w-full p-2.5 rounded-xl text-sm mb-4 border"
            style={{ borderColor: "var(--border)", background: "#fff" }}
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === "hi" ? c.name_hi : c.name} {c.distanceKm > 0 ? `(${c.distanceKm} km · ${c.type})` : `(${c.type})`}
              </option>
            ))}
          </select>

          {/* Date Selector */}
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--charcoal-60)" }}>
            {lang === "hi" ? "तारीख:" : "Procurement Date:"}
          </label>
          <input
            type="date"
            value={chosenDate}
            onChange={(e) => setChosenDate(e.target.value)}
            className="w-full p-2.5 rounded-xl text-sm mb-5 border"
            style={{ borderColor: "var(--border)", background: "#fff" }}
          />

          <button
            onClick={() => {
              loadSlotsForSelection();
              setStep(2);
            }}
            className="ks-btn ks-btn-primary w-full py-3 text-sm font-semibold"
          >
            {lang === "hi" ? "उपलब्ध स्लॉट देखें →" : "Find Available Slots →"}
          </button>
        </div>
      )}

      {/* STEP 2: Slot Selection */}
      {step === 2 && (
        <div>
          {loadingSlots ? (
            <div className="ks-card p-6 text-center text-sm" style={{ color: "var(--charcoal-60)" }}>
              Loading smart slot allocations...
            </div>
          ) : (
            <>
              {/* Dynamic Recommended Slot Card */}
              {recommendedSlot && (
                <div className="ks-card p-4 mb-3" style={{ borderColor: "var(--green-deep)", borderWidth: 1.5 }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} style={{ color: "var(--green-deep)" }} />
                      <span className="text-xs font-bold uppercase" style={{ color: "var(--green-deep)", letterSpacing: 0.3 }}>
                        {lang === "hi" ? "AI अनुशंसित स्लॉट" : "AI Recommended For You"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                      {recommendedSlot.priority_reason || "Best Availability"}
                    </span>
                  </div>
                  <div className="font-semibold text-lg mb-1">{recommendedSlot.display_time || recommendedSlot.time}</div>
                  <p className="text-xs mb-3" style={{ color: "var(--charcoal-60)" }}>
                    {selectedCropMeta.score === 3
                      ? "Earliest available window allocated to prevent moisture & quality degradation."
                      : "Expected waiting time ~15 minutes. Based on queue flow and centre throughput."}
                  </p>
                  <button
                    onClick={() => { setChosenSlot(recommendedSlot.id); setStep(3); }}
                    className="ks-btn ks-btn-primary w-full py-2.5 text-sm"
                  >
                    {lang === "hi" ? "यह स्लॉट चुनें" : "Select Recommended Slot"}
                  </button>
                </div>
              )}

              <p className="text-xs font-semibold mb-2" style={{ color: "var(--charcoal-60)" }}>
                {lang === "hi" ? "अन्य उपलब्ध समय स्लॉट:" : "Other Available Slots:"}
              </p>
              <div className="space-y-2 mb-4">
                {slotsToShow
                  .filter((s) => !recommendedSlot || s.id !== recommendedSlot.id)
                  .map((s) => {
                    const st = tagStyle(s.tag);
                    return (
                      <button
                        key={s.id}
                        disabled={s.tag === "full"}
                        onClick={() => { setChosenSlot(s.id); setStep(3); }}
                        className="ks-card w-full p-3.5 flex items-center justify-between text-left cursor-pointer transition-all"
                        style={s.tag === "full" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                      >
                        <div>
                          <div className="font-medium text-sm">{s.display_time || s.time}</div>
                          <div className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                            {s.tag === "full" ? "Full" : `${s.slots_left ?? s.left} slots available`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold" style={{ color: st.tone === "red" ? "var(--red)" : st.tone === "amber" ? "var(--amber)" : "var(--green-deep)" }}>
                            {st.label}
                          </span>
                          <span className={`inline-block rounded-full ${st.dot}`} style={{ width: 10, height: 10 }} />
                        </div>
                      </button>
                    );
                  })}
              </div>

              <button onClick={() => setStep(1)} className="ks-btn ks-btn-outline w-full py-2.5 text-xs">
                &larr; {lang === "hi" ? "पीछे जाएं (फसल/केंद्र बदलें)" : "Back (Change Crop/Centre)"}
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 3: Confirmation */}
      {step === 3 && (
        <div className="ks-card p-5 text-center">
          <div className="flex items-center justify-center rounded-full mx-auto mb-4" style={{ width: 52, height: 52, background: "var(--green-bg)" }}>
            <CheckCircle2 size={26} style={{ color: "var(--green-deep)" }} />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {lang === "hi" ? "स्लॉट की पुष्टि करें" : "Confirm Your Slot"}
          </h3>
          <div className="p-3.5 rounded-xl my-4 text-left space-y-2 text-sm" style={{ background: "var(--cream-2)" }}>
            <div className="flex justify-between">
              <span style={{ color: "var(--charcoal-60)" }}>Crop:</span>
              <span className="font-semibold">{chosenCrop}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--charcoal-60)" }}>Centre:</span>
              <span className="font-semibold">{centres.find((c) => c.id === chosenCentre)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--charcoal-60)" }}>Date:</span>
              <span className="font-semibold">{chosenDate}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--charcoal-60)" }}>Slot Time:</span>
              <span className="font-semibold text-green-700">
                {(() => {
                  const s = slotsToShow.find((x) => x.id === chosenSlot);
                  return s ? (s.display_time || s.time) : "";
                })()}
              </span>
            </div>
          </div>

          <button onClick={handleBooking} className="ks-btn ks-btn-primary w-full py-3.5 font-semibold text-sm">
            {lang === "hi" ? "स्लॉट पक्का करें & टोकन पाएं" : "Confirm Booking & Generate Token"}
          </button>
          <button onClick={() => setStep(2)} className="ks-btn ks-btn-outline w-full py-2.5 text-xs mt-2">
            &larr; {lang === "hi" ? "स्लॉट बदलें" : "Change Slot"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — confirmation ticket                                         */
/* ------------------------------------------------------------------ */

function Confirmation({ booking, setView, lang = "en" }) {
  const token = booking?.token || FARMER.token;
  const slotDate = booking?.slotDate || FARMER.slotDate;
  const slotTime = booking?.slotTime || FARMER.slotTime;
  const centreName = booking?.centreName || FARMER.centre[lang];
  const crop = booking?.crop || (lang === "hi" ? FARMER.crop.hi : FARMER.crop.en);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center rounded-full mx-auto mb-4" style={{ width: 60, height: 60, background: "var(--green-bg)" }}>
        <CheckCircle2 size={30} style={{ color: "var(--green-deep)" }} />
      </div>
      <h2 className="ks-display text-xl font-bold mb-1">
        {lang === "hi" ? "स्लॉट पक्का हुआ!" : "Slot Confirmed!"}
      </h2>
      <p className="text-sm mb-5" style={{ color: "var(--charcoal-60)" }}>{centreName} &middot; {crop}</p>

      <div className="ks-card p-5 mb-4">
        {booking?.isPerishable && (
          <div className="p-3 mb-3 rounded-xl flex items-center gap-2 text-left" style={{ background: "var(--amber-bg)", border: "1px solid #fcd34d" }}>
            <Sparkles size={16} style={{ color: "var(--amber)", flexShrink: 0 }} />
            <div className="text-xs" style={{ color: "#78350f" }}>
              <strong>{lang === "hi" ? "फसल प्राथमिकता लागू!" : "Perishability Priority Applied!"}</strong>{" "}
              {lang === "hi"
                ? `आपकी ${crop} फसल जल्दी खराब होने वाली श्रेणी में है। इसे मंडी कतार में आगे प्राथमिकता मिली है (अन्य किसान कतार में प्रतीक्षा कर रहे हैं)।`
                : `Your ${crop} lot is high-perishability and has been prioritized ahead in the queue. Other farmers are waiting.`}
            </div>
          </div>
        )}

        {booking?.isRerouted && (
          <div className="p-3 mb-3 rounded-xl flex items-center gap-2 text-left" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981" }}>
            <Compass size={18} style={{ color: "var(--green-deep)", flexShrink: 0 }} />
            <div className="text-xs" style={{ color: "var(--green-deep)" }}>
              <strong>{lang === "hi" ? "10-किमी क्लस्टर रीरूट पास सक्रिय:" : "10-km Cluster Reroute Pass Active:"}</strong>{" "}
              {lang === "hi"
                ? "सीहोर कोटा पूर्ण होने के कारण इछावर उप-मंडी (7.2 किमी) में स्लॉट आवंटित। ₹3.50/किमी-क्विंटल ईंधन परिवहन भत्ता e-J-फॉर्म पर स्वतः जोड़ा गया।"
                : "Rerouted to Ichhawar Sub-Mandi (7.2 km) due to hub saturation. ₹3.50/km-quintal transit fuel subsidy automatically credited to your e-J-Form."}
            </div>
          </div>
        )}
        <div className="text-sm mb-3" style={{ color: "var(--charcoal-60)" }}>
          {slotDate} &middot; {slotTime}
        </div>
        <div className="text-xs uppercase font-bold" style={{ color: "var(--green-deep)", letterSpacing: "1px" }}>Digital Token Pass</div>
        <div className="flex justify-center my-3">
          <TokenQRCode token={token} size={145} />
        </div>

        <button
          onClick={() => {
            playChime();
            const speech = lang === "hi"
              ? `बधाई हो! आपका टोकन नंबर ${token} पक्का हो गया है। केंद्र ${centreName}। समय ${slotTime}। मंडी गेट पर यह क्यू आर पास दिखाएं।`
              : `Congratulations! Your token ${token} is confirmed at ${centreName}. Time slot: ${slotTime}. Show this QR pass at the Mandi entry gate.`;
            speakVernacular(speech, lang);
          }}
          className="ks-btn flex items-center justify-center gap-1.5 w-full py-2.5 mb-3 text-xs font-bold rounded-xl border border-emerald-300 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-all"
        >
          <Volume2 size={16} className="text-emerald-700" />
          <span>{lang === "hi" ? "🔊 बोलकर सुनें (Voice Audio)" : "🔊 Listen Ticket Audio"}</span>
        </button>

        <div className="text-xs mb-2" style={{ color: "var(--charcoal-60)" }}>
          {lang === "hi" ? "मंडी गेट पर यह QR कोड दिखाएं" : "Show this QR pass at the Mandi entry gate"}
        </div>
        <Badge tone="green" icon={Clock}>
          {lang === "hi" ? "अनुमानित प्रतीक्षा: 15-20 मिनट" : "Expected wait: 15–20 min"}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={() => setView("queue")} className="ks-btn ks-btn-primary py-3">
          {lang === "hi" ? "लाइव कतार देखें" : "View Live Queue"}
        </button>
        <div className="flex gap-2">
          <button onClick={() => setView("book")} className="ks-btn ks-btn-outline flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
            <CalendarPlus size={14} /> {lang === "hi" ? "नया स्लॉट" : "Book Another"}
          </button>
          <button onClick={() => setView("dashboard")} className="ks-btn ks-btn-outline flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
            <HomeIcon size={14} /> {lang === "hi" ? "होम" : "Home"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — live queue                                                  */
/* ------------------------------------------------------------------ */

function LiveQueue({ ahead, setAhead, current, setCurrent, activeBooking }) {
  const myToken = activeBooking?.token || FARMER.token;
  const [queueData, setQueueData] = useState(null);
  const [priorityNotice, setPriorityNotice] = useState(null);

  const fetchQueue = () => {
    getQueue(1, null).then((data) => {
      if (data && data.entries) {
        setQueueData(data);
        if (data.current_token) setCurrent(data.current_token);
        // Find how many waiting farmers are ahead of myToken
        const myEntry = data.entries.find((e) => e.token === myToken);
        if (myEntry) {
          const aheadList = data.entries
            .filter((e) => e.status === "waiting" && e.position < myEntry.position)
            .map((e) => e.token);
          setAhead(aheadList);
        } else {
          setAhead([]);
        }
      }
    });
  };

  // Real-time background sync every 2 seconds
  useEffect(() => {
    fetchQueue();
    const timer = setInterval(fetchQueue, 2000);
    return () => clearInterval(timer);
  }, [myToken]);

  const list = queueData && queueData.entries && queueData.entries.length > 0
    ? queueData.entries
        .filter((e) => e.status !== "done")
        .map((e) => ({
          tok: e.token,
          you: e.token === myToken,
          crop: e.crop,
          farmer_name: e.farmer_name,
          score: e.perishability_score || (e.crop === "Soybean" ? 3 : e.crop === "Paddy" ? 2 : 1),
          status: e.status,
          position: e.position,
        }))
    : [
        { tok: "A-128", you: myToken === "A-128", crop: "Soybean", farmer_name: "Dinesh Yadav", score: 3, status: "waiting", position: 2 },
        { tok: "A-125", you: myToken === "A-125", crop: "Paddy", farmer_name: "Mohan Singh", score: 2, status: "waiting", position: 3 },
        { tok: "A-124", you: myToken === "A-124", crop: "Wheat", farmer_name: "Suresh Kumar", score: 1, status: "waiting", position: 4 },
        { tok: "A-126", you: myToken === "A-126", crop: "Wheat", farmer_name: "Ravi Patel", score: 1, status: "waiting", position: 5 },
        { tok: "A-127", you: myToken === "A-127", crop: "Wheat", farmer_name: "Ram Lal", score: 1, status: "waiting", position: 6 },
      ];

  const advance = async () => {
    try {
      const result = await advanceQueue(1);
      if (result && result.success && result.current_token) {
        setCurrent(result.current_token);
        playChime();
        speakVernacular(`टोकन नंबर ${result.current_token}, कृपया काउंटर नंबर 1 पर आएं।`, "hi");
        fetchQueue();
      } else {
        // Fallback: local simulation
        const nextTok = `A-${parseInt((current || "A-123").split("-")[1] || "123", 10) + 1}`;
        setCurrent(nextTok);
        playChime();
        speakVernacular(`टोकन नंबर ${nextTok}, कृपया काउंटर नंबर 1 पर आएं।`, "hi");
        setAhead((a) => a.slice(1));
      }
    } catch (e) {
      console.error("Advance error:", e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="ks-display text-xl font-bold">Live Queue</h2>
        <span className="ks-badge ks-badge-green text-xs" style={{ fontSize: "10px" }}>
          ⚡ Perishability Priority Active
        </span>
      </div>
      <p className="text-sm mb-3" style={{ color: "var(--charcoal-60)" }}>{FARMER.centre.en} &middot; Counter 1</p>

      {/* Visual Priority Triage Demonstrator */}
      <div className="ks-card p-4 mb-4" style={{ background: "#ffffff", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}
            >
              <Zap size={14} />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800">
                AI Crop Perishability Prioritization
              </span>
              <span className="text-[10px] ml-2 font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                Active
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">FIFO Safe</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Perishable produce (Soybean, Mustard · 5-day shelf life) is automatically prioritized to the front of the waiting queue. Standard grains (Wheat · 90-day shelf life) wait their turn safely in line without leaving the queue.
        </p>

        {/* Demo Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              playChime();
              setPriorityNotice("⚡ Priority Jump in Action: Dinesh Yadav (Soybean, 5-day shelf life) prioritized to Pos #2! 4 Wheat farmers shifted to wait safely behind without leaving the queue.");
              try {
                await fetch("/api/slots/book", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ farmer_id: "FR-98217", centre_id: 1, slot_id: 1 }),
                });
              } catch (e) {}
              fetchQueue();
            }}
            className="ks-btn ks-btn-primary flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap size={13} />
            <span>Simulate Soybean Priority Jump</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              await resetQueue(1);
              setPriorityNotice("Queue restored to standard baseline.");
              fetchQueue();
            }}
            className="ks-btn ks-btn-outline py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            title="Reset queue"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>

        {priorityNotice && (
          <div className="mt-3 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2 animate-fade-in">
            <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>{priorityNotice}</span>
          </div>
        )}
      </div>

      <div className="ks-card p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs" style={{ color: "var(--charcoal-60)" }}>Currently Calling</div>
          <div className="ks-display text-2xl font-bold" style={{ color: "var(--green-deep)" }}>{current}</div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: "var(--charcoal-60)" }}>Your Token</div>
          <div className="ks-display text-2xl font-bold" style={{ color: "var(--green-deep)" }}>{myToken}</div>
        </div>
      </div>

      <div className="ks-card p-4 mb-4 text-center">
        <div className="ks-display text-3xl font-bold mb-1">{ahead.length}</div>
        <div className="text-sm mb-3" style={{ color: "var(--charcoal-60)" }}>
          {ahead.length === 0 ? "You are next in line (Highest Priority)!" : `farmer${ahead.length === 1 ? "" : "s"} ahead of you`}
        </div>
        <div className="ks-progress-track mb-3" style={{ height: 8 }}>
          <div className="ks-progress-fill h-full" style={{ width: `${Math.max(15, 100 - ahead.length * 18)}%` }} />
        </div>
        <Badge tone="green" icon={TrendingUp}>
          {ahead.length === 0 ? "Priority fast-track active \u00b7 Proceed to Gate" : `Est. wait: ${ahead.length * 4} min \u00b7 Queue moving normally`}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        {list.map((r, idx) => {
          const isHigh = r.score >= 3;
          const isMed = r.score === 2;
          return (
            <div
              key={r.tok}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-all"
              style={
                r.you
                  ? { background: "var(--green-deep)", color: "#fff", boxShadow: "0 2px 8px rgba(31,77,54,0.25)" }
                  : isHigh
                  ? { background: "#fffdf5", border: "2px solid #f59e0b", boxShadow: "0 1px 4px rgba(245,158,11,0.15)" }
                  : { background: "#fff", border: "1px solid var(--border)" }
              }
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: r.you ? "rgba(255,255,255,0.25)" : isHigh ? "#fef3c7" : "var(--cream-2)",
                    color: r.you ? "#fff" : isHigh ? "#92400e" : "var(--charcoal)",
                  }}
                >
                  #{idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{r.tok}</span>
                    {r.farmer_name && (
                      <span className="text-xs" style={{ opacity: r.you ? 0.9 : 0.7 }}>({r.farmer_name})</span>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ opacity: r.you ? 0.85 : 0.65 }}>
                    <Wheat size={11} />
                    <span>{r.crop}</span>
                    <span>&bull;</span>
                    <span>{isHigh ? "5-Day Shelf Life" : isMed ? "7-Day Shelf Life" : "90-Day Stable"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {isHigh && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#fef3c7", color: "#92400e" }}>
                    <Zap size={10} /> Jumped Ahead
                  </span>
                )}
                {isMed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1e40af" }}>
                    Medium Risk
                  </span>
                )}
                <span
                  className={r.you ? "font-bold text-xs bg-white text-emerald-900 px-2 py-0.5 rounded" : "text-xs font-medium"}
                  style={!r.you ? { color: isHigh ? "#92400e" : "var(--charcoal-60)" } : {}}
                >
                  {r.you ? "YOU" : r.status === "processing" ? "Serving at Counter 1" : "Waiting in Line"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={advance} className="ks-btn ks-btn-primary w-full py-3 flex items-center justify-center gap-2 cursor-pointer">
        <RotateCcw size={15} /> Advance Next Farmer (Weighbridge)
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — procurement status timeline                                 */
/* ------------------------------------------------------------------ */

function ProcurementStatusPage({ done }) {
  const items = [
    { label: "Slot Booked", sub: "10 Sep, 06:30 PM", state: "done" },
    { label: "Arrived at Centre", sub: "12 Sep, 10:14 AM", state: "done" },
    { label: "Token Called", sub: "12 Sep, 10:38 AM", state: "done" },
    { label: "Procurement", sub: done ? "Completed" : "In Progress", state: done ? "done" : "current" },
    { label: "Payment Processing", sub: done ? "In progress" : "Pending", state: done ? "current" : "pending" },
    { label: "Payment Completed", sub: "", state: "pending" },
  ];

  return (
    <div>
      <h2 className="ks-display text-xl font-bold mb-4">Procurement Status</h2>

      <div className="ks-card p-5 mb-5">
        {items.map((it, i) => (
          <div key={it.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              {it.state === "done" ? (
                <CheckCircle2 size={18} style={{ color: "var(--green-deep)" }} />
              ) : it.state === "current" ? (
                <div className="rounded-full" style={{ width: 12, height: 12, background: "var(--amber)", marginTop: 3 }} />
              ) : (
                <Circle size={18} style={{ color: "var(--border)" }} />
              )}
              {i < items.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--border)", minHeight: 22 }} />}
            </div>
            <div className="pb-4">
              <div className="text-sm font-semibold" style={{ color: it.state === "pending" ? "var(--charcoal-60)" : "var(--charcoal)" }}>{it.label}</div>
              {it.sub && <div className="text-xs mt-0.5" style={{ color: "var(--charcoal-60)" }}>{it.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="ks-card p-5">
        <h3 className="font-semibold text-sm mb-3">Procurement details</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between"><span style={{ color: "var(--charcoal-60)" }}>Crop</span><span className="font-medium">{FARMER.crop.en}</span></div>
          <div className="flex justify-between"><span style={{ color: "var(--charcoal-60)" }}>Quantity</span><span className="font-medium">{FARMER.quantity}</span></div>
          <div className="flex justify-between"><span style={{ color: "var(--charcoal-60)" }}>Estimated Value</span><span className="font-medium">{FARMER.value}</span></div>
          <div className="flex justify-between items-center">
            <span style={{ color: "var(--charcoal-60)" }}>Status</span>
            <Badge tone={done ? "green" : "amber"}>{done ? "Completed" : "Processing"}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MANDI STAFF                                                          */
/* ------------------------------------------------------------------ */

function MandiDashboard({ onOpenFarmer, completed, currentToken, onTokenChange }) {
  const [mandiData, setMandiData] = useState(null);
  const [upcomingData, setUpcomingData] = useState(null);
  const [calling, setCalling] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [mandiNotice, setMandiNotice] = useState(null);

  const fetchMandi = () => {
    getMandiDashboard(1, null).then((data) => {
      if (data) {
        setMandiData(data);
        if (data.current_token && onTokenChange) {
          onTokenChange(data.current_token);
        }
      }
    });
    getMandiUpcoming(1, null).then((data) => {
      if (data && data.upcoming) setUpcomingData(data.upcoming);
    });
  };

  // Real-time background sync every 2 seconds
  useEffect(() => {
    fetchMandi();
    const timer = setInterval(fetchMandi, 2000);
    return () => clearInterval(timer);
  }, []);

  const upcoming = upcomingData && upcomingData.length > 0
    ? upcomingData.map((u) => ({
        token: u.tok || u.token,
        time: u.time,
        crop: u.crop,
        farmer_name: u.farmer_name,
        booking_id: u.booking_id,
        perishability_score: u.perishability_score || (u.crop === "Soybean" ? 3 : u.crop === "Paddy" ? 2 : 1),
        priority_label: u.priority_label,
        position: u.position,
      }))
    : [
        { token: "A-128", time: "08:00 AM", crop: "Soybean", farmer_name: "Dinesh Yadav", booking_id: 5, perishability_score: 3, position: 2 },
        { token: "A-125", time: "09:00 AM", crop: "Paddy", farmer_name: "Mohan Singh", booking_id: 2, perishability_score: 2, position: 3 },
        { token: "A-124", time: "09:00 AM", crop: "Wheat", farmer_name: "Suresh Kumar", booking_id: 1, perishability_score: 1, position: 4 },
        { token: "A-126", time: "10:00 AM", crop: "Wheat", farmer_name: "Ravi Patel", booking_id: 3, perishability_score: 1, position: 5 },
        { token: "A-127", time: "10:30 AM", crop: "Wheat", farmer_name: "Ram Lal", booking_id: 4, perishability_score: 1, position: 6 },
      ];

  const stats = mandiData || { total_farmers: 6, waiting: upcoming.length, processing: 1, completed: completed, current_token: currentToken };
  const displayToken = mandiData?.current_token || currentToken;

  const handleCallNext = async () => {
    setCalling(true);
    try {
      // 1. Identify the next waiting token to promote
      const nextCandidate = upcoming.find((u) => u.token !== displayToken)?.token;
      let nextSeqToken = "A-124";
      if (displayToken && displayToken.includes("-")) {
        const n = parseInt(displayToken.split("-")[1], 10);
        if (!isNaN(n)) nextSeqToken = `A-${n + 1}`;
      }
      const chosenToken = nextCandidate || nextSeqToken;

      // 2. Immediate optimistic update (0ms lag for zero-delay UX)
      if (chosenToken) {
        setMandiData((prev) => ({
          ...(prev || stats),
          current_token: chosenToken,
          waiting: Math.max(0, (prev?.waiting ?? upcoming.length) - 1),
          processing: 1,
          completed: (prev?.completed ?? completed) + 1,
        }));
        setUpcomingData((prev) => {
          if (!prev) return [];
          return prev.filter((u) => (u.tok || u.token) !== chosenToken);
        });
        if (onTokenChange) onTokenChange(chosenToken);
        playChime();
        speakVernacular(`टोकन नंबर ${chosenToken}, कृपया काउंटर नंबर 1 पर आएं।`, "hi");
      }

      // 3. Backend advance
      const res = await advanceQueue(1);
      if (res && res.current_token && res.current_token !== chosenToken) {
        setMandiData((prev) => ({
          ...prev,
          current_token: res.current_token,
          waiting: res.waiting_count,
          completed: res.completed_count,
        }));
        if (onTokenChange) onTokenChange(res.current_token);
      }
      fetchMandi();
    } catch (e) {
      console.error("Failed to advance queue:", e);
    }
    setCalling(false);
  };

  return (
    <div className="ks-root min-h-screen flex">
      <aside className="hidden md:flex flex-col w-60 shrink-0 px-4 py-6" style={{ background: "var(--green-deep)" }}>
        <div className="flex items-center gap-2 px-2 mb-8">
          <Wheat size={18} color="#fff" />
          <span className="ks-display font-bold text-white">KisanSetu</span>
        </div>
        <div className="ks-sidebar-link active"><LayoutGrid size={17} /> Queue Desk</div>
        <div className="ks-sidebar-link cursor-pointer" onClick={() => setShowScanner(true)}><ScanLine size={17} /> Scan QR</div>
        <div className="ks-sidebar-link cursor-pointer" onClick={() => setShowReports(true)}><FileSpreadsheet size={17} /> Daily Register</div>
        <div className="ks-sidebar-link"><Search size={17} /> Search Farmer</div>
        <div className="ks-sidebar-link"><Settings size={17} /> Settings</div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="ks-display text-2xl font-bold">Sehore Procurement Centre</h2>
            <p className="text-sm" style={{ color: "var(--charcoal-60)" }}>Mandi staff console &middot; Real-time FIFO Queue</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReports(true)}
              className="ks-btn flex items-center gap-1.5 text-xs px-3.5 py-2 font-bold cursor-pointer rounded-xl transition-all hover:shadow-xs"
              style={{ background: "var(--green-bg)", color: "var(--green-deep)", border: "1px solid #CFE3D5" }}
            >
              <FileSpreadsheet size={15} />
              <span>Daily Register & DBT (.CSV)</span>
            </button>
            <Badge tone="blue" icon={PhoneCall}>SMS / IVR Alert Active</Badge>
          </div>
        </div>

        {/* Perishability Priority Console Bar */}
        <div className="ks-card p-4 mb-5 flex flex-wrap items-center justify-between gap-3" style={{ background: "#ffffff", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}
            >
              <Zap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800">
                  Crop Perishability Priority Triage
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                  Active Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Scale Protection: Counter 1 weighbridge is locked. Perishable lots (Soybean) automatically jump ahead in the waiting queue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                playChime();
                setMandiNotice("⚡ Priority Jump Triggered: Dinesh Yadav (Soybean, 5-day shelf life) promoted to Position 2 ahead of Wheat! Standard grains wait safely behind.");
                try {
                  await fetch("/api/slots/book", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ farmer_id: "FR-98217", centre_id: 1, slot_id: 1 }),
                  });
                } catch (e) {}
                fetchMandi();
              }}
              className="ks-btn ks-btn-primary text-xs font-semibold px-3 py-2 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap size={13} />
              <span>Simulate Priority Jump</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setCalling(true);
                try {
                  await resetQueue(1);
                  if (onTokenChange) onTokenChange("A-123");
                  setMandiData({
                    centre: { id: 1, name: "Sehore Procurement Centre", name_hi: "सीहोर खरीद केंद्र", status: "Normal" },
                    total_farmers: 6,
                    waiting: 5,
                    processing: 1,
                    completed: 0,
                    current_token: "A-123",
                  });
                  setUpcomingData([
                    { token: "A-128", time: "08:00 AM", crop: "Soybean", farmer_name: "Dinesh Yadav", booking_id: 5, perishability_score: 3, position: 2 },
                    { token: "A-125", time: "09:00 AM", crop: "Paddy", farmer_name: "Mohan Singh", booking_id: 2, perishability_score: 2, position: 3 },
                    { token: "A-124", time: "09:00 AM", crop: "Wheat", farmer_name: "Suresh Kumar", booking_id: 1, perishability_score: 1, position: 4 },
                    { token: "A-126", time: "10:00 AM", crop: "Wheat", farmer_name: "Ravi Patel", booking_id: 3, perishability_score: 1, position: 5 },
                    { token: "A-127", time: "10:30 AM", crop: "Wheat", farmer_name: "Ram Lal", booking_id: 4, perishability_score: 1, position: 6 },
                  ]);
                  setMandiNotice("Queue reset to clean demo baseline (Pos 1: Wheat processing, Pos 2: Soybean, Pos 3: Paddy, Pos 4-6: Wheat).");
                  setTimeout(fetchMandi, 300);
                } catch (err) {
                  console.error("Reset error:", err);
                }
                setCalling(false);
              }}
              className="ks-btn ks-btn-outline text-xs font-semibold px-3 py-2 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {mandiNotice && (
          <div className="mb-4 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2 animate-fade-in">
            <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>{mandiNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatTile label="Total Farmers" value={String(stats.total_farmers)} icon={Users} />
          <StatTile label="Waiting in Line" value={String(stats.waiting)} icon={Clock} />
          <StatTile label="Processing Desk" value={String(stats.processing)} icon={ScanLine} />
          <StatTile label="Completed" value={String(stats.completed)} icon={CheckCircle2} />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="ks-card p-6 md:col-span-1 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--charcoal-60)" }}>Currently Serving</div>
            <div className="ks-display font-bold mb-4" style={{ fontSize: "44px", color: "var(--green-deep)" }}>{displayToken}</div>
            <button
              onClick={handleCallNext}
              disabled={calling}
              className="ks-btn ks-btn-primary w-full py-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-md font-semibold text-sm"
            >
              <PhoneCall size={16} />
              {calling ? "Calling next..." : "Call Next Farmer"}
            </button>
            <p className="text-[11px] mt-2.5 text-charcoal-60" style={{ color: "var(--charcoal-60)" }}>
              Marks current as done, promotes next waiting, plays chime & sends SMS.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setShowScanner(true)}
                className="ks-btn ks-btn-outline text-xs py-2 flex items-center justify-center gap-1 cursor-pointer hover:bg-emerald-50"
              >
                <ScanLine size={13} /> Scan QR
              </button>
              <button
                onClick={() => setShowReports(true)}
                className="ks-btn ks-btn-outline text-xs py-2 flex items-center justify-center gap-1 cursor-pointer hover:bg-emerald-50"
              >
                <FileSpreadsheet size={13} /> Reports
              </button>
              <button className="ks-btn ks-btn-outline text-xs py-2">Manual Entry</button>
              <button className="ks-btn ks-btn-outline text-xs py-2" style={{ borderColor: "var(--red)", color: "var(--red)" }}>Mark No Show</button>
            </div>
          </div>

          <div className="ks-card p-5 md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Upcoming Queue Line</h3>
                <span className="ks-badge ks-badge-green text-xs" style={{ fontSize: "10px" }}>
                  Priority Ordering Active
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    await resetQueue(1);
                    fetchMandi();
                  }}
                  className="text-xs flex items-center gap-1 font-semibold cursor-pointer hover:underline"
                  style={{ color: "var(--green-deep)", background: "none", border: "none" }}
                  title="Reset demo queue"
                >
                  <RotateCcw size={12} /> Reset Queue
                </button>
                <span className="text-xs text-charcoal-60" style={{ color: "var(--charcoal-60)" }}>
                  {upcoming.length} waiting
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {upcoming.length === 0 ? (
                <div className="p-6 text-center text-sm text-charcoal-60" style={{ color: "var(--charcoal-60)" }}>
                  No more farmers waiting in queue.
                </div>
              ) : (
                upcoming.map((u, idx) => {
                  const isHigh = u.perishability_score >= 3;
                  const isMed = u.perishability_score === 2;
                  return (
                    <button
                      key={u.token}
                      onClick={() => onOpenFarmer(u)}
                      className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-all hover:shadow-sm cursor-pointer border text-left"
                      style={{
                        background: isHigh ? "#fffdf5" : "var(--cream)",
                        borderColor: isHigh ? "#f59e0b" : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: isHigh ? "#fef3c7" : "var(--cream-2)",
                            color: isHigh ? "#92400e" : "var(--charcoal)",
                          }}
                        >
                          #{u.position || idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{u.token}</span>
                            {u.farmer_name && (
                              <span className="text-xs font-medium" style={{ color: "var(--charcoal)" }}>
                                {u.farmer_name}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-charcoal-60 mt-0.5 flex items-center gap-1.5" style={{ color: "var(--charcoal-60)" }}>
                            <Wheat size={12} />
                            <span>{u.crop}</span>
                            <span>&bull;</span>
                            <span>{isHigh ? "5-Day Shelf Life" : isMed ? "7-Day Shelf Life" : "90-Day Stable"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <span className="text-xs block" style={{ color: "var(--charcoal-60)" }}>{u.time}</span>
                          {isHigh ? (
                            <span className="ks-badge ks-badge-amber text-[10px]" style={{ fontSize: "10px", padding: "1px 6px" }}>
                              ⚡ High Priority
                            </span>
                          ) : isMed ? (
                            <span className="ks-badge ks-badge-blue text-[10px]" style={{ fontSize: "10px", padding: "1px 6px" }}>
                              Medium
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">Standard</span>
                          )}
                        </div>
                        <ChevronRight size={16} style={{ color: "var(--green-deep)" }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReports && (
        <ReportModal onClose={() => setShowReports(false)} isModal={true} />
      )}

      {/* Real-Time Dynamic QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          currentToken={displayToken}
          upcomingList={upcoming}
          onClose={() => setShowScanner(false)}
          onTokenScanned={(scannedFarmer) => {
            setShowScanner(false);
            onOpenFarmer(scannedFarmer);
          }}
        />
      )}
    </div>
  );
}

function ProcessFarmer({ onBack, onComplete, done, farmer }) {
  // Support dynamically scanned or clicked farmer with comprehensive fallbacks
  const fToken = farmer?.token || "A-128";
  const fName = farmer?.farmer_name || (fToken === "A-128" ? "Dinesh Yadav" : fToken === "A-125" ? "Mohan Singh" : FARMER.name.en);
  const fCrop = farmer?.crop || (fToken === "A-128" ? "Soybean" : fToken === "A-125" ? "Paddy" : FARMER.crop.en);
  const fId = farmer?.farmer_id || (fToken === "A-128" ? "FR-98217" : fToken === "A-125" ? "FR-98215" : FARMER.id);
  const fSlot = farmer?.time || "10:30 AM";
  const isHighPerishable = farmer?.perishability_score >= 3 || fCrop === "Soybean" || fCrop === "Mustard" || fCrop === "Fruits" || fCrop === "Vegetables";

  const expectedQty = fCrop === "Soybean" ? "45.0 Quintals" : fCrop === "Paddy" ? "50.0 Quintals" : "40.0 Quintals";
  const actualWeight = fCrop === "Soybean" ? 44.8 : fCrop === "Paddy" ? 49.5 : 42.5;
  const qualityGrade = "A";
  const ratePerQtl = fCrop === "Soybean" ? 4892 : fCrop === "Paddy" ? 2300 : 2275;
  const totalValue = actualWeight * ratePerQtl;
  const bookingId = farmer?.booking_id || (fToken === "A-128" ? 5 : fToken === "A-125" ? 2 : 4);

  return (
    <div className="ks-root min-h-screen p-6 md:p-10 max-w-2xl mx-auto">
      <button onClick={onBack} className="text-sm font-medium mb-5 flex items-center gap-1 cursor-pointer" style={{ color: "var(--charcoal-60)" }}>
        &larr; Back to queue desk
      </button>

      {/* Priority Banner if perishable */}
      {isHighPerishable && (
        <div className="ks-card p-3.5 mb-5 flex items-center gap-2.5 border-2" style={{ background: "#FFFBEB", borderColor: "#F59E0B" }}>
          <Zap size={18} className="text-amber-600 shrink-0" />
          <div className="text-xs text-amber-950 font-medium">
            <strong>⚡ High Perishability Lot:</strong> Prioritized weighbridge admission &bull; Immediate moisture testing and warehouse storage required.
          </div>
        </div>
      )}

      <div className="ks-card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="ks-display text-xl font-bold">Farmer Details</h2>
            <span className="font-bold text-sm px-2.5 py-0.5 rounded-md" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
              Token {fToken}
            </span>
          </div>
          <Badge tone={done ? "green" : "blue"}>{done ? "Completed" : "In Progress"}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div style={{ color: "var(--charcoal-60)" }}>Name</div><div className="font-semibold">{fName}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Farmer ID</div><div className="font-semibold">{fId}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Crop</div><div className="font-semibold">{fCrop}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Slot Window</div><div className="font-semibold">{fSlot}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Expected Quantity</div><div className="font-semibold">{expectedQty}</div></div>
          <div>
            <div style={{ color: "var(--charcoal-60)" }}>Perishability Status</div>
            <div className="font-semibold text-xs">
              {isHighPerishable ? <span className="text-amber-700 font-bold">⚡ High Risk (5-Day Max)</span> : <span className="text-slate-600">Standard Stable Grain</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="ks-card p-6 mb-5">
        <h3 className="font-semibold mb-4 text-sm">Weighbridge & Quality Grading</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div style={{ color: "var(--charcoal-60)" }}>Actual Net Weight</div><div className="font-semibold">{actualWeight} Quintals</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Quality Grade</div><div className="font-semibold">Grade {qualityGrade} (Assayed)</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Procurement MSP Rate</div><div className="font-semibold">₹{ratePerQtl.toLocaleString("en-IN")} / qtl</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Total Payout Value</div><div className="font-semibold" style={{ color: "var(--green-deep)" }}>₹{Math.round(totalValue).toLocaleString("en-IN")}</div></div>
        </div>
      </div>

      {done ? (
        <div className="ks-card p-4 flex items-center gap-2" style={{ background: "var(--green-bg)", border: "none" }}>
          <CheckCircle2 size={18} style={{ color: "var(--green-deep)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--green-deep)" }}>
            Procurement completed &middot; PFMS DBT direct bank payment of ₹{Math.round(totalValue).toLocaleString("en-IN")} initiated.
          </span>
        </div>
      ) : (
        <button onClick={async () => {
          await completeProcurement(bookingId, {
            actual_weight: actualWeight,
            quality_grade: qualityGrade,
            rate_per_quintal: ratePerQtl,
          });
          onComplete();
        }} className="ks-btn ks-btn-primary w-full py-3.5 cursor-pointer">
          Complete Procurement &amp; Initiate Payment
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ADMIN                                                                */
/* ------------------------------------------------------------------ */

function AdminDashboard({ page, setPage, completed, allocationApplied, applyAllocation }) {
  const statusTone = { Busy: "amber", Critical: "red", Normal: "green" };
  const [adminData, setAdminData] = useState(null);
  const [demandData, setDemandData] = useState(null);
  const [imbalanceData, setImbalanceData] = useState(null);

  const [weatherActionTaken, setWeatherActionTaken] = useState(false);
  const [clusterRebalanced, setClusterRebalanced] = useState(false);
  const [mandiFilter, setMandiFilter] = useState("all");

  useEffect(() => {
    getAdminOverview(null).then((data) => {
      if (data) setAdminData(data);
    });
  }, [allocationApplied]);

  useEffect(() => {
    if (page === "allocation") {
      getDemandCapacity(2, "2026-09-12", null).then((data) => {
        if (data && data.data) setDemandData(data.data);
      });
      getImbalances("2026-09-12", null).then((data) => {
        if (data) setImbalanceData(data);
      });
    }
  }, [page, allocationApplied]);

  const stats = adminData || { total_farmers: 12430, completed, waiting: 1284, delayed: 97, centres: CENTRES.map((c) => ({ ...c, queue: c.queue })) };
  const baseCentreList = CENTRES.map((staticC) => {
    const apiC = adminData?.centres?.find((ac) => ac.id === staticC.id || ac.name === staticC.name);
    return {
      ...staticC,
      ...(apiC || {}),
      distanceKm: staticC.distanceKm,
      distance_km: staticC.distanceKm,
      openQuotaMT: staticC.openQuotaMT,
      open_quota_mt: staticC.openQuotaMT,
      type: staticC.type,
      centre_type: staticC.type,
      inCluster10km: staticC.inCluster10km,
      queue: (apiC?.queue && apiC.queue > 0 && staticC.id !== 1) ? apiC.queue : staticC.queue,
      capacity: staticC.capacity,
      status: staticC.status,
      x: staticC.x,
      y: staticC.y,
      location_x: staticC.x,
      location_y: staticC.y,
    };
  });
  const centreList = baseCentreList.map((c) => {
    if (!clusterRebalanced) return c;
    if (c.id === 1 || c.name.includes("Sehore")) {
      return { ...c, queue: 14, capacity: 58, status: "Normal" };
    }
    if (c.id === 2 || c.name.includes("Ichhawar")) {
      return { ...c, queue: 26, capacity: 62, status: "Normal" };
    }
    if (c.id === 3 || c.name.includes("Bilkisganj")) {
      return { ...c, queue: 20, capacity: 54, status: "Normal" };
    }
    return c;
  });
  const chartData = demandData || (allocationApplied ? DEMAND_FIXED : DEMAND_BASE);

  const links = [
    { id: "overview", label: "Command Overview", icon: LayoutGrid },
    { id: "targets", label: "Procurement & DBT", icon: TrendingUp },
    { id: "weather", label: "IMD Weather Alert", icon: CloudRain, badge: "85% Rain" },
    { id: "antifraud", label: "AI Anti-Fraud", icon: ShieldAlert, badge: "Phase 2" },
    { id: "allocation", label: "Smart Allocation", icon: Sparkles },
    { id: "reports", label: "Reports & CSV", icon: FileBarChart },
    { id: "centres", label: "10-km Mandi Mesh", icon: MapPinned, badge: "12 Mandis" },
  ];

  // Government Target Monitor Data (Item a)
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
  };

  // IMD Weather & Spoilage Early Warning Data (Item d)
  const WEATHER_RADAR = [
    { centre: "Vidisha Procurement Centre", risk: "85%", temp: "28°C", condition: "Thunderstorm & Heavy Rain Alert", timeToImpact: "2-3 Hours", tone: "red", openGrainQtl: 3450, criticalCrop: "Soybean (980 Qtl)", lossRiskCr: "₹0.84 Cr", actionNeeded: true },
    { centre: "Raisen Procurement Centre", risk: "45%", temp: "29°C", condition: "Scattered Showers / Watch", timeToImpact: "5-6 Hours", tone: "amber", openGrainQtl: 1200, criticalCrop: "Wheat (1,200 Qtl)", lossRiskCr: "₹0.27 Cr", actionNeeded: false },
    { centre: "Sehore Procurement Centre", risk: "10%", temp: "32°C", condition: "Partly Cloudy", timeToImpact: "None", tone: "green", openGrainQtl: 0, criticalCrop: "Covered Storage", lossRiskCr: "₹0.00", actionNeeded: false },
    { centre: "Bhopal Procurement Centre", risk: "18%", temp: "30°C", condition: "Overcast", timeToImpact: "None", tone: "green", openGrainQtl: 0, criticalCrop: "Covered Yard", lossRiskCr: "₹0.00", actionNeeded: false },
    { centre: "Ujjain Procurement Centre", risk: "5%", temp: "33°C", condition: "Clear Skies", timeToImpact: "None", tone: "green", openGrainQtl: 0, criticalCrop: "Clear", lossRiskCr: "₹0.00", actionNeeded: false },
  ];

  // AI Anti-Fraud Vigilance Components (Item c - Future Advancement)
  const FRAUD_COMPONENTS = [
    {
      title: "1. Yield vs. Landholding Anomaly Detection (Bhulekh API)",
      subtitle: "Detects commercial traders dumping interstate grain using real farmer profiles",
      tag: "Cadastral Geo-Sync",
      badge: "Algorithmic Validation",
      desc: "Cross-checks booked harvest volume against state land records (MP Bhulekh / Khasra) & satellite acreage. Flags instances where a farmer claims 450 quintals on a 1.5-acre holding (standard yield: 22 Qtl/acre).",
      flagExample: "Anomaly Flagged: Farmer FR-10492 declared 450 Qtl on 1.5 acres. Mandatory physical verification triggered before DBT clearance.",
      statusText: "Phase 2 Model Training (89.4% precision on historical audit data)",
      icon: Layers,
    },
    {
      title: "2. Rapid Token Bot & Middleman Syndicate Detector",
      subtitle: "Prevents broker cartels from cornering prime morning queue slots",
      tag: "IP / Device Fingerprinting",
      badge: "Heuristic Rules Built",
      desc: "Monitors token reservation velocity and IP clustering across web and IVR telephony channels. Automatically throttles and flags clusters when 15+ appointments originate from the same IP or phone number within minutes.",
      flagExample: "Syndicate Alert: 18 consecutive bookings within 4 minutes from single IP block. Rate-limiter enforced; OTP challenge issued.",
      statusText: "Rules Engine Implemented & Ready for Sandbox Testing",
      icon: ShieldCheck,
    },
    {
      title: "3. Weighbridge Moisture & Quality Manipulation Scanner",
      subtitle: "Identifies collusive grading patterns at physical scale counters",
      tag: "Statistical Anomaly",
      badge: "Feature Extraction",
      desc: "Compares weighbridge moisture deduction distributions across mandi operators against regional agricultural averages. Flags weighmasters consistently approving sub-standard 17%+ moisture grain as Grade A with zero deduction.",
      flagExample: "Scale Audit Flag: Counter 3 registered 0.0% moisture deduction across 45 consecutive lots while regional average is 13.8%.",
      statusText: "Statistical distribution pipeline built",
      icon: Droplets,
    },
    {
      title: "4. Farm-Gate Satellite Crop Verification (Sentinel-2)",
      subtitle: "Optical confirmation of active standing harvest before pass generation",
      tag: "Sentinel-2 NDVI",
      badge: "Architecture Ready",
      desc: "Integrates European Space Agency Sentinel-2 multispectral imagery to verify active standing crop and vegetative health index on the registered coordinates, preventing paper-only agricultural claims.",
      flagExample: "Satellite Match: NDVI vegetation index confirmed (0.68 active vegetative density) across registered plot coordinates.",
      statusText: "API Pipeline Architecture Designed for Pilot Rollout",
      icon: Landmark,
    },
  ];

  return (
    <div className="ks-root min-h-screen flex">
      <aside className="hidden md:flex flex-col w-60 shrink-0 px-4 py-6" style={{ background: "var(--green-deep)" }}>
        <div className="flex items-center gap-2 px-2 mb-8">
          <Wheat size={18} color="#fff" />
          <span className="ks-display font-bold text-white">KisanSetu</span>
        </div>
        {links.map((l) => (
          <div
            key={l.id}
            onClick={() => setPage(l.id)}
            className={`ks-sidebar-link flex items-center justify-between cursor-pointer ${page === l.id ? "active" : ""}`}
          >
            <div className="flex items-center gap-2">
              <l.icon size={17} />
              <span>{l.label}</span>
            </div>
            {l.badge && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: l.id === "weather" ? "#EF4444" : "rgba(255,255,255,0.2)",
                  color: "#fff",
                }}
              >
                {l.badge}
              </span>
            )}
          </div>
        ))}
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        {/* VIEW 1: COMMAND OVERVIEW */}
        {page === "overview" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
            </div>

            {/* Top Row: Targets Progress & DBT Outflow Highlights */}
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              {/* Season Target Progress Bar */}
              <div className="ks-card p-4 transition-all hover:shadow-sm" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                      <TrendingUp size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Season Procurement Target</div>
                      <div className="text-[11px] text-slate-500">Rabi / Kharif 2026 Season Goal</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: "var(--green-deep)" }}>
                    {TARGET_DATA.targetPct}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${TARGET_DATA.targetPct}%`,
                      background: "linear-gradient(90deg, var(--green-deep) 0%, #2E7D32 100%)",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span><strong>{TARGET_DATA.procuredMT.toLocaleString()} MT</strong> procured</span>
                  <span>Target: <strong>{TARGET_DATA.seasonTargetMT.toLocaleString()} MT</strong></span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Daily Influx: <strong>{TARGET_DATA.dailyInfluxMT.toLocaleString()} MT / day</strong></span>
                  <span className="text-emerald-700 font-semibold">~{TARGET_DATA.remainingDays} days to target</span>
                </div>
              </div>

              {/* Real-time PFMS DBT Outflow Metric */}
              <div className="ks-card p-4 transition-all hover:shadow-sm" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                      <IndianRupee size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Real-Time DBT Outflow (PFMS)</div>
                      <div className="text-[11px] text-slate-500">Direct Farmer Account Credits</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    96.4% &lt; 24h
                  </span>
                </div>

                <div className="mb-2">
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    ₹ {DBT_DATA.disbursedCr} <span className="text-xs font-semibold text-slate-500">Crore</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {DBT_DATA.disbursedPct}% of total ₹{DBT_DATA.totalCommittedCr} Cr procurement value cleared
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Avg Settlement TAT: <strong>{DBT_DATA.avgTatHours} Hours</strong></span>
                  <span>In Treasury Pipeline: <strong>₹{DBT_DATA.pipelineCr} Cr</strong></span>
                </div>
              </div>
            </div>

            {/* Weather Alert Notification Banner */}
            <div
              onClick={() => setPage("weather")}
              className="ks-card p-3 mb-5 border flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
              style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <CloudRain size={17} />
                </div>
                <div>
                  <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <span>IMD Flash Alert: Vidisha Mandi Open Yard (85% Rain Probability)</span>
                    <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-semibold">Critical</span>
                  </div>
                  <div className="text-[11px] text-red-700">
                    3,450 Quintals of grain in open transit (including 980 Qtl perishable Soybean). Heavy thunderstorm expected in 2–3 hours.
                  </div>
                </div>
              </div>
              <button
                className="ks-btn text-xs font-bold px-3 py-1 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1 flex-shrink-0 ml-2"
              >
                <span>Inspect & Divert →</span>
              </button>
            </div>

            {/* 4 Stat Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatTile label="Total Farmers Registered" value={stats.total_farmers.toLocaleString()} icon={Users} />
              <StatTile label="Completed Today" value={stats.completed.toLocaleString()} icon={CheckCircle2} />
              <StatTile label="Waiting in Queue" value={stats.waiting.toLocaleString()} icon={Clock} />
              <StatTile label="Capacity Reallocated" value={stats.delayed.toLocaleString()} icon={AlertTriangle} />
            </div>

            {/* Centres Table & Region Map */}
            <div className="grid md:grid-cols-5 gap-5 mb-6">
              <div className="ks-card p-5 md:col-span-3" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Procurement Centres Network</h3>
                  <span className="text-xs text-slate-500">5 Active District Hubs</span>
                </div>
                <table className="ks-table">
                  <thead>
                    <tr>
                      <th>Centre</th>
                      <th>Queue</th>
                      <th>Capacity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centreList.map((c) => (
                      <tr key={c.name}>
                        <td className="font-medium">{c.name.split(" ")[0]}</td>
                        <td>{c.queue}</td>
                        <td>{c.capacity}%</td>
                        <td><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ks-card p-5 md:col-span-2" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                <h3 className="font-semibold text-sm mb-3">Madhya Pradesh Region Map</h3>
                <div className="relative w-full rounded-xl" style={{ height: 220, background: "var(--cream-2)" }}>
                  {centreList.map((c) => (
                    <div
                      key={c.name}
                      title={`${c.name} \u00b7 ${c.status}`}
                      className="map-marker"
                      style={{ left: `${c.location_x ?? c.x}%`, top: `${c.location_y ?? c.y}%` }}
                    >
                      <span
                        className="map-marker-dot"
                        style={{
                          width: c.name.includes("Bhopal") ? 16 : 12, height: c.name.includes("Bhopal") ? 16 : 12,
                          background: c.status === "Critical" ? "var(--red)" : c.status === "Busy" ? "var(--amber)" : "var(--green-fresh)",
                        }}
                      />
                      <span className="map-marker-label">{c.name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PROCUREMENT TARGET MONITOR & REAL-TIME DBT OUTFLOW (Items a & b) */}
        {page === "targets" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="ks-display text-2xl font-bold">Procurement Targets & DBT Outflow</h2>
                <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                  Real-time MSP monitoring, district quota fulfillment, and PFMS direct treasury settlement
                </p>
              </div>
              <span className="ks-badge ks-badge-green text-xs">PFMS Live Sync</span>
            </div>

            {/* PART A: The Procurement Target Monitor */}
            <div className="ks-card p-5" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">State Procurement Target Fulfillment</h3>
                    <p className="text-xs text-slate-500">Central Zone: 5,00,000 MT Target &middot; Rabi/Kharif Season</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {TARGET_DATA.targetPct}% Target Reached
                </span>
              </div>

              {/* Master Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3.5 mb-4 overflow-hidden border border-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${TARGET_DATA.targetPct}%`,
                    background: "linear-gradient(90deg, var(--green-deep) 0%, #2E7D32 100%)",
                  }}
                />
              </div>

              {/* District Target Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                {TARGET_DATA.districts.map((d) => (
                  <div key={d.name} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800">{d.name}</span>
                      <span className={`text-[10px] font-bold ${d.pct >= 80 ? "text-emerald-700" : d.pct >= 60 ? "text-blue-700" : "text-amber-700"}`}>
                        {d.pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${d.pct}%`,
                          background: d.pct >= 80 ? "var(--green-deep)" : d.pct >= 60 ? "#2563EB" : "#D97706",
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>{(d.actual / 1000).toFixed(1)}k MT</span>
                      <span>Target: {(d.target / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Today: +{d.arrivalsToday} MT
                    </div>
                  </div>
                ))}
              </div>

              {/* Crop Composition Table */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Crop Influx Breakdown & MSP Value
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {TARGET_DATA.crops.map((c) => (
                    <div key={c.name} className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-800">{c.name}</span>
                        {c.isPerishable && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                            Perishable
                          </span>
                        )}
                      </div>
                      <div className="text-base font-bold text-slate-900">{c.volumeMT.toLocaleString()} MT</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>MSP: {c.msp}</span>
                        <span className="font-semibold text-slate-700">{c.valueCr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PART B: Real-Time DBT Outflow & PFMS Treasury Tracker */}
            <div className="ks-card p-5" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                    <IndianRupee size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">PFMS Direct Benefit Transfer (DBT) Pipeline</h3>
                    <p className="text-xs text-slate-500">Direct-to-bank settlement speed, audit compliance, and UTR tracking</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">24-Hour Settlement SLA</div>
                  <div className="text-sm font-bold text-emerald-700">96.4% on-time (Avg: 18.2h)</div>
                </div>
              </div>

              {/* 4-Stage PFMS Funnel */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
                {DBT_DATA.pipelineStages.map((st, i) => (
                  <div key={st.step} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 relative">
                    <div className="text-[11px] font-bold text-slate-500 mb-1">{st.step}</div>
                    <div className="text-base font-bold text-slate-800">{st.amount}</div>
                    <div className="text-xs text-slate-600">{st.lots}</div>
                    <div className="text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-200">
                      {st.note}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Real-Time DBT Settlement Feed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Recent Real-Time DBT Disbursements
                  </h4>
                  <span className="text-[11px] text-slate-500">Simulated live bank ledger</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="ks-table">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Crop</th>
                        <th>Disbursed Amount</th>
                        <th>Bank & Account</th>
                        <th>UTR Reference</th>
                        <th>Turnaround</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DBT_DATA.recentTrans.map((tr) => (
                        <tr key={tr.farmer}>
                          <td>
                            <div className="font-bold text-xs">{tr.farmer}</div>
                            <div className="text-[10px] text-slate-400">{tr.fid}</div>
                          </td>
                          <td className="text-xs">{tr.crop}</td>
                          <td className="font-bold text-xs text-slate-900">{tr.amount}</td>
                          <td className="text-xs text-slate-600">{tr.bank}</td>
                          <td>
                            <code className="text-[11px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
                              {tr.utr}
                            </code>
                          </td>
                          <td className="text-xs text-slate-600">{tr.tat}</td>
                          <td>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                tr.status === "Settled"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {tr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: IMD WEATHER & SPOILAGE EARLY WARNING (Item d) */}
        {page === "weather" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="ks-display text-2xl font-bold">IMD Weather & Spoilage Early Warning</h2>
                <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                  Real-time Doppler radar integration &middot; Open-yard grain rain protection & emergency rerouting
                </p>
              </div>
              <span className="ks-badge ks-badge-green text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                IMD Radar Live
              </span>
            </div>

            {/* Grain-at-Risk Alert Hero Card */}
            <div
              className="ks-card p-5 border transition-all"
              style={{
                background: weatherActionTaken ? "#F0FDF4" : "#FEF2F2",
                borderColor: weatherActionTaken ? "#86EFAC" : "#FCA5A5",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: weatherActionTaken ? "#DCFCE7" : "#FEE2E2",
                      color: weatherActionTaken ? "#15803D" : "#B91C1C",
                    }}
                  >
                    {weatherActionTaken ? <CheckCircle2 size={22} /> : <CloudRain size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {weatherActionTaken
                          ? "Emergency Action Deployed: 3,450 Quintals Grain Secured"
                          : "Critical Weather Risk: 3,450 Quintals Uncovered at Vidisha Mandi"}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: weatherActionTaken ? "#DCFCE7" : "#DC2626",
                          color: weatherActionTaken ? "#15803D" : "#fff",
                        }}
                      >
                        {weatherActionTaken ? "Protocols Active" : "85% Rain in 2-3h"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {weatherActionTaken
                        ? "142 tractor-trolleys successfully rerouted to covered Bhopal Silos & CWC Godown; 24 tarpaulins deployed over open bays."
                        : "Heavy downpour expected in 2–3 hours. 980 Quintals of high-spoilage Soybean exposed in open yard. Potential spoilage loss: ₹84.20 Lakh."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!weatherActionTaken ? (
                    <button
                      onClick={() => {
                        playChime();
                        setWeatherActionTaken(true);
                      }}
                      className="ks-btn text-xs font-bold px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Zap size={14} />
                      <span>Trigger Emergency Divert & Cover Order</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setWeatherActionTaken(false)}
                      className="ks-btn text-xs font-semibold px-3 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-slate-50"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Simulation</span>
                    </button>
                  )}
                </div>
              </div>

              {weatherActionTaken && (
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-900 mt-2 space-y-1 animate-fade-in">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Government Administrative Order Dispatched:
                  </div>
                  <div className="text-[11px] text-slate-600 pl-5">
                    • <strong>142 Drivers Notified via SMS:</strong> Token validity preserved; rerouted to Bhopal Covered Grain Silo (Gate #2).
                  </div>
                  <div className="text-[11px] text-slate-600 pl-5">
                    • <strong>Mandi Secretary Acknowledged:</strong> 24 heavy-duty 500 GSM PVC tarpaulins securely battened down on Vidisha Weighbridge bays.
                  </div>
                </div>
              )}
            </div>

            {/* Regional Mandi Weather Radar Grid */}
            <div className="ks-card p-5" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <h3 className="font-bold text-sm text-slate-800 mb-3">
                IMD Radar Precipitation Risk Across Mandi Network
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {WEATHER_RADAR.map((wr) => (
                  <div
                    key={wr.centre}
                    className={`p-3 rounded-xl border ${
                      wr.tone === "red"
                        ? "border-red-300 bg-red-50/40"
                        : wr.tone === "amber"
                        ? "border-amber-300 bg-amber-50/40"
                        : "border-slate-200 bg-slate-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800">{wr.centre.split(" ")[0]}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          wr.tone === "red"
                            ? "bg-red-100 text-red-800"
                            : wr.tone === "amber"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {wr.risk}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700">{wr.condition}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Temp: {wr.temp} &middot; {wr.timeToImpact}</div>
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                      Open Grain: <strong>{wr.openGrainQtl} Qtl</strong>
                      {wr.openGrainQtl > 0 && <div className="text-red-700 font-semibold">{wr.criticalCrop}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: AI ANTI-FRAUD & VIGILANCE (Item c - Future Advancement "Coming Soon") */}
        {page === "antifraud" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="ks-display text-2xl font-bold">AI Anti-Fraud & Vigilance Engine</h2>
                <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                  Machine-learning anomaly detection for safeguarding public MSP procurement integrity
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                🚀 Phase 2 Pilot (Coming Soon)
              </span>
            </div>

            {/* "Coming Soon" Hero Banner */}
            <div className="ks-card p-6" style={{ background: "linear-gradient(135deg, #FAF7F2 0%, #EBF4EE 100%)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-slate-900">AI Vigilance Module &bull; Slated for Phase 2 Pilot</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-white">
                      Roadmap Q4 2026
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    KisanSetu's AI Vigilance Engine is being developed as an algorithmic defense system against ghost farmers, interstate commercial grain dumping, and scale tampering. Below are the 4 core sub-systems currently undergoing model validation against MP Bhulekh cadastral datasets.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                      🎯 Target: Zero Fake Farmer Registrations
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                      🛡️ Anti-Cartel Rate Limiting
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                      🛰️ Sentinel-2 Satellite Sync
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* The 4 Key Components as Crisp Architecture Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {FRAUD_COMPONENTS.map((fc) => (
                <div key={fc.title} className="ks-card p-4 flex flex-col justify-between" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-bg)", color: "var(--green-deep)" }}>
                          <fc.icon size={16} />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {fc.tag}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {fc.badge}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mb-1">{fc.title}</h4>
                    <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">{fc.subtitle}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{fc.desc}</p>

                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900 leading-relaxed font-mono">
                      {fc.flagExample}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Validation Status</span>
                    <span className="font-medium text-emerald-700">{fc.statusText}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: SMART SLOT ALLOCATION (Preserved) */}
        {page === "allocation" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="ks-display text-2xl font-bold">Smart Slot Allocation & Load Balancing</h2>
                <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                  Automated demand vs capacity analysis across regional procurement centres
                </p>
              </div>
              <span className="ks-badge ks-badge-green text-xs">AI Optimization</span>
            </div>

            <div className="ks-card p-5" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} style={{ color: "var(--green-deep)" }} />
                <h3 className="font-semibold text-sm">Expected Demand vs. Available Mandi Capacity</h3>
              </div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "#665F55" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#665F55" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="demand" name="Expected Demand" fill="#C98A22" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="capacity" name="Available Capacity" fill="#1F4D36" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {!allocationApplied ? (
              <div className="ks-card p-5" style={{ background: "var(--red-bg)", border: "none" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} style={{ color: "var(--red)" }} />
                  <span className="font-semibold text-sm" style={{ color: "var(--red)" }}>Capacity imbalance detected</span>
                </div>
                <p className="text-sm mb-4" style={{ color: "#7A3123" }}>
                  {imbalanceData?.imbalances?.[0]
                    ? `${imbalanceData.imbalances[0].centre_name.split(" ")[0]} Procurement Centre is expected to exceed capacity at ${imbalanceData.imbalances[0].peak_hour}.`
                    : "Vidisha Procurement Centre is expected to exceed capacity between 10 AM – 12 PM."
                  }
                </p>
                <div className="ks-card p-3.5 mb-4" style={{ border: "none", background: "#fff" }}>
                  <span className="text-xs font-semibold uppercase" style={{ color: "var(--charcoal-60)" }}>Recommended action</span>
                  <p className="text-sm font-medium mt-1">
                    {imbalanceData?.imbalances?.[0]?.recommendation || "Move 28 appointments from Vidisha → Bhopal"}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const imb = imbalanceData?.imbalances?.[0];
                    if (imb) {
                      await applyAllocationAction(imb.centre_id, imb.target_centre_id, imb.move_count, "2026-09-12");
                    }
                    applyAllocation();
                  }}
                  className="ks-btn ks-btn-primary px-5 py-2.5 text-sm cursor-pointer"
                >
                  Apply Recommendation
                </button>
              </div>
            ) : (
              <div className="ks-card p-4 flex items-center gap-2" style={{ background: "var(--green-bg)", border: "none" }}>
                <CheckCircle2 size={18} style={{ color: "var(--green-deep)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--green-deep)" }}>
                  Slot allocation updated successfully. 28 appointments re-routed to Bhopal.
                </span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: REPORTS & CSV (Preserved) */}
        {page === "reports" && <ReportModal isModal={false} />}

        {/* VIEW 7: 10-KM MANDI MESH & REGIONAL INFRASTRUCTURE */}
        {page === "centres" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="ks-badge text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--green-deep)" }}>
                    <Compass size={13} className="inline mr-1" /> 10-km Radial Mesh Network
                  </span>
                  <span className="ks-badge text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "var(--cream-2)", color: "var(--charcoal-70)" }}>
                    12 Active Mandis &amp; Sub-Centres
                  </span>
                </div>
                <h2 className="ks-display text-2xl font-bold">10-km Hyper-Local Mandi Mesh &amp; Regional Grid</h2>
                <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                  Real-time radial rebalancing, crop quota saturation rerouting, and Tier-2 B2B Bhavantar surplus protection across the Sehore–Bhopal–Malwa corridor.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setClusterRebalanced(!clusterRebalanced);
                    playChime();
                  }}
                  className="ks-btn flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm"
                  style={{
                    background: clusterRebalanced ? "#334155" : "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  {clusterRebalanced ? (
                    <>
                      <RotateCcw size={14} /> Reset Mesh Load
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Activate 10-km Auto-Reroute Pass
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Top KPI Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="ks-card p-4 rounded-xl" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--charcoal-60)" }}>Monitored Mandis</span>
                  <Building2 size={16} style={{ color: "var(--green-deep)" }} />
                </div>
                <div className="text-2xl font-bold">12 Centres</div>
                <div className="text-[11px] mt-1" style={{ color: "var(--charcoal-60)" }}>
                  1 Apex Hub · 4 Sub-Mandis · 2 Yards · 5 Regional
                </div>
              </div>

              <div className="ks-card p-4 rounded-xl" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--charcoal-60)" }}>10-km Mesh Open Quota</span>
                  <Radio size={16} style={{ color: "#0284c7" }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: "#0284c7" }}>1,960 MT</div>
                <div className="text-[11px] mt-1" style={{ color: "var(--charcoal-60)" }}>
                  Govt MSP quota open in 5 satellite sub-mandis
                </div>
              </div>

              <div className="ks-card p-4 rounded-xl" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--charcoal-60)" }}>Sehore Central Hub</span>
                  <AlertTriangle size={16} style={{ color: clusterRebalanced ? "var(--green-deep)" : "var(--red)" }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: clusterRebalanced ? "var(--green-deep)" : "var(--red)" }}>
                  {clusterRebalanced ? "58% (Normal)" : "98% (Saturated)"}
                </div>
                <div className="text-[11px] mt-1" style={{ color: "var(--charcoal-60)" }}>
                  {clusterRebalanced ? "14 Trucks In-Queue · 34 Re-routed" : "Soybean Quota 100% Full · 48 Trucks Queued"}
                </div>
              </div>

              <div className="ks-card p-4 rounded-xl" style={{ background: clusterRebalanced ? "rgba(16, 185, 129, 0.08)" : "#fff", border: clusterRebalanced ? "1.5px solid #10b981" : "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--charcoal-60)" }}>Mesh Load Status</span>
                  <Truck size={16} style={{ color: clusterRebalanced ? "var(--green-deep)" : "#f59e0b" }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: clusterRebalanced ? "var(--green-deep)" : "var(--charcoal)" }}>
                  {clusterRebalanced ? "Balanced ✓" : "Bottleneck"}
                </div>
                <div className="text-[11px] mt-1 font-medium" style={{ color: clusterRebalanced ? "var(--green-deep)" : "#d97706" }}>
                  {clusterRebalanced ? "Ichhawar (+18) & Bilkisganj (+16) active" : "Auto-Reroute Pass recommended"}
                </div>
              </div>
            </div>

            {/* Radar & GIS Visual + Rebalancing Explainer */}
            <div className="grid md:grid-cols-12 gap-5">
              {/* Visual 10-km Radar Display (7 cols) */}
              <div className="md:col-span-7 ks-card p-5 rounded-2xl flex flex-col justify-between" style={{ background: "#0b1329", color: "#f8fafc", border: "1px solid #1e293b" }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                      <Radio size={16} className="animate-pulse" /> 10-km Hyper-Local Radial Radar
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Concentric policy rings around Sehore Apex Hub. Satellite sub-mandis absorb surplus influx.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Live Telemetry
                  </span>
                </div>

                {/* Radar SVG Diagram */}
                <div className="relative w-full rounded-xl overflow-hidden my-3 flex items-center justify-center" style={{ height: 320, background: "radial-gradient(circle at 50% 50%, #172554 0%, #0b1329 70%)" }}>
                  <svg className="w-full h-full" viewBox="0 0 500 320">
                    <defs>
                      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Concentric Radius Rings */}
                    {/* 5 km ring */}
                    <circle cx="250" cy="160" r="60" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="250" y="96" fill="#64748b" fontSize="9" textAnchor="middle">5-km Radius</text>

                    {/* 10 km Critical Policy Perimeter Ring */}
                    <circle cx="250" cy="160" r="115" fill="rgba(16, 185, 129, 0.03)" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" />
                    <rect x="165" y="40" width="170" height="18" rx="4" fill="#064e3b" opacity="0.85" />
                    <text x="250" y="52" fill="#34d399" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                      10-km Auto-Reroute Perimeter
                    </text>

                    {/* 15 km Regional Ring */}
                    <circle cx="250" cy="160" r="150" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" />
                    <text x="250" y="14" fill="#475569" fontSize="9" textAnchor="middle">15-km Boundary</text>

                    {/* Dynamic Transfer Flow Lines when Rebalanced */}
                    {clusterRebalanced && (
                      <>
                        {/* Sehore -> Ichhawar (7.2 km) */}
                        <path
                          d="M 250 160 Q 215 190 180 220"
                          fill="none"
                          stroke="url(#flowGrad)"
                          strokeWidth="3"
                          strokeDasharray="6 4"
                          filter="url(#glow)"
                        >
                          <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1.2s" repeatCount="indefinite" />
                        </path>
                        <rect x="150" y="180" width="85" height="18" rx="4" fill="#065f46" stroke="#10b981" strokeWidth="1" />
                        <text x="192" y="192" fill="#ecfdf5" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                          +18 Trucks Diverted
                        </text>

                        {/* Sehore -> Bilkisganj (9.4 km) */}
                        <path
                          d="M 250 160 Q 295 180 340 205"
                          fill="none"
                          stroke="url(#flowGrad)"
                          strokeWidth="3"
                          strokeDasharray="6 4"
                          filter="url(#glow)"
                        >
                          <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1.2s" repeatCount="indefinite" />
                        </path>
                        <rect x="290" y="172" width="85" height="18" rx="4" fill="#065f46" stroke="#10b981" strokeWidth="1" />
                        <text x="332" y="184" fill="#ecfdf5" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                          +16 Trucks Diverted
                        </text>
                      </>
                    )}

                    {/* Nodes within 10 km */}
                    {/* 1. Sehore Apex Hub (Center) */}
                    <circle cx="250" cy="160" r={clusterRebalanced ? 10 : 13} fill={clusterRebalanced ? "#10b981" : "#ef4444"} filter="url(#glow)" />
                    <circle cx="250" cy="160" r="5" fill="#ffffff" />
                    <text x="250" y="142" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                      Sehore Main APMC (0 km)
                    </text>
                    <text x="250" y="182" fill={clusterRebalanced ? "#6ee7b7" : "#fca5a5"} fontSize="9" textAnchor="middle">
                      {clusterRebalanced ? "14 Trucks (58%)" : "48 Trucks (98% Saturation)"}
                    </text>

                    {/* 2. Ichhawar Sub-Mandi (7.2 km, angle ~225°) */}
                    <circle cx="180" cy="220" r="8" fill={clusterRebalanced ? "#10b981" : "#38bdf8"} />
                    <text x="180" y="240" fill="#e2e8f0" fontSize="9.5" fontWeight="600" textAnchor="middle">
                      Ichhawar Sub-Mandi
                    </text>
                    <text x="180" y="252" fill="#94a3b8" fontSize="8" textAnchor="middle">
                      7.2 km · {clusterRebalanced ? "26 Trucks · 420 MT Open" : "8 Trucks · 420 MT Open"}
                    </text>

                    {/* 3. Bilkisganj Rural Yard (9.4 km, angle ~320°) */}
                    <circle cx="340" cy="205" r="8" fill={clusterRebalanced ? "#10b981" : "#38bdf8"} />
                    <text x="340" y="225" fill="#e2e8f0" fontSize="9.5" fontWeight="600" textAnchor="middle">
                      Bilkisganj Rural Yard
                    </text>
                    <text x="340" y="237" fill="#94a3b8" fontSize="8" textAnchor="middle">
                      9.4 km · {clusterRebalanced ? "20 Trucks · 650 MT Open" : "4 Trucks · 650 MT Open"}
                    </text>

                    {/* 4. Phanda Logistics Yard (9.8 km, angle ~45°) */}
                    <circle cx="335" cy="100" r="7" fill="#38bdf8" />
                    <text x="335" y="88" fill="#e2e8f0" fontSize="9.5" fontWeight="600" textAnchor="middle">
                      Phanda Logistics
                    </text>
                    <text x="335" y="118" fill="#94a3b8" fontSize="8" textAnchor="middle">
                      9.8 km · 510 MT Open
                    </text>

                    {/* 5. Shyampur Agro Center (11.2 km, angle ~140°) */}
                    <circle cx="160" cy="105" r="7" fill="#94a3b8" />
                    <text x="160" y="93" fill="#cbd5e1" fontSize="9" fontWeight="500" textAnchor="middle">
                      Shyampur Center
                    </text>
                    <text x="160" y="122" fill="#64748b" fontSize="8" textAnchor="middle">
                      11.2 km · 380 MT Open
                    </text>

                    {/* 6. Doraha Kisan Yard (12.0 km, angle ~75°) */}
                    <circle cx="285" cy="45" r="6" fill="#94a3b8" />
                    <text x="285" y="35" fill="#cbd5e1" fontSize="9" fontWeight="500" textAnchor="middle">
                      Doraha Yard
                    </text>
                    <text x="285" y="65" fill="#64748b" fontSize="8" textAnchor="middle">
                      12.0 km · 340 MT Open
                    </text>

                    {/* 7. Ashta Grain Hub (14.5 km, angle ~250°) */}
                    <circle cx="115" cy="190" r="7" fill="#f59e0b" />
                    <text x="115" y="180" fill="#fde68a" fontSize="9" fontWeight="500" textAnchor="middle">
                      Ashta Hub
                    </text>
                    <text x="115" y="206" fill="#94a3b8" fontSize="8" textAnchor="middle">
                      14.5 km · 720 MT Open
                    </text>
                  </svg>
                </div>

                {/* Radar Footer Legend */}
                <div className="flex flex-wrap items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Saturated Hub
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Relief Sub-Mandi (≤ 10 km)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span> Open Satellites
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono">
                    Cluster Status: {clusterRebalanced ? "DYNAMICALLY BALANCED" : "BOTTLENECK DETECTED"}
                  </span>
                </div>
              </div>

              {/* Protocol Details & Auto-Reroute Engine Explainer (5 cols) */}
              <div className="md:col-span-5 space-y-4">
                <div className="ks-card p-5 rounded-2xl" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Navigation size={16} style={{ color: "var(--green-deep)" }} />
                    10-km Hyper-Local Routing Protocol
                  </h3>

                  <div className="space-y-3 text-xs leading-relaxed" style={{ color: "var(--charcoal-70)" }}>
                    <div className="p-3 rounded-xl" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
                      <div className="font-semibold text-xs mb-1" style={{ color: "var(--charcoal)" }}>
                        1. Threshold Saturation Trigger (&gt;95% or Quota Met)
                      </div>
                      When Sehore Main Mandi hits 98% yard capacity or its crop-specific procurement quota (e.g., Soybean 100% full) is met, the system auto-locks incoming tokens for that crop.
                    </div>

                    <div className="p-3 rounded-xl" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
                      <div className="font-semibold text-xs mb-1" style={{ color: "var(--charcoal)" }}>
                        2. 10-km Radial Optimization Search
                      </div>
                      The algorithm inspects all satellite sub-mandis and rural procurement yards within a strict 10-km geodesic radius that possess remaining government MSP quota:
                      <ul className="list-disc list-inside mt-1 space-y-0.5" style={{ color: "var(--charcoal-60)" }}>
                        <li><strong>Ichhawar Sub-Mandi:</strong> 7.2 km — 420 MT open quota</li>
                        <li><strong>Bilkisganj Rural Yard:</strong> 9.4 km — 650 MT open quota</li>
                        <li><strong>Phanda Logistics Yard:</strong> 9.8 km — 510 MT open quota</li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
                      <div className="font-semibold text-xs mb-1" style={{ color: "var(--charcoal)" }}>
                        3. Integrated Transit Fuel Subsidy
                      </div>
                      Farmers accepting the auto-reroute pass are automatically granted a <strong>₹3.50/km-quintal</strong> transit allowance credit directly onto their electronic J-Form, neutralizing extra transport cost.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setClusterRebalanced(!clusterRebalanced);
                        playChime();
                      }}
                      className="ks-btn w-full py-2.5 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                      style={{
                        background: clusterRebalanced ? "#334155" : "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                      }}
                    >
                      {clusterRebalanced ? (
                        <>
                          <RotateCcw size={14} /> Revert To Unbalanced State
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} /> Execute 10-km Cluster Auto-Reroute
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Live Telemetry Card */}
                <div className="ks-card p-4 rounded-xl" style={{ background: "var(--green-bg)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={16} style={{ color: "var(--green-deep)" }} />
                    <span className="font-bold text-xs" style={{ color: "var(--green-deep)" }}>
                      Smart SMS &amp; WhatsApp Dispatch
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--green-deep)" }}>
                    {clusterRebalanced
                      ? "34 reroute SMS passes delivered to tractor drivers in Hindi. Average turnaround reduced from 4.8 hrs to 1.1 hrs."
                      : "Ready to broadcast priority pass notifications with Google Maps turn-by-turn routing to 34 queued vehicles."}
                  </p>
                </div>
              </div>
            </div>

            {/* 12-MANDI LIVE INFRASTRUCTURE REGISTER TABLE */}
            <div className="ks-card p-5 rounded-2xl" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-base">12-Mandi Live Operational Register</h3>
                  <p className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                    Real-time telemetry, queue depth, yard capacity, and open government MSP procurement quota.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--cream-2)" }}>
                  {[
                    { id: "all", label: `All Mandis (${centreList.length})` },
                    { id: "10km", label: "10-km Radial Mesh (6)" },
                    { id: "regional", label: "Regional Hubs (6)" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setMandiFilter(tab.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                      style={{
                        background: mandiFilter === tab.id ? "#fff" : "transparent",
                        color: mandiFilter === tab.id ? "var(--green-deep)" : "var(--charcoal-60)",
                        boxShadow: mandiFilter === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="ks-table w-full text-left">
                  <thead>
                    <tr className="text-xs" style={{ color: "var(--charcoal-60)", borderBottom: "1.5px solid var(--border)" }}>
                      <th className="py-2.5 px-3">Mandi / Yard Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Radius from Hub</th>
                      <th className="py-2.5 px-3">Truck Influx (Queue)</th>
                      <th className="py-2.5 px-3">Yard Capacity</th>
                      <th className="py-2.5 px-3">Open MSP Quota</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Mesh Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {centreList
                      .filter((c) => {
                        const dist = c.distanceKm ?? c.distance_km ?? 0;
                        const is10k = c.inCluster10km ?? (dist <= 12.0);
                        if (mandiFilter === "10km") return is10k;
                        if (mandiFilter === "regional") return !is10k;
                        return true;
                      })
                      .map((c) => {
                        const dist = c.distanceKm ?? c.distance_km ?? 0;
                        const quota = c.openQuotaMT ?? c.open_quota_mt ?? 0;
                        return (
                        <tr key={c.name} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold" style={{ color: "var(--charcoal)" }}>{c.name}</div>
                            <div className="text-[11px]" style={{ color: "var(--charcoal-60)" }}>{c.name_hi || "उपार्जन केंद्र"}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: c.type === "Main Hub" || c.type === "Mega Hub" ? "rgba(30, 58, 138, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                color: c.type === "Main Hub" || c.type === "Mega Hub" ? "#1e3a8a" : "var(--green-deep)",
                              }}
                            >
                              {c.type || "Sub-Mandi"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {dist === 0 ? (
                              <span className="font-bold text-emerald-700">0.0 km (Origin Hub)</span>
                            ) : dist <= 10.0 ? (
                              <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {dist} km (≤ 10 km)
                              </span>
                            ) : dist <= 15.0 ? (
                              <span className="text-slate-600">{dist} km (Cluster Fringe)</span>
                            ) : (
                              <span className="text-slate-400">{dist} km (Inter-District)</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-sm">{c.queue}</span>
                            <span className="text-[11px] text-slate-500 ml-1">trucks</span>
                          </td>
                          <td className="py-3 px-3" style={{ minWidth: 140 }}>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span>{c.capacity}%</span>
                              <span style={{ color: "var(--charcoal-60)" }}>{c.capacity > 85 ? "Full" : c.capacity > 60 ? "Moderate" : "Light"}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(c.capacity, 100)}%`,
                                  background: c.capacity > 85 ? "var(--red)" : c.capacity > 60 ? "var(--amber)" : "var(--green-fresh)",
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold">
                            {quota === 0 ? (
                              <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                0 MT (Quota Met!)
                              </span>
                            ) : (
                              <span className="text-sky-700 font-mono">
                                {quota.toLocaleString()} MT Open
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                          </td>
                          <td className="py-3 px-3">
                            {c.name.includes("Sehore") ? (
                              clusterRebalanced ? (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  34 Trucks Re-routed ✓
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                  Reroute Trigger Active
                                </span>
                              )
                            ) : c.name.includes("Ichhawar") && clusterRebalanced ? (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                +18 Influx Absorbed
                              </span>
                            ) : c.name.includes("Bilkisganj") && clusterRebalanced ? (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                +16 Influx Absorbed
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500">Standard Intake</span>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                  </tbody>
                  </table>
              </div>
            </div>

            {/* TIER-2 SAFETY NET: B2B SURPLUS OFF-RAMP & BHAVANTAR SHIELD */}
            <div className="ks-card p-6 rounded-2xl" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1.5px solid #cbd5e1" }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-purple-700 bg-purple-100 border border-purple-200">
                      Tier-2 Safety Net Architecture
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-emerald-700 bg-emerald-100 border border-emerald-200">
                      Zero Distress Sale Guarantee
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-purple-600" />
                    B2B Surplus Off-Ramp + MP Bhavantar Bhugtan Shield
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Addressing the Evaluator Dilemma: <em>"What happens when the government quota for a high-priority crop (Soybean) is 100% full, but Wheat demand is still open?"</em>
                  </p>
                </div>

                <div className="text-right hidden md:block">
                  <div className="text-xs font-semibold text-slate-500">Benchmark MSP (Soybean 2026)</div>
                  <div className="text-xl font-extrabold text-emerald-700 font-mono">₹4,892 / Quintal</div>
                </div>
              </div>

              {/* Explanatory 3-Step Flow */}
              <div className="grid md:grid-cols-3 gap-4 my-5">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-2">1</div>
                  <h4 className="font-bold text-xs text-slate-900 mb-1">The Quota Ceiling Dilemma</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Government Mandis operate under finite procurement budgets. Once the district target (e.g. 41,060 MT of Soybean) is fulfilled, mandis <strong>legally cannot purchase more Soybean</strong> and must shift physical weighbridge lanes to crops below quota (Wheat).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">2</div>
                  <h4 className="font-bold text-xs text-slate-900 mb-1">Tier-1: 10-km Mesh Rerouting</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    KisanSetu first diverts incoming tractor loads to satellite sub-mandis within 10 km (Ichhawar, Bilkisganj) that still retain open government quota, backed by instant digital transit passes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-purple-300 shadow-sm" style={{ background: "rgba(147, 51, 234, 0.03)" }}>
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center mb-2">3</div>
                  <h4 className="font-bold text-xs text-purple-900 mb-1">Tier-2: B2B Bhavantar Off-Ramp</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    When the entire regional cluster is 100% full, the platform activates verified commercial agro-processors (Adani Wilmar, ITC e-Choupal). If market bids fall below MSP, <strong>State DBT pays the deficit directly to the farmer</strong>.
                  </p>
                </div>
              </div>

              {/* Real-Time B2B Surplus Off-Ramp Simulation Table */}
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Landmark size={14} className="text-slate-600" />
                    Live Commercial Buyer Bids with Bhavantar DBT Protection
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    100% MSP Realization Guaranteed to Farmer
                  </span>
                </div>

                <table className="ks-table w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3">Corporate Industrial Buyer</th>
                      <th className="py-2.5 px-3">Crop / Lot Size</th>
                      <th className="py-2.5 px-3">Commercial Bid</th>
                      <th className="py-2.5 px-3">Govt MSP Baseline</th>
                      <th className="py-2.5 px-3">Bhavantar DBT Shield</th>
                      <th className="py-2.5 px-3">Net Farmer Earnings</th>
                      <th className="py-2.5 px-3">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">ITC e-Choupal Integrated Hub</div>
                        <div className="text-[11px] text-slate-500">Sehore Industrial Area (6.4 km)</div>
                      </td>
                      <td className="py-3 px-3">Soybean · 45 Quintals</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">₹4,720 / Qtl</td>
                      <td className="py-3 px-3 font-semibold text-slate-500">₹4,892 / Qtl</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          +₹172 / Qtl (Govt DBT)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700 text-sm">
                        ₹4,892 / Qtl
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Verified &amp; Escrow Locked
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">Adani Wilmar Solvent Extraction</div>
                        <div className="text-[11px] text-slate-500">Pithampur Processing Terminal</div>
                      </td>
                      <td className="py-3 px-3">Soybean · 60 Quintals</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">₹4,650 / Qtl</td>
                      <td className="py-3 px-3 font-semibold text-slate-500">₹4,892 / Qtl</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          +₹242 / Qtl (Govt DBT)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700 text-sm">
                        ₹4,892 / Qtl
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Verified &amp; Escrow Locked
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">Kriti Nutrients Agro Complex</div>
                        <div className="text-[11px] text-slate-500">Dewas Food Park (45 km)</div>
                      </td>
                      <td className="py-3 px-3">Soybean · 35 Quintals</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">₹4,760 / Qtl</td>
                      <td className="py-3 px-3 font-semibold text-slate-500">₹4,892 / Qtl</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          +₹132 / Qtl (Govt DBT)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700 text-sm">
                        ₹4,892 / Qtl
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Bidding Open
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Info size={14} className="text-slate-400" />
                  Regulated under MP Bhavantar Bhugtan Yojana Rules &amp; Section 12-A of APMC Act.
                </span>
                <span className="font-semibold text-purple-700">
                  Zero distress sales · Complete fiscal compliance for Mandi Board
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* APP                                                                  */
/* ------------------------------------------------------------------ */

export default function App() {
  const [role, setRole] = useState("landing");

  // farmer state
  const [lang, setLang] = useState("en");
  const [offline, setOffline] = useState(false);
  const [farmerView, setFarmerView] = useState("dashboard");
  const [ahead, setAhead] = useState(["A-124", "A-125", "A-126"]);
  const [current, setCurrent] = useState("A-123");

  const [latestBooking, setLatestBooking] = useState(null);

  // shared procurement state
  const [procurementDone, setProcurementDone] = useState(false);

  // mandi state
  const [mandiPage, setMandiPage] = useState("desk"); // "desk" | "process"
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // admin state
  const [adminPage, setAdminPage] = useState("overview");
  const [allocationApplied, setAllocationApplied] = useState(false);

  const completedCount = procurementDone ? 8924 : 8923;

  let content;
  if (role === "landing") {
    content = <Landing goFarmer={() => setRole("farmer")} goMandi={() => setRole("mandi")} goAdmin={() => setRole("admin")} />;
  } else if (role === "farmer") {
    let inner;
    if (farmerView === "dashboard") inner = <FarmerDashboard lang={lang} setView={setFarmerView} procurementDone={procurementDone} setProcurementDone={setProcurementDone} />;
    else if (farmerView === "book") inner = <BookSlot lang={lang} onConfirmed={(bk) => { if (bk) setLatestBooking(bk); setFarmerView("confirm"); }} onSwitchToIVR={() => setFarmerView("ivr")} />;
    else if (farmerView === "confirm") inner = <Confirmation booking={latestBooking} setView={setFarmerView} lang={lang} />;
    else if (farmerView === "queue") inner = <LiveQueue ahead={ahead} setAhead={setAhead} current={current} setCurrent={setCurrent} activeBooking={latestBooking} />;
    else if (farmerView === "ivr") inner = <IVRSimulator onSwitchToWeb={() => setFarmerView("book")} />;
    else inner = <ProcurementStatusPage done={procurementDone} />;

    content = (
      <FarmerChrome lang={lang} setLang={setLang} offline={offline} setOffline={setOffline} view={farmerView} setView={setFarmerView}>
        {inner}
      </FarmerChrome>
    );
  } else if (role === "mandi") {
    content =
      mandiPage === "desk" ? (
        <MandiDashboard
          onOpenFarmer={(f) => {
            setSelectedFarmer(f);
            setMandiPage("process");
          }}
          completed={procurementDone ? 83 : 82}
          currentToken={current}
          onTokenChange={(newTok) => {
            setCurrent(newTok);
            setAhead((prevAhead) => prevAhead.filter((tok) => tok !== newTok));
          }}
        />
      ) : (
        <ProcessFarmer
          farmer={selectedFarmer}
          onBack={() => setMandiPage("desk")}
          onComplete={() => {
            setProcurementDone(true);
            setMandiPage("desk");
          }}
          done={procurementDone}
        />
      );
  } else {
    content = (
      <AdminDashboard
        page={adminPage}
        setPage={setAdminPage}
        completed={completedCount}
        allocationApplied={allocationApplied}
        applyAllocation={() => setAllocationApplied(true)}
      />
    );
  }

  return (
    <div>
      {content}
      <DemoSwitcher role={role} setRole={setRole} />
    </div>
  );
}

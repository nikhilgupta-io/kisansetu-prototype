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
  Volume2, FileSpreadsheet, Zap, Info,
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
  { name: "Sehore",  queue: 18, capacity: 82, status: "Busy",     x: 27, y: 56 },
  { name: "Vidisha", queue: 42, capacity: 97, status: "Critical", x: 70, y: 34 },
  { name: "Bhopal",  queue: 7,  capacity: 61, status: "Normal",   x: 50, y: 50 },
  { name: "Raisen",  queue: 11, capacity: 70, status: "Normal",   x: 66, y: 66 },
  { name: "Ujjain",  queue: 5,  capacity: 48, status: "Normal",   x: 16, y: 78 },
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

  const centres = [
    { id: 1, name: "Sehore Procurement Centre", name_hi: "सीहोर खरीद केंद्र" },
    { id: 2, name: "Vidisha Procurement Centre", name_hi: "विदिशा खरीद केंद्र" },
    { id: 3, name: "Bhopal Procurement Centre", name_hi: "भोपाल खरीद केंद्र" },
    { id: 4, name: "Raisen Procurement Centre", name_hi: "रायसेन खरीद केंद्र" },
    { id: 5, name: "Ujjain Procurement Centre", name_hi: "उज्जैन खरीद केंद्र" },
  ];

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

  const slotsToShow = apiSlots || SLOTS.map((s) => ({
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

    onConfirmed({
      token: result?.booking?.token || (chosenCrop === "Soybean" ? "A-128" : "A-127"),
      slotTime: slotObj?.display_time || slotObj?.time || "10:30 AM – 11:30 AM",
      slotDate: chosenDate,
      centreName: centreObj ? (lang === "hi" ? centreObj.name_hi : centreObj.name) : "Sehore Procurement Centre",
      crop: lang === "hi" ? selectedCropMeta.name_hi : selectedCropMeta.name,
      cropName: chosenCrop,
      isPerishable: isPerishable,
      perishabilityScore: selectedCropMeta?.score || (chosenCrop === "Soybean" ? 3 : 1),
    });
  };

  return (
    <div>
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
            <div className="p-3 rounded-xl mb-4 flex items-start gap-2" style={{ background: "var(--red-bg)", border: "1px solid #F5C6CB" }}>
              <AlertTriangle size={16} style={{ color: "var(--red)", marginTop: 2, flexShrink: 0 }} />
              <div className="text-xs" style={{ color: "#7A1C24" }}>
                <strong>{lang === "hi" ? "उच्च फसल नुकसान जोखिम:" : "High Perishability Priority Active:"}</strong>{" "}
                {lang === "hi"
                  ? `${selectedCropMeta.name_hi} के लिए इंजन सबसे सुबह का स्लॉट प्राथमिकता पर आवंटित करेगा ताकि उपज खराब न हो।`
                  : `${selectedCropMeta.name} is prioritized for earliest morning slots to minimize post-harvest loss.`}
              </div>
            </div>
          )}

          {/* Centre Selector */}
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--charcoal-60)" }}>
            {lang === "hi" ? "निकटतम खरीद केंद्र चुनें:" : "Choose Procurement Centre:"}
          </label>
          <select
            value={chosenCentre}
            onChange={(e) => setChosenCentre(Number(e.target.value))}
            className="w-full p-2.5 rounded-xl text-sm mb-4 border"
            style={{ borderColor: "var(--border)", background: "#fff" }}
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === "hi" ? c.name_hi : c.name}
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
    const result = await advanceQueue(1);
    if (result && result.success) {
      if (result.current_token) setCurrent(result.current_token);
      fetchQueue();
    } else {
      // Fallback: local simulation
      setCurrent((c) => `A-${parseInt(c.split("-")[1] || "123") + 1}`);
      setAhead((a) => a.slice(1));
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
      const res = await advanceQueue(1);
      const nextToken = res?.current_token || (upcoming.length > 0 ? upcoming[0].token : null);
      if (nextToken) {
        playChime();
        speakVernacular(`टोकन नंबर ${nextToken}, कृपया काउंटर नंबर 1 पर आएं।`, "hi");
        if (onTokenChange) onTokenChange(nextToken);
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
                await resetQueue(1);
                setMandiNotice("Queue reset to clean demo baseline (Pos 1: Wheat processing, Pos 2: Soybean, Pos 3: Paddy, Pos 4-6: Wheat).");
                fetchMandi();
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
  const centreList = adminData?.centres || CENTRES.map((c) => ({ ...c, queue: c.queue }));
  const chartData = demandData || (allocationApplied ? DEMAND_FIXED : DEMAND_BASE);
  const links = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "centres", label: "Procurement Centres", icon: MapPinned },
    { id: "allocation", label: "Smart Slot Allocation", icon: Sparkles },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "farmers", label: "Farmers", icon: Users },
    { id: "reports", label: "Reports", icon: FileBarChart },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="ks-root min-h-screen flex">
      <aside className="hidden md:flex flex-col w-60 shrink-0 px-4 py-6" style={{ background: "var(--green-deep)" }}>
        <div className="flex items-center gap-2 px-2 mb-8">
          <Wheat size={18} color="#fff" />
          <span className="ks-display font-bold text-white">KisanSetu</span>
        </div>
        {links.map((l) => (
          <div key={l.id} onClick={() => setPage(l.id)} className={`ks-sidebar-link ${page === l.id ? "active" : ""}`}>
            <l.icon size={17} /> {l.label}
          </div>
        ))}
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="ks-display text-2xl font-bold">
              {links.find((l) => l.id === page)?.label}
            </h2>
            <p className="text-sm" style={{ color: "var(--charcoal-60)" }}>Madhya Pradesh region &middot; live overview</p>
          </div>
          <UserCog size={22} style={{ color: "var(--charcoal-60)" }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatTile label="Total Farmers" value={stats.total_farmers.toLocaleString()} icon={Users} />
          <StatTile label="Completed" value={stats.completed.toLocaleString()} icon={CheckCircle2} />
          <StatTile label="Waiting" value={stats.waiting.toLocaleString()} icon={Clock} />
          <StatTile label="Delayed" value={stats.delayed.toLocaleString()} icon={AlertTriangle} />
        </div>

        {(page === "overview" || page === "centres") && (
          <div className="grid md:grid-cols-5 gap-5 mb-6">
            <div className="ks-card p-5 md:col-span-3">
              <h3 className="font-semibold text-sm mb-3">Procurement centres</h3>
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

            <div className="ks-card p-5 md:col-span-2">
              <h3 className="font-semibold text-sm mb-3">Region map</h3>
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
        )}

        {page === "allocation" && (
          <div className="space-y-5">
            <div className="ks-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} style={{ color: "var(--green-deep)" }} />
                <h3 className="font-semibold text-sm">Expected demand vs. available capacity</h3>
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
                <button onClick={async () => {
                  const imb = imbalanceData?.imbalances?.[0];
                  if (imb) {
                    await applyAllocationAction(imb.centre_id, imb.target_centre_id, imb.move_count, "2026-09-12");
                  }
                  applyAllocation();
                }} className="ks-btn ks-btn-primary px-5 py-2.5 text-sm">Apply Recommendation</button>
              </div>
            ) : (
              <div className="ks-card p-4 flex items-center gap-2" style={{ background: "var(--green-bg)", border: "none" }}>
                <CheckCircle2 size={18} style={{ color: "var(--green-deep)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--green-deep)" }}>Slot allocation updated successfully.</span>
              </div>
            )}
          </div>
        )}

        {page === "reports" && <ReportModal isModal={false} />}

        {["analytics", "farmers", "alerts", "settings"].includes(page) && (
          <div className="ks-card p-10 text-center text-sm" style={{ color: "var(--charcoal-60)" }}>
            {links.find((l) => l.id === page)?.label} view &mdash; out of scope for this prototype pass.
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

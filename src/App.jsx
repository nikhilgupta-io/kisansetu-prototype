import { useState } from "react";
import {
  Wheat, Clock, CheckCircle2, Circle,
  ArrowRight, Users, TrendingUp, AlertTriangle, Wifi, WifiOff,
  Globe, Home as HomeIcon, BarChart3, Settings, Bell, Search,
  ScanLine, ClipboardList, ChevronRight, Download, CalendarPlus,
  UserCog, LayoutGrid, MapPinned, FileBarChart, ListChecks,
  PhoneCall, IndianRupee, Sparkles, RotateCcw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

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

      <section className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-5 pb-16">
        {[
          { icon: Clock, title: "Reduced Waiting Time", body: "Live tokens and queue estimates replace guesswork at the gate." },
          { icon: MapPinned, title: "Smart Slot Allocation", body: "Demand-aware recommendations balance load across centres." },
          { icon: FileBarChart, title: "Transparent Procurement", body: "Every stage \u2014 booking to payment \u2014 stays visible to the farmer." },
        ].map((f) => (
          <div key={f.title} className="ks-card p-6">
            <div className="flex items-center justify-center rounded-full mb-4" style={{ width: 42, height: 42, background: "var(--green-bg)" }}>
              <f.icon size={20} style={{ color: "var(--green-deep)" }} />
            </div>
            <div className="font-semibold mb-1.5">{f.title}</div>
            <div className="text-sm" style={{ color: "var(--charcoal-60)", lineHeight: 1.6 }}>{f.body}</div>
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
    { id: "queue", icon: ListChecks, label: t.queue },
    { id: "statusPage", icon: ClipboardList, label: t.status },
  ];
  return (
    <div className="ks-root min-h-screen pb-24 md:pb-6">
      <header className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "#fff" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: "var(--green-deep)" }}>
            <Wheat size={15} color="#fff" />
          </div>
          <span className="ks-display font-bold">KisanSetu</span>
        </div>
        <div className="flex items-center gap-3">
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
          <WifiOff size={13} /> Offline mode active &middot; changes will sync automatically &middot; Pending sync: 1
        </div>
      )}

      <main className="max-w-md mx-auto px-4 py-5">{children}</main>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2.5"
        style={{ background: "#fff", borderTop: "1px solid var(--border)" }}
      >
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className="flex flex-col items-center gap-1 text-xs px-4 py-1"
            style={{ color: view === n.id ? "var(--green-deep)" : "var(--charcoal-60)" }}
          >
            <n.icon size={20} />
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — dashboard                                                   */
/* ------------------------------------------------------------------ */

function FarmerDashboard({ lang, setView, procurementDone }) {
  const t = T[lang];
  return (
    <div>
      <h2 className="ks-display text-xl font-bold mb-4">{t.greeting}</h2>

      <div className="ks-card p-5 mb-4" style={{ background: "var(--green-deep)", border: "none", color: "#fff" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: "#CFE3D5" }}>{t.nextProcurement}</span>
          <Badge tone="green" icon={CheckCircle2}>{t.slotConfirmed}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <div style={{ color: "#9FC2AA" }}>Date</div>
            <div className="font-semibold">{FARMER.slotDate}</div>
          </div>
          <div>
            <div style={{ color: "#9FC2AA" }}>Time</div>
            <div className="font-semibold">{FARMER.slotTime.split(" \u2013 ")[0]}</div>
          </div>
          <div className="col-span-2">
            <div style={{ color: "#9FC2AA" }}>Centre</div>
            <div className="font-semibold">{FARMER.centre[lang]}</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div>
            <div className="text-xs" style={{ color: "#9FC2AA" }}>Token</div>
            <div className="ks-display text-2xl font-bold">{FARMER.token}</div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: "#9FC2AA" }}>Est. waiting</div>
            <div className="font-semibold">15\u201320 min</div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setView("queue")} className="ks-btn text-sm px-4 py-2 flex-1" style={{ background: "#fff", color: "var(--green-deep)" }}>
            {t.viewQueue}
          </button>
          <button onClick={() => setView("statusPage")} className="ks-btn text-sm px-4 py-2 flex-1" style={{ background: "rgba(255,255,255,0.14)", color: "#fff" }}>
            {t.viewStatus}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 ks-card p-3.5 mb-5" style={{ background: "var(--blue-bg)", border: "none" }}>
        <Bell size={16} style={{ color: "var(--blue)", marginTop: 2 }} />
        <p className="text-sm" style={{ color: "var(--blue)" }}>
          {procurementDone
            ? "Procurement completed successfully. Payment has been initiated."
            : T[lang].arriveNote}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: CalendarPlus, label: t.bookSlot, action: () => setView("book") },
          { icon: ListChecks, label: t.myQueue, action: () => setView("queue") },
          { icon: ClipboardList, label: t.procurementStatus, action: () => setView("statusPage") },
          { icon: IndianRupee, label: t.paymentDetails, action: () => setView("statusPage") },
        ].map((a) => (
          <button key={a.label} onClick={a.action} className="ks-card ks-quick-action p-4 text-left flex flex-col gap-3">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "var(--green-bg)" }}>
              <a.icon size={18} style={{ color: "var(--green-deep)" }} />
            </div>
            <span className="text-sm font-semibold">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — book slot                                                   */
/* ------------------------------------------------------------------ */

function BookSlot({ onConfirmed }) {
  const [step, setStep] = useState(1);
  const [chosen, setChosen] = useState(null);

  const steps = ["Details", "Select Slot", "Confirm"];

  const tagStyle = (tag) => {
    if (tag === "full") return { tone: "red", dot: "ks-dot-red", label: "Full" };
    if (tag === "limited") return { tone: "amber", dot: "ks-dot-amber", label: "Limited" };
    return { tone: "green", dot: "ks-dot-green", label: "Available" };
  };

  return (
    <div>
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

      {step === 1 && (
        <div className="ks-card p-5">
          <h3 className="font-semibold mb-4">Booking details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span style={{ color: "var(--charcoal-60)" }}>Crop</span><span className="font-medium">{FARMER.crop.en}</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--charcoal-60)" }}>Procurement Centre</span><span className="font-medium">{FARMER.centre.en}</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--charcoal-60)" }}>Date</span><span className="font-medium">{FARMER.slotDate}</span></div>
          </div>
          <button onClick={() => setStep(2)} className="ks-btn ks-btn-primary w-full py-3 mt-5">Continue</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="ks-card p-4 mb-3" style={{ borderColor: "var(--green-deep)", borderWidth: 1.5 }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={14} style={{ color: "var(--green-deep)" }} />
              <span className="text-xs font-bold uppercase" style={{ color: "var(--green-deep)", letterSpacing: 0.3 }}>Recommended for you</span>
            </div>
            <div className="font-semibold text-lg mb-1">10:30 AM \u2013 11:30 AM</div>
            <p className="text-xs mb-3" style={{ color: "var(--charcoal-60)" }}>
              Expected waiting time ~15 minutes. Based on current queue and centre capacity.
            </p>
            <button
              onClick={() => { setChosen("s3"); setStep(3); }}
              className="ks-btn ks-btn-primary w-full py-2.5 text-sm">
            
              Select Recommended Slot
            </button>
          </div>

          <p className="text-xs font-medium mb-2" style={{ color: "var(--charcoal-60)" }}>Other available slots</p>
          <div className="space-y-2">
            {SLOTS.filter((s) => s.id !== "s3").map((s) => {
              const st = tagStyle(s.tag);
              return (
                <button
                  key={s.id}
                  disabled={s.tag === "full"}
                  onClick={() => { setChosen(s.id); setStep(3); }}
                  className="ks-card w-full p-3.5 flex items-center justify-between text-left"
                  style={s.tag === "full" ? { opacity: 0.55, cursor: "not-allowed" } : {}}
                >
                  <div>
                    <div className="font-medium text-sm">{s.time}</div>
                    <div className="text-xs" style={{ color: "var(--charcoal-60)" }}>
                      {s.tag === "full" ? "Full" : `${s.left} slots available`}
                    </div>
                  </div>
                  <span className={`inline-block rounded-full ${st.dot}`} style={{ width: 10, height: 10 }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="ks-card p-5 text-center">
          <div className="flex items-center justify-center rounded-full mx-auto mb-4" style={{ width: 52, height: 52, background: "var(--green-bg)" }}>
            <CheckCircle2 size={26} style={{ color: "var(--green-deep)" }} />
          </div>
          <h3 className="font-semibold mb-1">Confirm your slot</h3>
          <p className="text-sm mb-4" style={{ color: "var(--charcoal-60)" }}>
            {chosen === "s3" ? "10:30 AM \u2013 11:30 AM (Recommended)" : SLOTS.find((s) => s.id === chosen)?.time}
            {" "}&middot; {FARMER.centre.en}
          </p>
          <button onClick={onConfirmed} className="ks-btn ks-btn-primary w-full py-3">Confirm Booking</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — confirmation ticket                                         */
/* ------------------------------------------------------------------ */

function Confirmation({ setView }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center rounded-full mx-auto mb-4" style={{ width: 60, height: 60, background: "var(--green-bg)" }}>
        <CheckCircle2 size={30} style={{ color: "var(--green-deep)" }} />
      </div>
      <h2 className="ks-display text-xl font-bold mb-1">Slot Confirmed!</h2>
      <p className="text-sm mb-5" style={{ color: "var(--charcoal-60)" }}>{FARMER.centre.en}</p>

      <div className="ks-card p-5 mb-4">
        <div className="text-sm mb-4" style={{ color: "var(--charcoal-60)" }}>
          {FARMER.slotDate} &middot; {FARMER.slotTime}
        </div>
        <div className="ks-display font-bold mb-4" style={{ fontSize: "40px", color: "var(--green-deep)" }}>{FARMER.token}</div>
        <div className="qr-mock">
          {Array.from({ length: 36 }).map((_, i) => (
            <span key={i} style={{ background: (i * 7) % 3 === 0 ? "var(--charcoal)" : "transparent" }} />
          ))}
        </div>
        <Badge tone="green" icon={Clock}>Expected wait: 15\u201320 min</Badge>
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={() => setView("queue")} className="ks-btn ks-btn-primary py-3">View Live Queue</button>
        <div className="flex gap-2">
          <button className="ks-btn ks-btn-outline flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5"><Download size={14} /> Download</button>
          <button className="ks-btn ks-btn-outline flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5"><CalendarPlus size={14} /> Add to Calendar</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FARMER — live queue                                                  */
/* ------------------------------------------------------------------ */

function LiveQueue({ ahead, setAhead, current, setCurrent }) {
  const list = [
    ...ahead.map((tok) => ({ tok, you: false })),
    { tok: FARMER.token, you: true },
    { tok: "A-128", you: false },
    { tok: "A-129", you: false },
  ];

  const advance = () => {
    if (ahead.length === 0) return;
    setCurrent((c) => `A-${parseInt(c.split("-")[1]) + 1}`);
    setAhead((a) => a.slice(1));
  };

  return (
    <div>
      <h2 className="ks-display text-xl font-bold mb-1">Live Queue</h2>
      <p className="text-sm mb-4" style={{ color: "var(--charcoal-60)" }}>{FARMER.centre.en}</p>

      <div className="ks-card p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs" style={{ color: "var(--charcoal-60)" }}>Current token</div>
          <div className="ks-display text-2xl font-bold">{current}</div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: "var(--charcoal-60)" }}>Your token</div>
          <div className="ks-display text-2xl font-bold" style={{ color: "var(--green-deep)" }}>{FARMER.token}</div>
        </div>
      </div>

      <div className="ks-card p-4 mb-4 text-center">
        <div className="ks-display text-3xl font-bold mb-1">{ahead.length}</div>
        <div className="text-sm mb-3" style={{ color: "var(--charcoal-60)" }}>
          farmer{ahead.length === 1 ? "" : "s"} ahead of you
        </div>
        <div className="ks-progress-track mb-3" style={{ height: 8 }}>
          <div className="ks-progress-fill h-full" style={{ width: `${100 - ahead.length * 16}%` }} />
        </div>
        <Badge tone={ahead.length === 0 ? "green" : "green"} icon={TrendingUp}>
          {ahead.length === 0 ? "It's your turn" : `Est. wait: ${ahead.length * 4} min \u00b7 Queue moving normally`}
        </Badge>
      </div>

      <div className="space-y-1.5 mb-4">
        {list.map((r) => (
          <div
            key={r.tok}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm"
            style={r.you ? { background: "var(--green-deep)", color: "#fff" } : { background: "#fff", border: "1px solid var(--border)" }}
          >
            <span className="font-medium">{r.tok}</span>
            <span className={r.you ? "font-semibold" : ""} style={!r.you ? { color: "var(--charcoal-60)" } : {}}>
              {r.you ? "YOU" : "Waiting"}
            </span>
          </div>
        ))}
      </div>

      <button onClick={advance} disabled={ahead.length === 0} className="ks-btn ks-btn-primary w-full py-3 flex items-center justify-center gap-2" style={ahead.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
        <RotateCcw size={15} /> Simulate Next Farmer
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

function MandiDashboard({ onOpenFarmer, completed, currentToken }) {
  const upcoming = [
    { tok: "A-127", time: "10:30 AM", crop: "Wheat" },
    { tok: "A-128", time: "10:30 AM", crop: "Wheat" },
    { tok: "A-129", time: "11:00 AM", crop: "Paddy" },
    { tok: "A-130", time: "11:00 AM", crop: "Wheat" },
    { tok: "A-131", time: "11:00 AM", crop: "Soybean" },
  ];

  return (
    <div className="ks-root min-h-screen flex">
      <aside className="hidden md:flex flex-col w-60 shrink-0 px-4 py-6" style={{ background: "var(--green-deep)" }}>
        <div className="flex items-center gap-2 px-2 mb-8">
          <Wheat size={18} color="#fff" />
          <span className="ks-display font-bold text-white">KisanSetu</span>
        </div>
        <div className="ks-sidebar-link active"><LayoutGrid size={17} /> Queue Desk</div>
        <div className="ks-sidebar-link"><ScanLine size={17} /> Scan QR</div>
        <div className="ks-sidebar-link"><Search size={17} /> Search Farmer</div>
        <div className="ks-sidebar-link"><Settings size={17} /> Settings</div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="ks-display text-2xl font-bold">Sehore Procurement Centre</h2>
            <p className="text-sm" style={{ color: "var(--charcoal-60)" }}>Mandi staff console</p>
          </div>
          <Badge tone="blue" icon={PhoneCall}>IVR fallback active</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatTile label="Total Farmers" value="128" icon={Users} />
          <StatTile label="Waiting" value="34" icon={Clock} />
          <StatTile label="Processing" value="12" icon={ScanLine} />
          <StatTile label="Completed" value={String(completed)} icon={CheckCircle2} />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="ks-card p-6 md:col-span-1 text-center">
            <div className="text-xs font-medium mb-2" style={{ color: "var(--charcoal-60)" }}>Current Token</div>
            <div className="ks-display font-bold mb-4" style={{ fontSize: "44px", color: "var(--green-deep)" }}>{currentToken}</div>
            <button className="ks-btn ks-btn-primary w-full py-3">Call Next Farmer</button>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button className="ks-btn ks-btn-outline text-xs py-2 flex items-center justify-center gap-1"><ScanLine size={13} /> Scan QR</button>
              <button className="ks-btn ks-btn-outline text-xs py-2 flex items-center justify-center gap-1"><Search size={13} /> Search</button>
              <button className="ks-btn ks-btn-outline text-xs py-2">Manual Entry</button>
              <button className="ks-btn ks-btn-outline text-xs py-2" style={{ borderColor: "var(--red)", color: "var(--red)" }}>Mark No Show</button>
            </div>
          </div>

          <div className="ks-card p-5 md:col-span-2">
            <h3 className="font-semibold text-sm mb-3">Upcoming queue</h3>
            <div className="space-y-1.5">
              {upcoming.map((u) => (
                <button
                  key={u.tok}
                  onClick={() => u.tok === "A-127" && onOpenFarmer()}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm"
                  style={{ background: "var(--cream)", cursor: u.tok === "A-127" ? "pointer" : "default" }}
                >
                  <span className="font-semibold">{u.tok}</span>
                  <span style={{ color: "var(--charcoal-60)" }}>{u.time}</span>
                  <span className="flex items-center gap-1"><Wheat size={12} /> {u.crop}</span>
                  {u.tok === "A-127" && <ChevronRight size={15} style={{ color: "var(--green-deep)" }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProcessFarmer({ onBack, onComplete, done }) {
  return (
    <div className="ks-root min-h-screen p-6 md:p-10 max-w-2xl mx-auto">
      <button onClick={onBack} className="text-sm font-medium mb-5 flex items-center gap-1" style={{ color: "var(--charcoal-60)" }}>
        &larr; Back to queue desk
      </button>

      <div className="ks-card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="ks-display text-xl font-bold">Farmer Details</h2>
          <Badge tone={done ? "green" : "blue"}>{done ? "Completed" : "In Progress"}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div style={{ color: "var(--charcoal-60)" }}>Name</div><div className="font-semibold">{FARMER.name.en}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Farmer ID</div><div className="font-semibold">{FARMER.id}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Crop</div><div className="font-semibold">{FARMER.crop.en}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Slot</div><div className="font-semibold">{FARMER.slotTime.split(" \u2013 ")[0]}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Expected Quantity</div><div className="font-semibold">{FARMER.expectedQty}</div></div>
        </div>
      </div>

      <div className="ks-card p-6 mb-5">
        <h3 className="font-semibold mb-4 text-sm">Procurement details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div style={{ color: "var(--charcoal-60)" }}>Actual Weight</div><div className="font-semibold">{FARMER.quantity}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Quality Grade</div><div className="font-semibold">{FARMER.qualityGrade}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Procurement Price</div><div className="font-semibold">{FARMER.rate}</div></div>
          <div><div style={{ color: "var(--charcoal-60)" }}>Total Value</div><div className="font-semibold" style={{ color: "var(--green-deep)" }}>{FARMER.value}</div></div>
        </div>
      </div>

      {done ? (
        <div className="ks-card p-4 flex items-center gap-2" style={{ background: "var(--green-bg)", border: "none" }}>
          <CheckCircle2 size={18} style={{ color: "var(--green-deep)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--green-deep)" }}>Procurement completed &middot; payment initiated.</span>
        </div>
      ) : (
        <button onClick={onComplete} className="ks-btn ks-btn-primary w-full py-3.5">Complete Procurement</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ADMIN                                                                */
/* ------------------------------------------------------------------ */

function AdminDashboard({ page, setPage, completed, allocationApplied, applyAllocation }) {
  const statusTone = { Busy: "amber", Critical: "red", Normal: "green" };
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
          <StatTile label="Total Farmers" value="12,430" icon={Users} />
          <StatTile label="Completed" value={completed.toLocaleString()} icon={CheckCircle2} />
          <StatTile label="Waiting" value="1,284" icon={Clock} />
          <StatTile label="Delayed" value="97" icon={AlertTriangle} />
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
                  {CENTRES.map((c) => (
                    <tr key={c.name}>
                      <td className="font-medium">{c.name}</td>
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
                {CENTRES.map((c) => (
                  <div
                    key={c.name}
                    title={`${c.name} \u00b7 ${c.status}`}
                    className="map-marker"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  >
                    <span
                      className="map-marker-dot"
                      style={{
                        width: c.name === "Bhopal" ? 16 : 12, height: c.name === "Bhopal" ? 16 : 12,
                        background: c.status === "Critical" ? "var(--red)" : c.status === "Busy" ? "var(--amber)" : "var(--green-fresh)",
                      }}
                    />
                    <span className="map-marker-label">{c.name}</span>
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
                  <BarChart data={allocationApplied ? DEMAND_FIXED : DEMAND_BASE}>
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
                  Vidisha Procurement Centre is expected to exceed capacity between 10 AM \u2013 12 PM.
                </p>
                <div className="ks-card p-3.5 mb-4" style={{ border: "none", background: "#fff" }}>
                  <span className="text-xs font-semibold uppercase" style={{ color: "var(--charcoal-60)" }}>Recommended action</span>
                  <p className="text-sm font-medium mt-1">Move 28 appointments from Vidisha &rarr; Bhopal</p>
                </div>
                <button onClick={applyAllocation} className="ks-btn ks-btn-primary px-5 py-2.5 text-sm">Apply Recommendation</button>
              </div>
            ) : (
              <div className="ks-card p-4 flex items-center gap-2" style={{ background: "var(--green-bg)", border: "none" }}>
                <CheckCircle2 size={18} style={{ color: "var(--green-deep)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--green-deep)" }}>Slot allocation updated successfully.</span>
              </div>
            )}
          </div>
        )}

        {["analytics", "farmers", "reports", "alerts", "settings"].includes(page) && (
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

  // shared procurement state
  const [procurementDone, setProcurementDone] = useState(false);

  // mandi state
  const [mandiPage, setMandiPage] = useState("desk"); // "desk" | "process"

  // admin state
  const [adminPage, setAdminPage] = useState("overview");
  const [allocationApplied, setAllocationApplied] = useState(false);

  const completedCount = procurementDone ? 8924 : 8923;

  let content;
  if (role === "landing") {
    content = <Landing goFarmer={() => setRole("farmer")} goMandi={() => setRole("mandi")} goAdmin={() => setRole("admin")} />;
  } else if (role === "farmer") {
    let inner;
    if (farmerView === "dashboard") inner = <FarmerDashboard lang={lang} setView={setFarmerView} procurementDone={procurementDone} />;
    else if (farmerView === "book") inner = <BookSlot onConfirmed={() => setFarmerView("confirm")} />;
    else if (farmerView === "confirm") inner = <Confirmation setView={setFarmerView} />;
    else if (farmerView === "queue") inner = <LiveQueue ahead={ahead} setAhead={setAhead} current={current} setCurrent={setCurrent} />;
    else inner = <ProcurementStatusPage done={procurementDone} />;

    content = (
      <FarmerChrome lang={lang} setLang={setLang} offline={offline} setOffline={setOffline} view={farmerView} setView={setFarmerView}>
        {inner}
      </FarmerChrome>
    );
  } else if (role === "mandi") {
    content =
      mandiPage === "desk" ? (
        <MandiDashboard onOpenFarmer={() => setMandiPage("process")} completed={procurementDone ? 83 : 82} currentToken={current} />
      ) : (
        <ProcessFarmer
          onBack={() => setMandiPage("desk")}
          onComplete={() => setProcurementDone(true)}
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

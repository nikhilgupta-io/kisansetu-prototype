import { useState } from "react";
import { Phone, PhoneOff, MessageSquare } from "lucide-react";

const API = "/api";

export default function IVRSimulator({ onSwitchToWeb }) {
  const [callActive, setCallActive] = useState(false);
  const [step, setStep] = useState("welcome");
  const [inputBuffer, setInputBuffer] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [cropChoice, setCropChoice] = useState("");
  const [centreId, setCentreId] = useState(0);
  const [history, setHistory] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [booking, setBooking] = useState(null);
  const [smsReceived, setSmsReceived] = useState(null);
  const [loading, setLoading] = useState(false);

  const startCall = async () => {
    setCallActive(true);
    setHistory([]);
    setInputBuffer("");
    setBooking(null);
    setSmsReceived(null);
    setStep("welcome");
    setFarmerId("");
    setCropChoice("");
    setCentreId(0);
    await sendStep("welcome", "");
  };

  const endCall = () => {
    setCallActive(false);
    setCurrentPrompt(null);
    setStep("welcome");
    setInputBuffer("");
  };

  const sendStep = async (currentStep, input, fid, crop, cid) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ivr/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "demo-session",
          step: currentStep,
          input: input || "",
          farmer_id: fid || farmerId,
          crop_choice: crop || cropChoice,
          centre_id: cid || centreId,
        }),
      });
      const data = await res.json();
      setCurrentPrompt(data);
      setHistory((h) => [...h, { step: currentStep, input, response: data }]);

      // Update state from response
      if (data.farmer_id) setFarmerId(data.farmer_id);
      if (data.crop_choice) setCropChoice(data.crop_choice);
      if (data.centre_id) setCentreId(data.centre_id);
      if (data.next_step) setStep(data.next_step);
      if (data.booking) {
        setBooking(data.booking);
        setSmsReceived({
          token: data.booking.token,
          time: data.booking.slot_time,
        });
      }
      if (data.next_step === "end") {
        // Auto end call after 5 seconds
        setTimeout(() => setCallActive(false), 5000);
      }
    } catch {
      setCurrentPrompt({ prompt_en: "Network error. Please try again.", prompt_hi: "नेटवर्क त्रुटि।" });
    }
    setLoading(false);
  };

  const pressKey = (key) => {
    if (!callActive) return;

    if (step === "enter_farmer_id") {
      if (key === "#") {
        // Submit the farmer ID
        sendStep("verify_farmer", inputBuffer + "#");
        setInputBuffer("");
      } else {
        setInputBuffer((b) => b + key);
      }
    } else if (step === "welcome" || step === "enter_farmer_id") {
      sendStep(step, key);
    } else {
      sendStep(step, key, farmerId, cropChoice, centreId);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

  return (
    <div style={{ maxWidth: 340, margin: "0 auto" }}>
      {/* Switch to Smartphone Web App banner */}
      {onSwitchToWeb && (
        <div
          style={{
            background: "#EBF6EE",
            border: "1px solid #CFE3D5",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#1B4D3E",
          }}
        >
          <span>Have a smartphone?</span>
          <button
            onClick={onSwitchToWeb}
            style={{
              background: "#1B4D3E",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "5px 12px",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Online Booking →
          </button>
        </div>
      )}
      {/* Phone Body */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: 28,
          padding: "16px 12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Screen */}
        <div
          style={{
            background: callActive ? "#0f3460" : "#16213e",
            borderRadius: 16,
            padding: 16,
            minHeight: 180,
            marginBottom: 12,
            color: "#e0e0e0",
            fontSize: 13,
            lineHeight: 1.6,
            position: "relative",
          }}
        >
          {!callActive && !booking && (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <Phone size={32} style={{ color: "#4ecca3", marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 15 }}>KisanSetu IVR</div>
              <div style={{ color: "#8a8a9a", fontSize: 12, marginTop: 4 }}>Press Call to start booking</div>
            </div>
          )}

          {callActive && currentPrompt && (
            <div>
              <div style={{ color: "#4ecca3", fontWeight: 600, fontSize: 11, marginBottom: 6 }}>
                📞 CALL ACTIVE — Step: {step}
              </div>
              <div style={{ marginBottom: 8 }}>{currentPrompt.prompt_hi}</div>
              <div style={{ color: "#8a8aaa", fontSize: 12 }}>{currentPrompt.prompt_en}</div>

              {/* Show DTMF options */}
              {currentPrompt.options && (
                <div style={{ marginTop: 10, borderTop: "1px solid #2a2a4a", paddingTop: 8 }}>
                  {Object.entries(currentPrompt.options).map(([key, val]) => (
                    <div key={key} style={{ fontSize: 12, color: "#b8b8d0" }}>
                      <span style={{ color: "#4ecca3", fontWeight: 700 }}>{key}</span> → {typeof val === 'object' ? val.name : val}
                    </div>
                  ))}
                </div>
              )}

              {/* Input buffer display */}
              {step === "enter_farmer_id" && inputBuffer && (
                <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700, color: "#4ecca3", letterSpacing: 3 }}>
                  {inputBuffer}_
                </div>
              )}

              {loading && <div style={{ color: "#ffc107", fontSize: 11, marginTop: 6 }}>Processing...</div>}
            </div>
          )}
        </div>

        {/* Keypad */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
            marginBottom: 10,
          }}
        >
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => pressKey(k)}
              disabled={!callActive}
              style={{
                background: callActive ? "#16213e" : "#0d1117",
                border: "1px solid #2a2a4a",
                borderRadius: 12,
                color: callActive ? "#e0e0e0" : "#4a4a5a",
                fontSize: 20,
                fontWeight: 600,
                padding: "12px 0",
                cursor: callActive ? "pointer" : "not-allowed",
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Call / End buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={startCall}
            disabled={callActive}
            style={{
              flex: 1,
              background: callActive ? "#2a2a3a" : "#4ecca3",
              color: callActive ? "#6a6a7a" : "#000",
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              fontWeight: 700,
              fontSize: 14,
              cursor: callActive ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Phone size={16} /> Call
          </button>
          <button
            onClick={endCall}
            disabled={!callActive}
            style={{
              flex: 1,
              background: !callActive ? "#2a2a3a" : "#e74c3c",
              color: !callActive ? "#6a6a7a" : "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              fontWeight: 700,
              fontSize: 14,
              cursor: !callActive ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <PhoneOff size={16} /> End
          </button>
        </div>
      </div>

      {/* SMS Notification Popup */}
      {smsReceived && (
        <div
          style={{
            marginTop: 12,
            background: "#fff",
            border: "1.5px solid #4ecca3",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <MessageSquare size={16} style={{ color: "#4ecca3" }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>SMS Received</span>
          </div>
          <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>
            किसानसेतु: आपका टोकन <strong>{smsReceived.token}</strong> पक्का हुआ।
            समय: <strong>{smsReceived.time}</strong>।
            कृपया 15 मिनट पहले पहुँचें।
          </div>
        </div>
      )}
    </div>
  );
}

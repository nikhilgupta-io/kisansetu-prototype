/**
 * KisanSetu — Audio & Speech Synthesis Helper
 * Provides airport/mandi style announcement chimes and vernacular Text-to-Speech.
 */

export function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const playTone = (freq, start, duration, gainLevel = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(gainLevel, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // 2-tone pleasant mandi yard announcement chime (G4 -> C5)
    playTone(392.0, now, 0.35, 0.22);
    playTone(523.25, now + 0.32, 0.55, 0.25);
  } catch (e) {
    console.warn("Web Audio chime not available:", e);
  }
}

export function speakVernacular(text, lang = "hi") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop previous active voice
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.92; // Slightly measured pace for rural clarity
    utterance.pitch = 1.0;

    // Try finding an Indian Hindi or English voice if installed
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(
      (v) => (lang === "hi" ? v.lang.includes("hi") : v.lang.includes("en-IN") || v.lang.includes("en-GB"))
    );
    if (targetVoice) utterance.voice = targetVoice;

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis error:", e);
  }
}

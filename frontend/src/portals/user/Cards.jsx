import React, { useEffect, useState, useRef } from "react";
import {
  getUserCards,
  registerCard,
  startCardRegistration,
  getRegistrationResult,
  cancelCardRegistration
} from "../../services/api";

const DEVICE_ID = "POS_001"; // must match ESP32 DEVICE_ID

export default function Cards() {
  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);

  // Registration mode: "idle" | "tapping" | "done"
  const [regMode, setRegMode]     = useState("idle");
  const [countdown, setCountdown] = useState(120);

  // Manual entry
  const [showManual, setShowManual]   = useState(false);
  const [cardUID, setCardUID]         = useState("");
  const [registering, setRegistering] = useState(false);

  const pollRef      = useRef(null);
  const countdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("ep_user") || "{}");
  const userId = user.id || user._id;

  // ── Fetch cards ──────────────────────────────────────────────
  const fetchCards = () => {
    setLoading(true);
    getUserCards()
      .then((r) => setCards(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCards(); }, []);
  useEffect(() => () => stopPolling(), []);

  // ── Polling helpers ──────────────────────────────────────────
  const stopPolling = () => {
    if (pollRef.current)      clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollRef.current      = null;
    countdownRef.current = null;
  };

  const startPolling = () => {
    let tick = 120;
    setCountdown(tick);

    // Countdown display
    countdownRef.current = setInterval(() => {
      tick--;
      setCountdown(tick);
      if (tick <= 0) finishRegistration("timeout");
    }, 1000);

    // Poll backend for result every 2s
    pollRef.current = setInterval(async () => {
      try {
        const res = await getRegistrationResult(DEVICE_ID);
        const { ready, status, cardUID: uid, message } = res.data;

        if (!ready) return; // still waiting

        stopPolling();
        setRegMode("idle");

        if (status === "registered") {
          setMsg({ type: "success", text: `✅ Card registered! UID: ${uid}` });
          fetchCards();
        } else if (status === "expired") {
          setMsg({ type: "error", text: "⏱ Tap timed out — no card detected. Try again." });
        } else if (status === "duplicate") {
          setMsg({ type: "error", text: `Card ${uid} is already registered.` });
          fetchCards();
        } else {
          setMsg({ type: "error", text: message || "Registration failed." });
        }
      } catch { /* ignore transient errors */ }
    }, 2000);
  };

  const finishRegistration = async (reason) => {
    stopPolling();
    setRegMode("idle");
    if (reason === "cancel") {
      try { await cancelCardRegistration(DEVICE_ID); } catch {}
      setMsg(null);
    }
    if (reason === "timeout") {
      setMsg({ type: "error", text: "⏱ Tap timed out — no card detected. Try again." });
    }
  };

  // ── Start NFC tap registration ───────────────────────────────
  const handleStartTap = async () => {
    setMsg(null);
    try {
      await startCardRegistration({ userId, deviceId: DEVICE_ID });
      setRegMode("tapping");
      startPolling();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Could not start registration session." });
    }
  };

  // ── Manual UID register ──────────────────────────────────────
  const handleManualRegister = async (e) => {
    e.preventDefault();
    if (!cardUID.trim()) return;
    setRegistering(true); setMsg(null);
    try {
      await registerCard({ cardUID: cardUID.trim(), userId });
      setMsg({ type: "success", text: "Card registered successfully!" });
      setCardUID(""); setShowManual(false);
      fetchCards();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to register card" });
    } finally {
      setRegistering(false);
    }
  };

  const addRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const el = document.createElement("span");
    el.className = "ripple-circle";
    el.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(el);
    setTimeout(() => el.remove(), 600);
  };

  return (
    <div className="page page-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>My RFID Cards</h1>
        <Link to="/user" className="back-btn">← Dashboard</Link>
      </div>
      <p className="page-sub">Register and manage cards linked to your wallet</p>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: "1.25rem" }}>
          {msg.text}
        </div>
      )}

      <div className="grid-2">

        {/* ── Register panel ── */}
        <div className="card">
          <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--navy)", marginBottom: "1.5rem" }}>
            Register New Card
          </h2>

          {/* Default: two options */}
          {regMode === "idle" && !showManual && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <button
                className="btn btn-primary"
                onClick={(e) => { addRipple(e); handleStartTap(); }}
                style={{ padding: "1rem", fontSize: "0.95rem", position: "relative", overflow: "hidden" }}
              >
                🪪 Register via NFC Tap
              </button>
              <p style={{ fontSize: "0.78rem", color: "var(--taupe)", textAlign: "center" }}>
                Tap your card on the POS reader after clicking
              </p>
              <div className="divider" />
              <button
                onClick={() => { setShowManual(true); setMsg(null); }}
                style={{
                  padding: "0.75rem", border: "1.5px solid rgba(139,125,107,0.3)",
                  borderRadius: 10, background: "transparent", color: "var(--taupe)",
                  cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500,
                  fontSize: "0.85rem", transition: "all 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--taupe)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(139,125,107,0.3)"}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                Enter Card UID manually
              </button>
            </div>
          )}

          {/* Tapping: NFC animation + countdown */}
          {regMode === "tapping" && (
            <div style={{ textAlign: "center" }}>
              {/* Sonar rings */}
              <div style={{
                position: "relative", width: 100, height: 100,
                margin: "0 auto 1.5rem",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {[0, 0.55, 1.1].map((d, i) => (
                  <div key={i} className="nfc-ring" style={{ width: 56, height: 56, animationDelay: `${d}s` }} />
                ))}
                <div style={{ fontSize: "1.8rem", position: "relative", zIndex: 2 }}>🪪</div>
              </div>

              <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>
                Tap your card now
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--taupe)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                Hold your NFC card against the RFID reader on the POS device.
              </p>

              <div style={{
                display: "inline-block", padding: "0.3rem 1rem",
                background: "var(--bg-input)", borderRadius: 99,
                fontSize: "0.8rem", color: "var(--slate)", marginBottom: "1.5rem"
              }}>
                ⏱ Expires in {countdown}s
              </div>

              <div>
                <button
                  onClick={() => finishRegistration("cancel")}
                  style={{
                    padding: "0.55rem 1.4rem", background: "transparent",
                    border: "1px solid rgba(139,125,107,0.35)", borderRadius: 8,
                    cursor: "pointer", color: "var(--taupe)", fontFamily: "inherit",
                    fontSize: "0.82rem", transition: "all 0.15s"
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Manual UID entry */}
          {showManual && regMode === "idle" && (
            <form onSubmit={handleManualRegister} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label className="label">Card UID</label>
                <input
                  className="input input-glow"
                  value={cardUID}
                  onChange={(e) => setCardUID(e.target.value)}
                  placeholder="e.g. A3F21B09"
                  style={{ fontFamily: "monospace" }}
                />
                <p style={{ fontSize: "0.75rem", color: "var(--taupe)", marginTop: "0.5rem" }}>
                  Tap the card on the reader — the UID prints in the Serial Monitor.
                </p>
              </div>
              <div className="divider" />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => { setShowManual(false); setCardUID(""); }}
                  style={{
                    flex: 1, padding: "0.85rem",
                    border: "1.5px solid rgba(139,125,107,0.3)", borderRadius: 10,
                    background: "transparent", color: "var(--taupe)",
                    cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500
                  }}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={registering || !cardUID.trim()}
                  onClick={addRipple}
                  style={{ flex: 2, padding: "0.9rem", position: "relative", overflow: "hidden" }}
                >
                  {registering ? <span className="spinner spinner-cream" /> : "Register Card"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Registered cards list ── */}
        <div className="card">
          <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--navy)", marginBottom: "1.25rem" }}>
            Registered Cards ({cards.length})
          </h2>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[0, 1].map(i => (
                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--taupe)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🪪</div>
              <p style={{ fontSize: "0.875rem" }}>No cards registered yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {cards.map((c, i) => (
                <div
                  key={c._id}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem", background: "var(--bg-input)", borderRadius: 12,
                    opacity: 0,
                    animation: `fadeUp 0.35s ease ${i * 0.08}s both`
                  }}
                >
                  <div style={{
                    width: 40, height: 40, background: "var(--navy)", borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem"
                  }}>🪪</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", fontFamily: "monospace", color: "var(--navy)" }}>
                      {c.cardUID}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--taupe)", marginTop: "0.15rem" }}>
                      {c.createdAt
                        ? `Registered ${new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                        : "RFID Card"}
                    </div>
                  </div>
                  <span className={`badge badge-${c.status === "active" ? "success" : "danger"}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

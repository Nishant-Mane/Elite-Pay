import React, { useState, useEffect, useRef } from "react";
import {
  awaitTap,
  cancelTap,
  getPaymentResult,
  getMerchantTransactions
} from "../../services/api";

const DEVICE_ID = "POS_001"; // must match ESP32 DEVICE_ID

export default function MerchantPOS() {
  const [amount, setAmount]       = useState("");
  const [phase, setPhase]         = useState("idle"); // idle | awaiting | success | denied
  const [result, setResult]       = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [recentTxns, setRecentTxns] = useState([]);

  const pollRef      = useRef(null);
  const countdownRef = useRef(null);

  const merchant = JSON.parse(localStorage.getItem("ep_merchant") || "{}");

  // Reload recent transactions when a payment completes
  useEffect(() => {
    getMerchantTransactions()
      .then((r) => setRecentTxns(r.data.slice(0, 5)))
      .catch(() => {});
  }, [phase]);

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

    countdownRef.current = setInterval(() => {
      tick--;
      setCountdown(tick);
      if (tick <= 0) {
        stopPolling();
        setPhase("denied");
        setResult({ message: "⏱ Tap timed out — no card detected within 2 minutes." });
      }
    }, 1000);

    // Poll for payment result every 2 seconds
    pollRef.current = setInterval(async () => {
      try {
        const res = await getPaymentResult(DEVICE_ID);
        const { ready, status, message, userName, balance, amount: amt } = res.data;

        if (!ready) return;

        stopPolling();

        if (status === "approved") {
          setResult({ status: "approved", amount: amt, userName, balance });
          setPhase("success");
          setTimeout(() => reset(), 6000);
        } else {
          setResult({ message: message || "Payment declined" });
          setPhase("denied");
        }
      } catch { /* ignore transient errors */ }
    }, 2000);
  };

  // ── Initiate charge ──────────────────────────────────────────
  const handleAwaitTap = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) return;
    setResult(null);
    setPhase("awaiting");

    try {
      await awaitTap({
        amount: amt,
        merchantId: merchant.id || merchant._id,
        deviceId: DEVICE_ID
      });
      startPolling();
    } catch (err) {
      setPhase("denied");
      setResult({ message: err.response?.data?.message || "Could not reach POS. Check server connection." });
    }
  };

  const handleCancel = async () => {
    stopPolling();
    try { await cancelTap(DEVICE_ID); } catch {}
    setPhase("idle");
    setResult(null);
  };

  const reset = () => {
    stopPolling();
    setPhase("idle");
    setResult(null);
    setAmount("");
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
        <h1 className="page-title" style={{ marginBottom: 0 }}>POS Terminal</h1>
        <Link to="/merchant" className="back-btn">← Dashboard</Link>
      </div>
      <p className="page-sub">Set the amount, then await the customer's tap</p>

      <div className="grid-2" style={{ alignItems: "start" }}>

        {/* ── Terminal ── */}
        <div className="card" style={{ textAlign: "center", minHeight: 380 }}>

          {/* IDLE */}
          {phase === "idle" && (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "1.25rem" }}>📡</div>
              <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, color: "var(--navy)", marginBottom: "1.75rem", fontSize: "1.25rem" }}>
                New Charge
              </h2>

              <div style={{ textAlign: "left", marginBottom: "1.75rem" }}>
                <label className="label">Amount to Charge (₹)</label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: "1.1rem", top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 800, color: "var(--taupe)", fontSize: "1.3rem"
                  }}>₹</span>
                  <input
                    className="input input-glow"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    style={{ paddingLeft: "2.4rem", fontSize: "1.6rem", fontWeight: 800, textAlign: "center", color: "var(--navy)" }}
                  />
                </div>
              </div>

              <div className="divider" style={{ marginBottom: "1.5rem" }} />

              <button
                className="btn btn-primary"
                onClick={(e) => { addRipple(e); handleAwaitTap(); }}
                disabled={!amount || Number(amount) < 1}
                style={{ width: "100%", padding: "1.1rem", fontSize: "1.05rem", position: "relative", overflow: "hidden" }}
              >
                Await Customer Tap — ₹{amount || "0"}
              </button>
            </>
          )}

          {/* AWAITING: NFC sonar + countdown */}
          {phase === "awaiting" && (
            <div style={{ padding: "2rem 0" }}>
              <div style={{
                position: "relative", width: 100, height: 100,
                margin: "0 auto 1.75rem",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {[0, 0.6, 1.2].map((d, i) => (
                  <div key={i} className="nfc-ring" style={{ width: 60, height: 60, animationDelay: `${d}s` }} />
                ))}
                <div style={{
                  width: 58, height: 58, background: "var(--navy)", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", position: "relative", zIndex: 2
                }}>📡</div>
              </div>

              <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, color: "var(--navy)", marginBottom: "0.4rem" }}>
                Awaiting Tap...
              </h2>
              <p style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "Sora, sans-serif", color: "var(--taupe)", marginBottom: "0.4rem" }}>
                ₹{amount}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--taupe)", marginBottom: "1.25rem" }}>
                Ask the customer to tap their RFID card on the reader.
              </p>

              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.3rem 1rem", background: "var(--bg-input)", borderRadius: 99,
                fontSize: "0.8rem", color: "var(--slate)", marginBottom: "1.5rem"
              }}>
                <span className="live-dot" style={{ background: "#f59e0b" }} />
                Expires in {countdown}s
              </div>

              <div className="divider" style={{ marginBottom: "1.25rem" }} />

              <button
                onClick={handleCancel}
                style={{
                  padding: "0.6rem 1.5rem", background: "transparent",
                  border: "1px solid rgba(139,125,107,0.35)", borderRadius: 8,
                  cursor: "pointer", color: "var(--taupe)", fontFamily: "inherit",
                  fontSize: "0.85rem", transition: "all 0.15s"
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                Cancel
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {phase === "success" && result && (
            <div style={{ padding: "2rem 0", animation: "scaleIn 0.3s ease-out both" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
              <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, color: "var(--success)", marginBottom: "0.5rem" }}>
                Approved
              </h2>
              <p style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--navy)", fontFamily: "Sora, sans-serif", marginBottom: "0.5rem" }}>
                ₹{result.amount}
              </p>
              <p style={{ color: "var(--taupe)", marginBottom: "0.3rem" }}>
                Customer: <strong style={{ color: "var(--navy)" }}>{result.userName}</strong>
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--taupe)" }}>
                Remaining: ₹{result.balance?.toFixed(2)}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--taupe)", marginTop: "1rem" }}>
                Auto-clearing in 6s...
              </p>
              <button
                onClick={reset}
                style={{
                  marginTop: "1rem", padding: "0.5rem 1.5rem",
                  background: "transparent", border: "1px solid var(--bg-input)",
                  borderRadius: 8, cursor: "pointer", color: "var(--taupe)",
                  fontFamily: "inherit", fontSize: "0.85rem"
                }}
              >
                New Transaction
              </button>
            </div>
          )}

          {/* DENIED / TIMEOUT */}
          {phase === "denied" && result && (
            <div style={{ padding: "2rem 0", animation: "scaleIn 0.3s ease-out both" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                {result.message?.includes("timed out") ? "⏱" : "❌"}
              </div>
              <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, color: "var(--danger)", marginBottom: "0.5rem" }}>
                {result.message?.includes("timed out") ? "Timed Out" : "Declined"}
              </h2>
              <p style={{ color: "var(--taupe)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                {result.message}
              </p>
              <button onClick={reset} className="btn btn-primary">
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* ── Recent collections ── */}
        <div className="card">
          <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--navy)", marginBottom: "1.25rem" }}>
            Recent Collections
          </h2>
          {recentTxns.length === 0 ? (
            <p style={{ color: "var(--taupe)", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>
              No transactions yet
            </p>
          ) : (
            recentTxns.map((t, i) => (
              <div key={t._id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 0" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--navy)" }}>
                      {t.userId?.name || "Customer"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--taupe)", fontFamily: "monospace" }}>
                      {t.cardUID}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--taupe)" }}>
                      {new Date(t.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--success)", fontSize: "1.05rem" }}>
                    +₹{t.amount}
                  </span>
                </div>
                {i < recentTxns.length - 1 && <div className="divider" />}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

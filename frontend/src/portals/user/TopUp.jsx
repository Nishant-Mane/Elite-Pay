import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createTopupOrder, verifyTopupPayment } from "../../services/api";

export default function TopUp() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [clicking, setClicking] = useState(null);

  const presets = [100, 200, 500, 1000, 2000, 5000];

  const handleTopUp = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) { setError("Enter a valid amount"); return; }
    if (typeof window.Razorpay === "undefined") {
      setError("Razorpay SDK not loaded");
      return;
    }
    setError(""); setLoading(true);

    try {
      const orderRes = await createTopupOrder(amt);
      const { orderId, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amt * 100,
        currency: "INR",
        name: "Elite.Pay",
        description: "Wallet Top Up",
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await verifyTopupPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amt
            });
            setSuccess(verifyRes.data.newBalance);
            setAmount("");
            const stored = JSON.parse(localStorage.getItem("ep_user") || "{}");
            stored.walletBalance = verifyRes.data.newBalance;
            localStorage.setItem("ep_user", JSON.stringify(stored));
          } catch (err) {
            console.error("Verification failed", err);
            setError("Payment verification failed. Contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: { 
          ondismiss: () => setLoading(false) 
        },
        prefill: { name: "", email: "" },
        theme: { color: "#1e2130" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment init failed", err);
      setError(err.response?.data?.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  /* Ripple helper */
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

  const handlePresetClick = (p) => {
    setClicking(p);
    setAmount(String(p));
    setTimeout(() => setClicking(null), 300);
  };

  return (
    <div className="page page-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Top Up Wallet</h1>
        <Link to="/user" className="back-btn">← Dashboard</Link>
      </div>
      <p className="page-sub">Add money to your Elite.Pay wallet using Razorpay</p>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        {success !== null && (
          <div className="alert alert-success" style={{ marginBottom: "1.75rem" }}>
            ✅ Top up successful! New balance: <strong>₹{success.toFixed(2)}</strong>
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <label className="label" style={{ marginBottom: "1rem" }}>Select Amount</label>

        {/* 3×2 grid of springy preset buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.875rem", marginBottom: "1.75rem" }}>
          {presets.map((p) => {
            const isSelected = amount === String(p);
            const isClicking = clicking === p;
            return (
              <button
                key={p}
                onClick={() => handlePresetClick(p)}
                className={isSelected ? "preset-btn selected" : "preset-btn"}
                style={{
                  animation: isClicking ? "spring-click 0.28s cubic-bezier(0.34,1.56,0.64,1)" : undefined
                }}
              >
                ₹{p.toLocaleString("en-IN")}
              </button>
            );
          })}
        </div>

        <div className="divider" style={{ marginBottom: "1.75rem" }} />

        <label className="label">Or enter custom amount</label>
        <div style={{ position: "relative", marginBottom: "1.75rem" }}>
          <span style={{
            position: "absolute", left: "1.1rem", top: "50%",
            transform: "translateY(-50%)", fontWeight: 700, color: "var(--taupe)", fontSize: "1.1rem"
          }}>₹</span>
          <input
            className="input input-glow"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter custom amount"
            style={{ paddingLeft: "2.25rem", fontSize: "1.1rem", fontWeight: 600 }}
          />
        </div>

        {/* Pay button — shimmer + ripple */}
        <button
          className="btn btn-primary"
          onClick={(e) => { addRipple(e); handleTopUp(); }}
          disabled={loading || !amount}
          style={{ width: "100%", padding: "1.1rem", fontSize: "1rem", position: "relative", overflow: "hidden" }}
        >
          {loading
            ? <span className="spinner spinner-cream" />
            : `Pay ₹${amount ? Number(amount).toLocaleString("en-IN") : "0"} via Razorpay`}
        </button>

        <p style={{ fontSize: "0.75rem", color: "var(--taupe)", textAlign: "center", marginTop: "1rem" }}>
          🔒 Secured by Razorpay · Test mode — use card 4111 1111 1111 1111
        </p>
      </div>
    </div>
  );
}

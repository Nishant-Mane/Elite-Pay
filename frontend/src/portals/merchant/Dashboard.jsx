import React, { useEffect, useState, useRef } from "react";
import { getMerchantProfile, getMerchantTransactions } from "../../services/api";
import { Link } from "react-router-dom";

/* Count-up hook */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    const animate = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(parseFloat((eased * target).toFixed(2)));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return value;
}

function Skel({ h = 20, w = "100%", r = 8, mb = 0 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, marginBottom: mb }} />;
}

export default function MerchantDashboard() {
  const [profile, setProfile] = useState(null);
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMerchantProfile(), getMerchantTransactions()])
      .then(([p, t]) => { setProfile(p.data); setTxns(t.data.slice(0, 5)); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const collected   = useCountUp(loading ? 0 : (profile?.totalCollected ?? 0));
  const totalTxns   = useCountUp(loading ? 0 : (profile?.totalTransactions ?? 0), 800);

  const stats = [
    { label: "Total Collected", value: loading ? null : `₹${collected.toFixed(2)}`, icon: "💰", color: "var(--success)" },
    { label: "Transactions",    value: loading ? null : Math.round(totalTxns),        icon: "📋", color: "var(--navy)"   },
    { label: "Status",          value: loading ? null : (profile?.isActive ? "Active" : "Suspended"), icon: "✅", color: profile?.isActive ? "var(--success)" : "var(--danger)" },
  ];

  return (
    <div className="page page-enter">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        {loading ? <Skel h={32} w={240} mb={8} /> : <h1 className="page-title">{profile?.businessName}</h1>}
        <p className="page-sub">Merchant Dashboard</p>
      </div>

      {/* Wallet-style hero card */}
      <div style={{
        background: "var(--navy)", borderRadius: 20,
        padding: "2rem 2.5rem", marginBottom: "1.5rem",
        position: "relative", overflow: "hidden",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        minHeight: 160
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, background: "rgba(196,168,130,0.07)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: 80, width: 200, height: 200, background: "rgba(196,168,130,0.04)", borderRadius: "50%", pointerEvents: "none" }} />
        <div className="card-shimmer-layer" />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(240,233,223,0.5)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.5rem" }}>Total Revenue</p>
          {loading
            ? <Skel h={52} w={160} mb={12} />
            : <p style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", fontWeight: 900, color: "var(--cream-txt)", lineHeight: 1, marginBottom: "0.75rem", fontFamily: "Sora, sans-serif" }}>₹{collected.toFixed(2)}</p>
          }
          <div style={{ display: "flex", gap: "2rem" }}>
            {loading ? <><Skel h={30} w={80} /><Skel h={30} w={80} /></> : (
              <>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(240,233,223,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Transactions</div>
                  <div style={{ fontWeight: 700, color: "var(--cream-txt)" }}>{profile?.totalTransactions ?? 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(240,233,223,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Status</div>
                  <div style={{ fontWeight: 700, color: profile?.isActive ? "#4ade80" : "#f87171" }}>
                    {profile?.isActive ? "● Active" : "● Suspended"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link to="/merchant/pos" className="btn" style={{
            background: "rgba(240,233,223,0.12)", color: "var(--cream-txt)",
            border: "1px solid rgba(196,168,130,0.3)", fontSize: "0.875rem",
            backdropFilter: "blur(8px)"
          }}>
            📡 Open POS
          </Link>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {[
          { to: "/merchant/pos",          icon: "📡", label: "POS Terminal",  desc: "Await customer tap" },
          { to: "/merchant/transactions", icon: "📋", label: "Transactions",  desc: "View all collections" },
        ].map((a, i) => (
          <Link key={a.to} to={a.to} style={{ textDecoration: "none" }}>
            <div className="action-card stat-animate" style={{ minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "center", animationDelay: `${i * 0.12}s` }}>
              <span className="action-icon">{a.icon}</span>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--navy)", marginBottom: "0.3rem" }}>{a.label}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--taupe)" }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent collections */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>Recent Collections</h2>
          <Link to="/merchant/transactions" style={{ fontSize: "0.8rem", color: "var(--taupe)", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
        </div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[0,1,2].map(i => <Skel key={i} h={48} />)}
          </div>
        ) : txns.length === 0 ? (
          <p style={{ color: "var(--taupe)", textAlign: "center", padding: "2.5rem 0", fontSize: "0.875rem" }}>No collections yet. Use the POS terminal to accept payments.</p>
        ) : txns.map((t, i) => (
          <div key={t._id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 0", opacity: 0, animation: `slide-from-right 0.4s ease-out ${i * 0.07}s forwards` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <div style={{ width: 38, height: 38, background: "var(--success-bg)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--success)" }}>↓</div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--navy)" }}>{t.userId?.name || "Customer"}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--taupe)", fontFamily: "monospace" }}>{t.cardUID || "—"}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--taupe)" }}>{new Date(t.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
              <span style={{ fontWeight: 700, color: "var(--success)", fontSize: "1rem" }}>+₹{t.amount}</span>
            </div>
            {i < txns.length - 1 && <div className="divider" />}
          </div>
        ))}
      </div>
    </div>
  );
}

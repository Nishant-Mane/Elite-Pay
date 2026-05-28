import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getUserProfile, getUserTransactions } from "../../services/api";

/* ── Count-up hook ── */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(2)));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

/* ── Skeleton block ── */
function Skel({ h = 20, w = "100%", r = 8, mb = 0 }) {
  return (
    <div className="skeleton" style={{ height: h, width: w, borderRadius: r, marginBottom: mb }} />
  );
}

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUserProfile(), getUserTransactions()])
      .then(([p, t]) => { setUser(p.data); setTxns(t.data.slice(0, 5)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const balance = useCountUp(loading ? 0 : (user?.walletBalance ?? 0), 1200);

  const tierColors = { Bronze: "#cd7f32", Silver: "#7a8a99", Gold: "#c4a882", Platinum: "#5a5c9a" };
  const tc = tierColors[user?.rewardTier] || "#8b7d6b";

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

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          {loading
            ? <Skel h={32} w={220} mb={8} />
            : <h1 className="page-title">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          }
          <p className="page-sub">Here's your wallet overview</p>
        </div>
        {!loading && (
          <Link
            to="/user/rewards"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.6rem 1.1rem",
              background: `${tc}18`,
              border: `1.5px solid ${tc}44`,
              borderRadius: 99,
              textDecoration: "none",
              fontFamily: "Sora, sans-serif",
              fontWeight: 700,
              fontSize: "0.82rem",
              color: tc,
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${tc}28`}
            onMouseLeave={e => e.currentTarget.style.background = `${tc}18`}
          >
            {user?.rewardTier === "Bronze" ? "🥉" : user?.rewardTier === "Silver" ? "🥈" : user?.rewardTier === "Gold" ? "🥇" : "💎"}
            {user?.rewardTier} Member · View Rewards
          </Link>
        )}
      </div>

      {/* ── Wallet Balance Card ── */}
      <div style={{
        background: "var(--navy)", borderRadius: 20,
        padding: "2.5rem 2.75rem", marginBottom: "1.25rem",
        position: "relative", overflow: "hidden", minHeight: 190,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end"
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, background: "rgba(196,168,130,0.07)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -90, right: 90, width: 220, height: 220, background: "rgba(196,168,130,0.05)", borderRadius: "50%", pointerEvents: "none" }} />

        {/* Shimmer sweep */}
        <div className="card-shimmer-layer" />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(240,233,223,0.55)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.6rem" }}>
            Wallet Balance
          </p>
          {loading ? (
            <Skel h={56} w={180} mb={16} />
          ) : (
            <p style={{ fontSize: "clamp(3rem,6vw,4rem)", fontWeight: 900, color: "var(--cream-txt)", lineHeight: 1, marginBottom: "1rem", fontFamily: "Sora, sans-serif" }}>
              ₹{balance.toFixed(2)}
            </p>
          )}
          <div style={{ display: "flex", gap: "2rem" }}>
            {loading ? (
              <>
                <Skel h={36} w={80} />
                <Skel h={36} w={80} />
                <Skel h={36} w={80} />
              </>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(240,233,223,0.45)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Transactions</div>
                  <div style={{ fontWeight: 700, color: "var(--cream-txt)" }}>{user?.totalTransactions ?? 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(240,233,223,0.45)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Total Spent</div>
                  <div style={{ fontWeight: 700, color: "var(--cream-txt)" }}>₹{(user?.totalSpentINR ?? 0).toFixed(0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(240,233,223,0.45)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Reward Tier</div>
                  <div style={{ fontWeight: 700, color: tc }}>⭐ {user?.rewardTier}</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link
            to="/user/topup"
            className="btn"
            style={{
              background: "rgba(240,233,223,0.12)", color: "var(--cream-txt)",
              border: "1px solid rgba(196,168,130,0.3)", fontSize: "0.875rem",
              backdropFilter: "blur(8px)", overflow: "hidden"
            }}
            onClick={addRipple}
          >
            + Top Up Wallet
          </Link>
        </div>
      </div>

      {/* ── Quick Action Cards — animated hover ── */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        {[
          { to: "/user/topup",        icon: "💳", label: "Top Up",   desc: "Add money via Razorpay" },
          { to: "/user/cards",        icon: "🪪", label: "My Cards",  desc: "Manage RFID cards" },
          { to: "/user/transactions", icon: "📋", label: "History",   desc: "All transactions" },
        ].map((a, i) => (
          <Link key={a.to} to={a.to} style={{ textDecoration: "none" }}>
            <div
              className="action-card stat-animate"
              style={{
                minHeight: 140,
                display: "flex", flexDirection: "column", justifyContent: "center",
                animationDelay: `${i * 0.12}s`
              }}
            >
              <span className="action-icon">{a.icon}</span>
              <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--navy)", marginBottom: "0.3rem" }}>{a.label}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--taupe)" }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent Transactions ── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>Recent Transactions</h2>
          <Link to="/user/transactions" style={{ fontSize: "0.8rem", color: "var(--taupe)", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[0,1,2].map(i => <Skel key={i} h={48} />)}
          </div>
        ) : txns.length === 0 ? (
          <p style={{ color: "var(--taupe)", fontSize: "0.875rem", textAlign: "center", padding: "2.5rem 0" }}>
            No transactions yet. Tap your card to get started!
          </p>
        ) : (
          txns.map((t, i) => (
            <div key={t._id}>
              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.875rem 0",
                  opacity: 0,
                  animation: `slide-from-right 0.4s ease-out ${i * 0.08}s forwards`
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: t.type === "topup" ? "var(--success-bg)" : "var(--bg-input)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: 700,
                    color: t.type === "topup" ? "var(--success)" : "var(--taupe)"
                  }}>
                    {t.type === "topup" ? "↓" : "↑"}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--navy)" }}>
                      {t.type === "topup" ? "Top Up" : t.merchantId?.businessName || "RFID Payment"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--taupe)" }}>
                      {new Date(t.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: t.type === "topup" ? "var(--success)" : "var(--danger)", fontSize: "0.95rem" }}>
                  {t.type === "topup" ? "+" : "-"}₹{t.amount}
                </span>
              </div>
              {i < txns.length - 1 && <div className="divider" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

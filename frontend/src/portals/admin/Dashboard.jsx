import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, getAdminTransactions } from "../../services/api";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [txns, setTxns]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminTransactions()])
      .then(([s, t]) => { setStats(s.data); setTxns(t.data.slice(0, 8)); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const revenue  = useCountUp(loading ? 0 : (stats?.totalRevenue ?? 0));
  const users    = useCountUp(loading ? 0 : (stats?.totalUsers ?? 0), 800);
  const merchants= useCountUp(loading ? 0 : (stats?.totalMerchants ?? 0), 800);
  const txnCount = useCountUp(loading ? 0 : (stats?.totalTransactions ?? 0), 1000);

  const statCards = [
    { label: "Total Users",     value: Math.round(users),     icon: "👤", color: "#7ab4ff" },
    { label: "Total Merchants", value: Math.round(merchants), icon: "🏪", color: "var(--gold)" },
    { label: "Transactions",    value: Math.round(txnCount),  icon: "📋", color: "var(--taupe)" },
    { label: "Revenue",         value: `₹${revenue.toFixed(0)}`, icon: "💰", color: "var(--success)" },
  ];

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">Admin Overview</h1>
        <p className="page-sub">Platform-wide analytics and health</p>
      </div>

      {/* Hero revenue banner */}
      <div style={{
        background: "var(--navy)", borderRadius: 20, padding: "2rem 2.5rem",
        marginBottom: "1.5rem", position: "relative", overflow: "hidden",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end", minHeight: 150
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, background: "rgba(196,168,130,0.07)", borderRadius: "50%", pointerEvents: "none" }} />
        <div className="card-shimmer-layer" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(240,233,223,0.5)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.5rem" }}>Platform Revenue</p>
          {loading ? <Skel h={48} w={200} mb={12} /> : (
            <p style={{ fontSize: "clamp(2.5rem,5vw,3.25rem)", fontWeight: 900, color: "var(--cream-txt)", lineHeight: 1, marginBottom: "0.75rem", fontFamily: "Sora, sans-serif" }}>₹{revenue.toFixed(0)}</p>
          )}
          <div style={{ display: "flex", gap: "2rem" }}>
            {loading ? <><Skel h={28} w={70} /><Skel h={28} w={70} /></> : (
              <>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(240,233,223,0.4)", textTransform: "uppercase" }}>Users</div>
                  <div style={{ fontWeight: 700, color: "var(--cream-txt)" }}>{stats?.totalUsers ?? 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(240,233,223,0.4)", textTransform: "uppercase" }}>Merchants</div>
                  <div style={{ fontWeight: 700, color: "var(--cream-txt)" }}>{stats?.totalMerchants ?? 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(240,233,223,0.4)", textTransform: "uppercase" }}>Transactions</div>
                  <div style={{ fontWeight: 700, color: "var(--cream-txt)" }}>{stats?.totalTransactions ?? 0}</div>
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Link to="/admin/transactions" className="btn" style={{ background: "rgba(240,233,223,0.12)", color: "var(--cream-txt)", border: "1px solid rgba(196,168,130,0.3)", fontSize: "0.875rem", backdropFilter: "blur(8px)" }}>
            View All Transactions
          </Link>
        </div>
      </div>

      {/* 4 stat cards with staggered animation */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        {statCards.map((s, i) => (
          <div key={s.label} className="stat-card stat-animate" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div className="stat-label">{s.label}</div>
              <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
            </div>
            {loading ? <Skel h={36} w={100} /> : (
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Quick nav cards */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        {[
          { to: "/admin/users",        icon: "👤", label: "Users",        desc: "Manage registered users" },
          { to: "/admin/merchants",    icon: "🏪", label: "Merchants",    desc: "Monitor merchant accounts" },
          { to: "/admin/transactions", icon: "📋", label: "Transactions", desc: "View all platform activity" },
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

      {/* Recent transactions */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>Recent Transactions</h2>
          <Link to="/admin/transactions" style={{ fontSize: "0.8rem", color: "var(--taupe)", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
        </div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[0,1,2,3].map(i => <Skel key={i} h={48} />)}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>User</th><th>Merchant</th><th>Amount</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {txns.map((t, i) => (
                  <tr key={t._id} style={{ opacity: 0, animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                    <td style={{ fontSize: "0.85rem", color: "var(--navy)", fontWeight: 500 }}>{t.userId?.name || "—"}</td>
                    <td style={{ fontSize: "0.85rem", color: "var(--taupe)" }}>{t.merchantId?.businessName || "—"}</td>
                    <td style={{ fontWeight: 700, color: t.type === "topup" ? "var(--success)" : "var(--navy)" }}>₹{t.amount}</td>
                    <td><span className="badge badge-info">{t.type}</span></td>
                    <td><span className={`badge badge-${t.status === "success" ? "success" : "danger"}`}>{t.status}</span></td>
                    <td style={{ fontSize: "0.75rem", color: "var(--taupe)" }}>{new Date(t.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

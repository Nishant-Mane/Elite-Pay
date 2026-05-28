import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminTransactions } from "../../services/api";

function Skel({ h = 20, w = "100%", r = 8, mb = 0 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, marginBottom: mb }} />;
}

export default function AdminTransactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getAdminTransactions().then((r) => setTxns(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? txns : txns.filter((t) => t.type === filter);
  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0);

  if (loading) return (
    <div className="page page-enter">
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">All Transactions</h1>
        <p className="page-sub">Loading...</p>
      </div>
      <div className="card"><div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>{[0,1,2,3,4].map(i => <Skel key={i} h={52} />)}</div></div>
    </div>
  );

  return (
    <div className="page page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">All Transactions</h1>
          <p className="page-sub">{filtered.length} records · ₹{totalAmount.toFixed(0)} total</p>
        </div>
        {/* Filter pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/admin" className="back-btn">← Overview</Link>
          {["all", "topup", "payment", "tap"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "0.4rem 1rem", borderRadius: 99, border: "1.5px solid", borderColor: filter === f ? "var(--navy)" : "rgba(139,125,107,0.3)", background: filter === f ? "var(--navy)" : "transparent", color: filter === f ? "var(--cream-txt)" : "var(--taupe)", fontFamily: "inherit", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.15s" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr><th>User</th><th>Merchant</th><th>Amount</th><th>Type</th><th>Card UID</th><th>Status</th><th>Date & Time</th></tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t._id} style={{ opacity: 0, animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--navy)" }}>{t.userId?.name || "—"}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--taupe)" }}>{t.userId?.email}</div>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--taupe)" }}>{t.merchantId?.businessName || "—"}</td>
                  <td style={{ fontWeight: 700, color: t.type === "topup" ? "var(--success)" : "var(--navy)" }}>
                    {t.type === "topup" ? "+" : "-"}₹{t.amount}
                  </td>
                  <td><span className="badge badge-info">{t.type}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--taupe)" }}>{t.cardUID || "—"}</td>
                  <td><span className={`badge badge-${t.status === "success" ? "success" : "danger"}`}>{t.status}</span></td>
                  <td style={{ fontSize: "0.75rem", color: "var(--taupe)" }}>
                    {new Date(t.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

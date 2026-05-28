import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMerchantTransactions } from "../../services/api";

function Skel({ h = 20, w = "100%", r = 8, mb = 0 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, marginBottom: mb }} />;
}

export default function MerchantTransactions() {
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    getMerchantTransactions().then((r) => setTxns(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = txns.filter(t =>
    t.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (t.cardUID || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = txns.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="page page-enter">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-sub">All payments collected from customers</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/merchant" className="back-btn">← Dashboard</Link>
          <input className="input" placeholder="Search customer or card..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
          <div className="stat-card stat-animate" style={{ textAlign: "right", padding: "0.875rem 1.25rem", animationDelay: "0.1s" }}>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value" style={{ color: "var(--success)", fontSize: "1.5rem" }}>₹{total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[0,1,2,3].map(i => <Skel key={i} h={52} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem", color: "var(--taupe)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📋</div>
            <p>{search ? "No matching transactions" : "No transactions yet"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr><th>Customer</th><th>Amount</th><th>Card UID</th><th>Status</th><th>Date &amp; Time</th></tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t._id} style={{ opacity: 0, animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--navy)" }}>{t.userId?.name || "Unknown"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--taupe)" }}>{t.userId?.email}</div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: "var(--success)" }}>+₹{t.amount}</span></td>
                    <td><span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--taupe)" }}>{t.cardUID || "—"}</span></td>
                    <td><span className={`badge badge-${t.status === "success" ? "success" : "danger"}`}>{t.status}</span></td>
                    <td style={{ color: "var(--taupe)", fontSize: "0.8rem" }}>{new Date(t.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
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

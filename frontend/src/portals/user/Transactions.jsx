import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserTransactions } from "../../services/api";

/* Skeleton */
function Skel({ h = 20, w = "100%", r = 8 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserTransactions()
      .then((r) => setTxns(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const typeLabel = { topup: "Top Up", payment: "Payment", tap: "RFID Tap" };

  return (
    <div className="page page-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Transactions</h1>
        <Link to="/user" className="back-btn">← Dashboard</Link>
      </div>
      <p className="page-sub">Your complete payment history</p>

      <div className="card">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[0,1,2,3,4].map(i => <Skel key={i} h={48} />)}
          </div>
        ) : txns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem", color: "var(--taupe)" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>📋</div>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th><th>Amount</th><th>Merchant / Note</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t, i) => (
                  <tr
                    key={t._id}
                    className="txn-row"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: t.type === "topup" ? "var(--success-bg)" : "var(--bg-input)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700,
                          color: t.type === "topup" ? "var(--success)" : "var(--taupe)",
                          fontSize: "0.9rem"
                        }}>
                          {t.type === "topup" ? "↓" : "↑"}
                        </div>
                        <span style={{ fontWeight: 500, color: "var(--navy)" }}>{typeLabel[t.type] || t.type}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: t.type === "topup" ? "var(--success)" : "var(--danger)" }}>
                      {t.type === "topup" ? "+" : "-"}₹{t.amount}
                    </td>
                    <td style={{ color: "var(--taupe)", fontSize: "0.85rem" }}>{t.merchantId?.businessName || t.note || "—"}</td>
                    <td><span className={`badge badge-${t.status === "success" ? "success" : "danger"}`}>{t.status}</span></td>
                    <td style={{ color: "var(--taupe)", fontSize: "0.8rem" }}>
                      {new Date(t.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
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

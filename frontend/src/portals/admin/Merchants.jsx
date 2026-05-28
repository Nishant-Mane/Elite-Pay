import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminMerchants } from "../../services/api";

function Skel({ h = 20, w = "100%", r = 8, mb = 0 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, marginBottom: mb }} />;
}

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    getAdminMerchants().then((r) => setMerchants(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = merchants.filter((m) =>
    m.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = merchants.reduce((s, m) => s + (m.totalCollected || 0), 0);

  return (
    <div className="page page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Merchants</h1>
          <p className="page-sub">{merchants.length} registered merchants · ₹{totalRevenue.toFixed(0)} total revenue</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/admin" className="back-btn">← Overview</Link>
          <input className="input input-glow" placeholder="Search business or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Total Merchants", value: merchants.length, icon: "🏪" },
          { label: "Active",          value: merchants.filter(m => m.isActive).length, icon: "✅" },
          { label: "Total Revenue",   value: `₹${totalRevenue.toFixed(0)}`, icon: "💰" },
        ].map((s, i) => (
          <div key={s.label} className="stat-card stat-animate" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <div className="stat-label">{s.label}</div>
              <span style={{ fontSize: "1.25rem" }}>{s.icon}</span>
            </div>
            {loading ? <Skel h={32} w={80} /> : <div className="stat-value">{s.value}</div>}
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[0,1,2,3].map(i => <Skel key={i} h={52} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--taupe)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🏪</div>
            <p>{search ? "No matching merchants" : "No merchants yet"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>Business</th><th>Owner</th><th>Email</th><th>Revenue</th><th>Transactions</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m._id} style={{ opacity: 0, animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ width: 32, height: 32, background: "rgba(196,168,130,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", color: "var(--gold)" }}>
                          {m.businessName?.[0]?.toUpperCase() || "M"}
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--navy)" }}>{m.businessName}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--slate)" }}>{m.name}</td>
                    <td style={{ color: "var(--taupe)", fontSize: "0.85rem" }}>{m.email}</td>
                    <td><span style={{ fontWeight: 700, color: "var(--success)" }}>₹{m.totalCollected?.toFixed(2)}</span></td>
                    <td style={{ color: "var(--slate)" }}>{m.totalTransactions}</td>
                    <td><span className={`badge badge-${m.isActive ? "success" : "danger"}`}>{m.isActive ? "Active" : "Suspended"}</span></td>
                    <td style={{ fontSize: "0.75rem", color: "var(--taupe)" }}>{new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
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

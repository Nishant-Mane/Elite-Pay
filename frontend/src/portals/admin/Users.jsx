import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers } from "../../services/api";

function Skel({ h = 20, w = "100%", r = 8, mb = 0 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, marginBottom: mb }} />;
}

const tierColors = { Bronze: "#cd7f32", Silver: "#7a8a99", Gold: "#c4a882", Platinum: "#8b84d7" };
const tierIcons  = { Bronze: "🥉", Silver: "🥈", Gold: "🥇", Platinum: "💎" };

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    getAdminUsers().then((r) => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-sub">{users.length} registered users on the platform</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/admin" className="back-btn">← Overview</Link>
          <input className="input input-glow" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        </div>
      </div>

      {/* Summary stat row */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        {["Bronze", "Silver", "Gold", "Platinum"].map((tier, i) => {
          const count = users.filter(u => u.rewardTier === tier).length;
          return (
            <div key={tier} className="stat-card stat-animate" style={{ animationDelay: `${i * 0.08}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <div className="stat-label">{tier}</div>
                <span>{tierIcons[tier]}</span>
              </div>
              {loading ? <Skel h={28} w={50} /> : (
                <div style={{ fontWeight: 800, fontSize: "1.5rem", fontFamily: "Sora, sans-serif", color: tierColors[tier] }}>{count}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[0,1,2,3,4].map(i => <Skel key={i} h={56} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--taupe)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👤</div>
            <p>{search ? "No users match your search" : "No users registered yet"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Balance</th><th>Transactions</th><th>Total Spent</th><th>Tier</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u._id} style={{ opacity: 0, animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ width: 32, height: 32, background: (tierColors[u.rewardTier] || "#8b7d6b") + "22", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", color: tierColors[u.rewardTier] || "#8b7d6b" }}>
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--navy)" }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--taupe)", fontSize: "0.85rem" }}>{u.email}</td>
                    <td><span style={{ fontWeight: 700, color: "var(--navy)" }}>₹{u.walletBalance?.toFixed(2)}</span></td>
                    <td style={{ color: "var(--slate)" }}>{u.totalTransactions}</td>
                    <td style={{ color: "var(--slate)" }}>₹{u.totalSpentINR?.toFixed(0)}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.7rem", borderRadius: 99, fontSize: "0.7rem", fontWeight: 700, background: (tierColors[u.rewardTier] || "#8b7d6b") + "22", color: tierColors[u.rewardTier] || "#8b7d6b" }}>
                        {tierIcons[u.rewardTier] || "🥉"} {u.rewardTier}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "var(--taupe)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
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

import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getStats, getAllUsers, getAllMerchants, getAllTransactions, freezeUser, unfreezeUser, adminFreezeCard, reverseTransaction } from "../services/api";

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const { pathname } = useLocation();
  const links = [
    { to: ".", label: "Overview" },
    { to: "users", label: "Users" },
    { to: "merchants", label: "Merchants" },
    { to: "transactions", label: "Transactions" },
  ];
  return (
    <nav className="bg-gray-900 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="font-bold text-white text-lg">Elite.Pay <span className="text-gray-400 text-sm font-normal">Admin</span></Link>
        <div className="flex gap-1 items-center">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${pathname === l.to ? "bg-white text-gray-900" : "text-gray-300 hover:bg-gray-700"}`}>
              {l.label}
            </Link>
          ))}
          <button onClick={() => supabase.auth.signOut()} className="px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700 rounded-lg">Logout</button>
        </div>
      </div>
    </nav>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <Link to="/" className="block text-center text-xs text-gray-400 mb-4 hover:text-gray-600">← Back to portal select</Link>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Elite.Pay</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Admin Panel</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-gray-800 text-white rounded-lg py-2 font-semibold hover:bg-gray-900 disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { getStats().then((r) => setStats(r.data)).catch(() => {}); }, []);
  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? "—", to: "users", color: "bg-indigo-500" },
    { label: "Total Merchants", value: stats?.totalMerchants ?? "—", to: "merchants", color: "bg-emerald-500" },
    { label: "Total Transactions", value: stats?.totalTransactions ?? "—", to: "transactions", color: "bg-purple-500" },
    { label: "Total Volume", value: stats ? `₹${stats.totalVolume.toLocaleString()}` : "—", to: "transactions", color: "bg-orange-500" },
    { label: "Success Rate", value: stats ? `${stats.successRate}%` : "—", to: "transactions", color: "bg-teal-500" },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
            <div className={`w-8 h-1.5 rounded-full ${c.color} mb-3`} />
            <p className="text-2xl font-bold text-gray-800">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Manage Users", to: "users", icon: "👤" }, { label: "Manage Merchants", to: "merchants", icon: "🏪" }, { label: "All Transactions", to: "transactions", icon: "📋" }].map((item) => (
          <Link key={item.to} to={item.to} className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
            <div className="text-2xl">{item.icon}</div>
            <p className="text-sm font-medium text-gray-600 mt-1">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true);
  const load = () => getAllUsers().then((r) => { setUsers(r.data.users); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const handleToggle = async (user) => {
    try { user.status === "frozen" ? await unfreezeUser(user._id) : await freezeUser(user._id); load(); } catch {}
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Users ({users.length})</h2>
      {loading && <p className="text-gray-400 text-center">Loading...</p>}
      {users.map((u) => (
        <div key={u._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-800">{u.name}</p>
            <p className="text-xs text-gray-400">{u.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">Balance: <span className="font-medium">₹{u.walletBalance?.toFixed(2)}</span> · Spent: <span className="font-medium">₹{u.totalSpentINR?.toFixed(2)}</span> · Txns: <span className="font-medium">{u.totalTransactions}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.status}</span>
            <button onClick={() => handleToggle(u)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${u.status === "frozen" ? "text-green-600 border-green-300 hover:bg-green-50" : "text-red-500 border-red-200 hover:bg-red-50"}`}>
              {u.status === "frozen" ? "Unfreeze" : "Freeze"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Merchants ────────────────────────────────────────────────────────────────
function Merchants() {
  const [merchants, setMerchants] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { getAllMerchants().then((r) => { setMerchants(r.data.merchants); setLoading(false); }).catch(() => setLoading(false)); }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Merchants ({merchants.length})</h2>
      {loading && <p className="text-gray-400 text-center">Loading...</p>}
      {merchants.map((m) => (
        <div key={m._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-800">{m.businessName}</p>
            <p className="text-xs text-gray-400">{m.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">Revenue: <span className="font-medium text-emerald-700">₹{m.totalRevenue?.toFixed(2)}</span> · Devices: <span className="font-medium">{m.deviceIds?.length}</span></p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{m.status}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
function Transactions() {
  const [txns, setTxns] = useState([]); const [loading, setLoading] = useState(true); const [reversing, setReversing] = useState(null);
  const load = () => getAllTransactions().then((r) => { setTxns(r.data.transactions); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const handleReverse = async (id) => {
    if (!window.confirm("Reverse this transaction? The user will be refunded.")) return;
    setReversing(id);
    try { await reverseTransaction(id); load(); } catch {}
    setReversing(null);
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">All Transactions ({txns.length})</h2>
      {loading && <p className="text-gray-400 text-center">Loading...</p>}
      {txns.map((tx) => (
        <div key={tx._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-800">₹{tx.amount}</p>
            <p className="text-xs text-gray-400">User: {tx.userId?.name || "—"} · Merchant: {tx.merchantId?.businessName || "—"}</p>
            <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()} · Card: {tx.cardUID}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tx.status === "success" ? "bg-green-100 text-green-700" : tx.status === "reversed" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{tx.status}</span>
            {tx.status === "success" && (
              <button onClick={() => handleReverse(tx._id)} disabled={reversing === tx._id}
                className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50">
                {reversing === tx._id ? "..." : "Reverse"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AdminApp ─────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [session, setSession] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  if (!session) return <Login />;
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="merchants" element={<Merchants />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </div>
    </div>
  );
}

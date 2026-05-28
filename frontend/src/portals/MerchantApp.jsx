import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { syncMerchant, getMerchantProfile, getMerchantTransactions, createPaymentRequest } from "../services/api";

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const { pathname } = useLocation();
  const links = [
    { to: ".", label: "Dashboard" },
    { to: "pos", label: "POS" },
    { to: "transactions", label: "Transactions" },
  ];
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="font-bold text-emerald-700 text-lg">Elite<span className="text-gray-400 font-normal text-sm ml-1">Merchant</span></Link>
        <div className="flex gap-1 items-center">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${pathname === l.to ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {l.label}
            </Link>
          ))}
          <button onClick={() => supabase.auth.signOut()} className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg">Logout</button>
        </div>
      </div>
    </nav>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState(""); const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { data: { role: "merchant", business_name: businessName } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-teal-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <Link to="/" className="block text-center text-xs text-gray-400 mb-4 hover:text-emerald-600">← Back to portal select</Link>
        <h1 className="text-2xl font-bold text-center text-emerald-700 mb-1">Elite.Pay</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Merchant Portal</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && <input type="text" placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" required />}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg py-2 font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignUp ? "Already registered?" : "New merchant?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-emerald-600 font-semibold">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [merchant, setMerchant] = useState(null); const [recentTxns, setRecentTxns] = useState([]);
  useEffect(() => {
    getMerchantProfile().then((r) => setMerchant(r.data.merchant)).catch(() => {});
    getMerchantTransactions().then((r) => setRecentTxns(r.data.transactions.slice(0, 5))).catch(() => {});
  }, []);
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <p className="text-sm opacity-80">Total Revenue</p>
        <p className="text-4xl font-bold mt-1">₹{merchant?.totalRevenue?.toFixed(2) || "0.00"}</p>
        <p className="text-sm opacity-70 mt-2">{merchant?.businessName}</p>
        <Link to="pos" className="mt-4 inline-block bg-white text-emerald-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-emerald-50">Open POS →</Link>
      </div>
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700">Recent Transactions</h2>
          <Link to="transactions" className="text-sm text-emerald-600 font-medium">View all →</Link>
        </div>
        {recentTxns.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No transactions yet</p>}
        {recentTxns.map((tx) => (
          <div key={tx._id} className="flex justify-between items-center py-2 border-b last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800">{tx.userId?.name || "Unknown"}</p>
              <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
            </div>
            <span className="font-semibold text-emerald-700">₹{tx.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── POS ──────────────────────────────────────────────────────────────────────
function POS() {
  const [amount, setAmount] = useState(""); const [status, setStatus] = useState(null); const [message, setMessage] = useState("");
  const handleSetAmount = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMessage("Enter a valid amount");
    setStatus("waiting"); setMessage(`Amount set to ₹${amt.toFixed(2)} — waiting for card tap...`);
  };
  return (
    <div className="max-w-md mx-auto space-y-5">
      <h2 className="text-xl font-bold text-gray-800">POS Terminal</h2>
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <label className="block text-sm font-medium text-gray-700">Charge Amount (₹)</label>
        <input type="number" min="1" placeholder="Enter amount to charge" value={amount} onChange={(e) => { setAmount(e.target.value); setStatus(null); }}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        <div className="flex gap-2 flex-wrap justify-center">
          {[50, 100, 150, 200, 500].map((a) => (
            <button key={a} onClick={() => setAmount(a)} className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 hover:bg-emerald-100">₹{a}</button>
          ))}
        </div>
        <button onClick={handleSetAmount} className="w-full bg-emerald-600 text-white rounded-xl py-3 font-bold text-lg hover:bg-emerald-700">Ready — Tap Card</button>
      </div>
      {status === "waiting" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center animate-pulse">
          <p className="text-3xl mb-2">📡</p>
          <p className="text-emerald-700 font-semibold">Waiting for card tap...</p>
          <p className="text-emerald-600 text-sm mt-1">Amount: ₹{parseFloat(amount).toFixed(2)}</p>
        </div>
      )}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">💡 How it works</p>
        <p>Enter the charge amount above. The ESP32 POS device reads the amount and deducts it from the customer's RFID card when tapped.</p>
      </div>
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
function Transactions() {
  const [txns, setTxns] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { getMerchantTransactions().then((r) => { setTxns(r.data.transactions); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const total = txns.filter((t) => t.status === "success").reduce((sum, t) => sum + t.amount, 0);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
        <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">Total: ₹{total.toFixed(2)}</span>
      </div>
      {loading && <p className="text-center text-gray-400">Loading...</p>}
      {!loading && txns.length === 0 && <p className="text-center text-gray-400 mt-6">No transactions yet</p>}
      {txns.map((tx) => (
        <div key={tx._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-800">{tx.userId?.name || "Unknown User"}</p>
            <p className="text-xs text-gray-400">{tx.userId?.email}</p>
            <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()} · Card: {tx.cardUID}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-emerald-700">₹{tx.amount}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tx.status === "success" ? "bg-green-100 text-green-700" : tx.status === "reversed" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{tx.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MerchantApp ──────────────────────────────────────────────────────────────
export default function MerchantApp() {
  const [session, setSession] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session);
      if (session) await syncMerchant(session.user.user_metadata?.business_name || "My Business", session.user.email).catch(() => {});
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { syncUser, getUserProfile, getUserTransactions, saveWalletAddress, claimReward, createTopUpOrder, verifyTopUp, registerCard, getUserCards, freezeCard, unfreezeCard } from "../services/api";

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const { pathname } = useLocation();
  const links = [
    { to: ".", label: "Home", icon: "🏠" },
    { to: "topup", label: "Top Up", icon: "💳" },
    { to: "cards", label: "Cards", icon: "🪪" },
    { to: "rewards", label: "Rewards", icon: "🏆" },
    { to: "transactions", label: "History", icon: "📋" },
  ];
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="font-bold text-indigo-700 text-lg">Elite<span className="text-gray-400 font-normal text-sm ml-1">User</span></Link>
        <div className="flex gap-1 items-center">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${pathname === l.to ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { data: { role: "user" } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <Link to="/" className="block text-center text-xs text-gray-400 mb-4 hover:text-indigo-600">← Back to portal select</Link>
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-1">Elite.Pay</h1>
        <p className="text-center text-gray-500 text-sm mb-6">User Portal</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignUp ? "Already have an account?" : "New user?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 font-semibold">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getUserProfile().then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <p className="text-center text-gray-500 mt-10">Loading...</p>;
  if (!data) return <p className="text-center text-red-500 mt-10">Failed to load profile.</p>;
  const { user, nextMilestone } = data;
  const progress = nextMilestone ? Math.min((user.totalSpentINR / nextMilestone.threshold) * 100, 100) : 100;
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <p className="text-sm opacity-80">Wallet Balance</p>
        <p className="text-4xl font-bold mt-1">₹{user.walletBalance.toFixed(2)}</p>
        <p className="text-sm opacity-70 mt-2">{user.totalTransactions} transactions · ₹{user.totalSpentINR.toFixed(0)} total spent</p>
        <Link to="topup" className="mt-4 inline-block bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-indigo-50">+ Top Up</Link>
      </div>
      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Milestone Rewards</h2>
        {nextMilestone ? (
          <>
            <p className="text-sm text-gray-500 mb-2">₹{user.totalSpentINR.toFixed(0)} / ₹{nextMilestone.threshold.toLocaleString()} — ₹{nextMilestone.remaining.toFixed(0)} to go</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Reach ₹{nextMilestone.threshold.toLocaleString()} to unlock ETH reward</p>
          </>
        ) : <p className="text-sm text-green-600 font-semibold">All milestones reached! 🎉</p>}
        <Link to="rewards" className="text-indigo-600 text-sm font-semibold mt-3 inline-block">View all milestones →</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Top Up", to: "topup", icon: "💳" }, { label: "My Cards", to: "cards", icon: "🪪" }, { label: "History", to: "transactions", icon: "📋" }].map((item) => (
          <Link key={item.to} to={item.to} className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
            <div className="text-2xl">{item.icon}</div>
            <p className="text-sm font-medium text-gray-600 mt-1">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── TopUp ────────────────────────────────────────────────────────────────────
function TopUp() {
  const [amount, setAmount] = useState(""); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  const handleTopUp = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMessage("Enter a valid amount");
    setLoading(true); setMessage("");
    try {
      const { data: order } = await createTopUpOrder(amt);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency,
        name: "Elite.Pay", description: `Top Up ₹${amt}`, order_id: order.orderId,
        handler: async (response) => {
          try {
            const { data } = await verifyTopUp(response);
            setMessage(`✅ Top up successful! New balance: ₹${data.newBalance.toFixed(2)}`);
            setAmount("");
          } catch { setMessage("❌ Payment verification failed"); }
        },
        theme: { color: "#4F46E5" },
      };
      new window.Razorpay(options).open();
    } catch { setMessage("❌ Failed to create order"); }
    setLoading(false);
  };
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Top Up Wallet</h2>
      <input type="number" min="1" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <div className="flex gap-2 flex-wrap">
        {[100, 250, 500, 1000].map((p) => (
          <button key={p} onClick={() => setAmount(p)} className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 hover:bg-indigo-100">₹{p}</button>
        ))}
      </div>
      <button onClick={handleTopUp} disabled={loading} className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50">
        {loading ? "Processing..." : "Pay with Razorpay"}
      </button>
      {message && <p className="text-sm text-center font-medium">{message}</p>}
    </div>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────
function Cards() {
  const [cards, setCards] = useState([]); const [userId, setUserId] = useState("");
  const [cardUID, setCardUID] = useState(""); const [label, setLabel] = useState(""); const [message, setMessage] = useState("");
  const load = async () => {
    const { data: profile } = await getUserProfile();
    setUserId(profile.user.id);
    const { data } = await getUserCards(profile.user.id);
    setCards(data.cards);
  };
  useEffect(() => { load(); }, []);
  const handleRegister = async () => {
    if (!cardUID) return;
    try { await registerCard(userId, cardUID, label); setMessage("✅ Card registered"); setCardUID(""); setLabel(""); load(); }
    catch { setMessage("❌ Registration failed"); }
  };
  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800">My Cards</h2>
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">Register New Card</h3>
        <input placeholder="Card UID (from RFID)" value={cardUID} onChange={(e) => setCardUID(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
        <input placeholder="Label (e.g. My Metro Card)" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
        <button onClick={handleRegister} className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 text-sm">Register Card</button>
        {message && <p className="text-sm text-center">{message}</p>}
      </div>
      {cards.map((card) => (
        <div key={card._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div><p className="font-semibold text-gray-800">{card.label}</p><p className="text-xs text-gray-400 font-mono">{card.cardUID}</p></div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${card.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{card.status}</span>
            <button onClick={() => (card.status === "frozen" ? unfreezeCard(card.cardUID) : freezeCard(card.cardUID)).then(load)} className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-50">
              {card.status === "frozen" ? "Unfreeze" : "Freeze"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Rewards ──────────────────────────────────────────────────────────────────
function Rewards() {
  const [data, setData] = useState(null); const [walletInput, setWalletInput] = useState(""); const [claiming, setClaiming] = useState(null); const [message, setMessage] = useState("");
  const load = () => getUserProfile().then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const handleSaveWallet = async () => {
    try { await saveWalletAddress(walletInput); setMessage("✅ Wallet address saved"); load(); }
    catch { setMessage("❌ Invalid address"); }
  };
  const handleClaim = async (index) => {
    setClaiming(index); setMessage("");
    try { const { data: res } = await claimReward(index); setMessage(`✅ Reward claimed! Tx: ${res.txHash.slice(0, 18)}...`); load(); }
    catch (err) { setMessage(`❌ ${err.response?.data?.message || "Claim failed"}`); }
    setClaiming(null);
  };
  if (!data) return <p className="text-center text-gray-500 mt-10">Loading...</p>;
  const { user, milestones } = data;
  const claimedIndexes = user.rewardsClaimed.map((r) => r.milestoneIndex);
  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800">ETH Milestone Rewards</h2>
      {!user.walletAddress && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-yellow-800">Link your ETH wallet to claim rewards</p>
          <input placeholder="0x..." value={walletInput} onChange={(e) => setWalletInput(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
          <button onClick={handleSaveWallet} className="bg-yellow-400 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-yellow-500">Save Wallet</button>
        </div>
      )}
      {milestones.map((threshold, i) => {
        const reached = user.totalSpentINR >= threshold;
        const claimed = claimedIndexes.includes(i);
        return (
          <div key={i} className={`bg-white rounded-xl shadow p-4 flex items-center justify-between ${reached ? "border-l-4 border-indigo-500" : "opacity-60"}`}>
            <div>
              <p className="font-semibold text-gray-800">₹{threshold.toLocaleString()} Milestone</p>
              <p className="text-xs text-gray-500 mt-0.5">{claimed ? "Claimed ✓" : reached ? "Reward available!" : `Need ₹${(threshold - user.totalSpentINR).toFixed(0)} more`}</p>
            </div>
            {reached && !claimed && (
              <button onClick={() => handleClaim(i)} disabled={claiming === i || !user.walletAddress}
                className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {claiming === i ? "Claiming..." : "Claim ETH"}
              </button>
            )}
            {claimed && <span className="text-green-600 text-sm font-semibold">✓ Claimed</span>}
          </div>
        );
      })}
      {message && <p className="text-sm font-medium text-center">{message}</p>}
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
function Transactions() {
  const [txns, setTxns] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { getUserTransactions().then((r) => { setTxns(r.data.transactions); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <p className="text-center text-gray-500 mt-10">Loading...</p>;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
      {txns.length === 0 && <p className="text-gray-400 text-center mt-6">No transactions yet</p>}
      {txns.map((tx) => (
        <div key={tx._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-800">₹{tx.amount.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
            <p className="text-xs text-gray-400">Card: {tx.cardUID}</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tx.status === "success" ? "bg-green-100 text-green-700" : tx.status === "reversed" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{tx.status}</span>
        </div>
      ))}
    </div>
  );
}

// ─── UserApp (auth wrapper + sub-router) ─────────────────────────────────────
export default function UserApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session);
      if (session) await syncUser(session.user.user_metadata?.full_name || "User", session.user.email).catch(() => {});
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
          <Route path="topup" element={<TopUp />} />
          <Route path="cards" element={<Cards />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </div>
    </div>
  );
}

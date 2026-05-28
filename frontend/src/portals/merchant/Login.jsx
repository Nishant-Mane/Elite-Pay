import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { merchantLogin, merchantSignup } from "../../services/api";

export default function MerchantLogin() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", businessName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fn = mode === "login" ? merchantLogin : merchantSignup;
      const res = await fn(form);
      localStorage.setItem("ep_token", res.data.token);
      localStorage.setItem("ep_role", "merchant");
      localStorage.setItem("ep_merchant", JSON.stringify(res.data.merchant));
      navigate("/merchant");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(196,168,130,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="fade-in" style={{ width: "100%", maxWidth: 520, position: "relative" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--taupe)", textDecoration: "none", marginBottom: "1.75rem", fontWeight: 500 }}>
          ← Back to Home
        </Link>

        <div className="card" style={{ padding: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 32, height: 32, background: "var(--navy)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "var(--cream-txt)", fontWeight: 800, fontFamily: "Sora, sans-serif" }}>M</span>
            </div>
            <span style={{ fontWeight: 800, color: "var(--navy)", fontFamily: "Sora, sans-serif", fontSize: "1.1rem" }}>Elite<span style={{ color: "var(--taupe)" }}>.Pay</span></span>
          </div>
          <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.3rem" }}>
            {mode === "login" ? "Merchant Sign In" : "Register Business"}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--taupe)", marginBottom: "2rem" }}>Merchant Portal</p>

          <div style={{ display: "flex", background: "var(--bg-input)", borderRadius: 10, padding: "0.3rem", marginBottom: "1.75rem", gap: "0.3rem" }}>
            {["login", "signup"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "0.6rem", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", transition: "all 0.2s", background: mode === m ? "var(--navy)" : "transparent", color: mode === m ? "var(--cream-txt)" : "var(--taupe)" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {mode === "signup" && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" name="name" value={form.name} onChange={handle} placeholder="Owner name" required />
                </div>
                <div>
                  <label className="label">Business Name</label>
                  <input className="input" name="businessName" value={form.businessName} onChange={handle} placeholder="e.g. Chai Corner" required />
                </div>
              </>
            )}
            <div>
              <label className="label">Email Address</label>
              <input className="input" name="email" type="email" value={form.email} onChange={handle} placeholder="business@email.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
            </div>
            <div className="divider" style={{ margin: "0.25rem 0" }} />
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: "1rem", fontSize: "1rem", width: "100%" }}>
              {loading ? <span className="spinner" /> : (mode === "login" ? "Sign In" : "Register Business")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

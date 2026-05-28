import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userLogin, userSignup } from "../../services/api";

export default function UserLogin() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fn = mode === "login" ? userLogin : userSignup;
      const res = await fn(form);
      localStorage.setItem("ep_token", res.data.token);
      localStorage.setItem("ep_role", "user");
      localStorage.setItem("ep_user", JSON.stringify(res.data.user));
      navigate("/user");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* Ripple helper for Sign In button */
  const addRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const el = document.createElement("span");
    el.className = "ripple-circle";
    el.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(el);
    setTimeout(() => el.remove(), 600);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", position: "relative"
    }}>
      {/* Radial glow backdrop */}
      <div style={{
        position: "absolute", top: "35%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 400,
        background: "radial-gradient(ellipse, rgba(196,168,130,0.22) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{ width: "100%", maxWidth: 520, position: "relative" }}>
        {/* Back link */}
        <Link to="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          fontSize: "0.82rem", color: "var(--taupe)", textDecoration: "none",
          marginBottom: "1.75rem", fontWeight: 500,
          opacity: 0, animation: "fadeUp 0.35s 0.1s ease both"
        }}>
          ← Back to Home
        </Link>

        {/* Card — scale-up entrance */}
        <div
          className="card login-card-enter"
          style={{ padding: "2.5rem" }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <div style={{
              width: 32, height: 32, background: "var(--navy)", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: "var(--cream-txt)", fontWeight: 800, fontFamily: "Sora, sans-serif" }}>E</span>
            </div>
            <span style={{ fontWeight: 800, color: "var(--navy)", fontFamily: "Sora, sans-serif", fontSize: "1.1rem" }}>
              Elite<span style={{ color: "var(--taupe)" }}>.Pay</span>
            </span>
          </div>

          <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.3rem" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--taupe)", marginBottom: "2rem" }}>User Portal</p>

          {/* Segmented toggle */}
          <div style={{
            display: "flex", background: "var(--bg-input)", borderRadius: 10,
            padding: "0.3rem", marginBottom: "1.75rem", gap: "0.3rem"
          }}>
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "0.6rem", borderRadius: 8, border: "none",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  fontWeight: 600, fontSize: "0.875rem",
                  transition: "all 0.22s",
                  background: mode === m ? "var(--navy)" : "transparent",
                  color: mode === m ? "var(--cream-txt)" : "var(--taupe)",
                  transform: "scale(1)"
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {mode === "signup" && (
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input input-glow"
                  name="name"
                  value={form.name}
                  onChange={handle}
                  placeholder="John Doe"
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Email Address</label>
              <input
                className="input input-glow"
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input input-glow"
                name="password"
                type="password"
                value={form.password}
                onChange={handle}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="divider" style={{ margin: "0.25rem 0" }} />

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ padding: "1rem", fontSize: "1rem", width: "100%", position: "relative", overflow: "hidden" }}
              onClick={addRipple}
            >
              {loading ? <span className="spinner spinner-cream" /> : (mode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

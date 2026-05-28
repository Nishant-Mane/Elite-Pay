import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

/* ── NFC sonar card with concentric ripple rings ── */
function NFCAnimation() {
  return (
    <div style={{ position: "relative", width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[0, 0.65, 1.3].map((delay, i) => (
        <div key={i} className="nfc-ring" style={{ width: 110, height: 110, animationDelay: `${delay}s` }} />
      ))}
      {/* Card */}
      <div style={{
        width: 155, height: 100, background: "var(--navy)", borderRadius: 16,
        boxShadow: "0 16px 48px rgba(30,33,48,0.3), 0 2px 8px rgba(30,33,48,0.18)",
        position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "16px 18px", zIndex: 2
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ width: 30, height: 22, background: "linear-gradient(135deg,#c4a882,#e8ddd0)", borderRadius: 5 }} />
          <div style={{ width: 26, height: 26, opacity: 0.65 }}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5C5 9 8 6 12 6" stroke="#c4a882" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 12.5C3 7.8 7 4 12 4" stroke="#c4a882" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              <path d="M7 12.5C7 10.3 9.2 8.5 12 8.5" stroke="#c4a882" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              <circle cx="12" cy="12.5" r="2" fill="#c4a882"/>
            </svg>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: "rgba(240,233,223,0.5)", letterSpacing: 2, marginBottom: 3 }}>ELITE.PAY</div>
          <div style={{ fontSize: 10, color: "var(--cream-txt)", fontFamily: "monospace", letterSpacing: 1.5 }}>•••• •••• 4291</div>
        </div>
        {/* Shimmer sweep on card */}
        <div className="card-shimmer-layer" />
      </div>
    </div>
  );
}

/* ── Animated headline — word by word ── */
function AnimatedHeadline() {
  const lines = [
    { words: ["The", "Future", "of"], color: "var(--navy)" },
    { words: ["Contactless"], color: "var(--taupe)" },
    { words: ["Payments"], color: "var(--navy)" },
  ];
  let wordIndex = 0;

  return (
    <h1 style={{
      fontFamily: "Sora, sans-serif",
      fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
      fontWeight: 800,
      lineHeight: 1.15,
      marginBottom: "1.5rem",
      letterSpacing: "-0.02em"
    }}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: "block" }}>
          {line.words.map((word) => {
            const delay = wordIndex++ * 0.08 + 0.1;
            return (
              <span
                key={word + li}
                className="word-anim"
                style={{
                  color: line.color,
                  animationDelay: `${delay}s`,
                  marginRight: "0.35em"
                }}
              >
                {word}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/* ── Stat cards staggered ── */
function StatCards() {
  const stats = [
    { value: "<0.5s",    label: "Transaction Speed" },
    { value: "RFID+UPI", label: "Payment Methods" },
    { value: "3 Portals",label: "Role-Based Access" },
  ];
  return (
    <div style={{ display: "flex", background: "var(--navy)", borderRadius: 16, overflow: "hidden", maxWidth: 700 }}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="stat-animate"
          style={{
            flex: 1,
            padding: "1.85rem 2rem",
            borderLeft: i > 0 ? "1px solid rgba(196,168,130,0.18)" : "none",
            animationDelay: `${0.45 + i * 0.15}s`
          }}
        >
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--cream-txt)", fontFamily: "Sora, sans-serif", marginBottom: "0.3rem" }}>{s.value}</div>
          <div style={{ fontSize: "0.72rem", color: "#c4a882", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  /* Active nav tracking */
  const navItems = [
    { to: "/user/login", label: "User" },
    { to: "/merchant/login", label: "Merchant" },
    { to: "/admin", label: "Admin" },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* Ripple helper */
  const addRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const circle = document.createElement("span");
    circle.className = "ripple-circle";
    circle.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── Navbar — always navy ── */}
      <nav
        className="navbar-frosted"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "0.9rem 3rem",
          background: scrolled ? "#1e2130" : "#262b40",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(196,168,130,0.15)",
          boxShadow: scrolled ? "0 4px 28px rgba(0,0,0,0.25)" : "0 2px 16px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, background: "var(--cream-txt)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "var(--navy)", fontWeight: 800, fontSize: "1rem", fontFamily: "Sora, sans-serif" }}>E</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--cream-txt)", fontFamily: "Sora, sans-serif" }}>
            Elite<span style={{ color: "var(--gold)" }}>.Pay</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* User — ghost outline on dark */}
          <Link to="/user/login" style={{
            padding: "0.5rem 1.3rem", fontSize: "0.85rem",
            border: "1.5px solid rgba(240,233,223,0.3)",
            borderRadius: 8, color: "rgba(240,233,223,0.8)",
            textDecoration: "none", fontWeight: 600, fontFamily: "inherit",
            transition: "all 0.18s", background: "transparent"
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--cream-txt)"; e.currentTarget.style.color = "var(--cream-txt)"; e.currentTarget.style.background = "rgba(240,233,223,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(240,233,223,0.3)"; e.currentTarget.style.color = "rgba(240,233,223,0.8)"; e.currentTarget.style.background = "transparent"; }}>
            User
          </Link>
          {/* Merchant — ghost outline on dark */}
          <Link to="/merchant/login" style={{
            padding: "0.5rem 1.3rem", fontSize: "0.85rem",
            border: "1.5px solid rgba(240,233,223,0.3)",
            borderRadius: 8, color: "rgba(240,233,223,0.8)",
            textDecoration: "none", fontWeight: 600, fontFamily: "inherit",
            transition: "all 0.18s", background: "transparent"
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--cream-txt)"; e.currentTarget.style.color = "var(--cream-txt)"; e.currentTarget.style.background = "rgba(240,233,223,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(240,233,223,0.3)"; e.currentTarget.style.color = "rgba(240,233,223,0.8)"; e.currentTarget.style.background = "transparent"; }}>
            Merchant
          </Link>
          {/* Admin — gold filled, always pops */}
          <Link to="/admin" style={{
            padding: "0.5rem 1.3rem", fontSize: "0.85rem",
            background: "var(--gold)", borderRadius: 8,
            color: "var(--navy)", textDecoration: "none",
            fontWeight: 700, fontFamily: "inherit",
            border: "1.5px solid var(--gold)",
            transition: "all 0.18s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#d4b892"; e.currentTarget.style.borderColor = "#d4b892"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.transform = "none"; }}>
            Admin
          </Link>
        </div>
      </nav>


      {/* ── Hero ── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "7rem 3rem 4rem", maxWidth: 1280, margin: "0 auto", gap: "4rem"
      }}>
        <div style={{ flex: 1 }}>
          {/* RFID-Powered Payments · Live badge — breathing glow */}
          <div
            className="word-anim"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.55rem",
              background: "var(--navy)", borderRadius: 99, padding: "0.45rem 1.15rem",
              marginBottom: "1.75rem", animationDelay: "0s"
            }}
          >
            <span className="live-dot" />
            <span style={{ fontSize: "0.78rem", color: "var(--cream-txt)", fontWeight: 600, letterSpacing: "0.04em" }}>
              RFID-Powered Payments · Live
            </span>
          </div>

          {/* Staggered word-by-word headline */}
          <AnimatedHeadline />

          <p
            className="word-anim"
            style={{
              fontSize: "1.05rem", color: "var(--slate)", lineHeight: 1.75,
              marginBottom: "2.5rem", maxWidth: 480, animationDelay: "0.55s"
            }}
          >
            Elite.Pay connects your digital wallet to the physical world. Merchants set the amount — customers tap their RFID card. Instant, secure, seamless.
          </p>

          <div
            className="word-anim"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "3.5rem", animationDelay: "0.65s" }}
          >
            <Link to="/user/login" className="btn btn-primary" style={{ padding: "1rem 2.25rem", fontSize: "1rem" }} onClick={addRipple}>
              Get Started →
            </Link>
            <Link to="/merchant/login" className="btn btn-outline" style={{ padding: "1rem 2.25rem", fontSize: "1rem" }}>
              For Merchants
            </Link>
          </div>

          {/* Staggered stat cards */}
          <StatCards />
        </div>

        {/* NFC Animation */}
        <div
          className="word-anim"
          style={{ flex: "0 0 auto", animationDelay: "0.3s" }}
        >
          <NFCAnimation />
        </div>
      </section>

      <div className="divider" style={{ margin: "0 3rem" }} />

      {/* ── Portals ── */}
      <section style={{ padding: "5rem 3rem", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "2.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.75rem" }}>
            Choose Your Portal
          </h2>
          <p style={{ color: "var(--taupe)", fontSize: "1rem" }}>Purpose-built for each role in the Elite.Pay ecosystem</p>
        </div>

        <div className="grid-3">
          {[
            { to: "/user/login",     icon: "👤", title: "User Portal",     desc: "Access your wallet, top up via Razorpay, and pay at merchants by tapping your RFID card.", features: ["Wallet Balance", "Razorpay Top-Up", "RFID Card Payments", "Transaction History"], cta: "Open User Portal" },
            { to: "/merchant/login", icon: "🏪", title: "Merchant Portal",  desc: "Set the payment amount and accept instant contactless RFID payments from customers.",      features: ["POS Terminal", "Custom Amounts", "Live Collections Feed", "Revenue Dashboard"],   cta: "Open Merchant Portal" },
            { to: "/admin",          icon: "🛡️", title: "Admin Panel",      desc: "Full visibility into all users, merchants, and transactions across the platform.",           features: ["All Users & Merchants", "Transaction Audit Log", "Revenue Analytics", "Platform Overview"], cta: "Open Admin Panel" },
          ].map((p, idx) => (
            <Link key={p.to} to={p.to} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{
                  height: "100%", cursor: "pointer", border: "1.5px solid transparent",
                  transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
                  animation: `stat-slide-up 0.5s ease-out ${0.1 + idx * 0.12}s both`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 16px 48px rgba(30,33,48,0.16)";
                  e.currentTarget.style.borderColor = "var(--gold)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <div style={{ fontSize: "2.25rem", marginBottom: "1.25rem" }}>{p.icon}</div>
                <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.6rem", color: "var(--navy)" }}>{p.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--slate)", lineHeight: 1.65, marginBottom: "1.5rem" }}>{p.desc}</p>
                <div className="divider" style={{ marginBottom: "1.25rem" }} />
                <ul style={{ listStyle: "none", marginBottom: "1.75rem" }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ fontSize: "0.82rem", color: "var(--taupe)", padding: "0.28rem 0", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
                      <span style={{ color: "#c4a882", fontSize: "0.6rem" }}>◆</span> {f}
                    </li>
                  ))}
                </ul>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--navy)" }}>{p.cta} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="divider" style={{ margin: "0 3rem" }} />
      <footer style={{ padding: "2rem 3rem", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1280, margin: "0 auto" }}>
        <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "var(--navy)", fontSize: "1rem" }}>
          Elite<span style={{ color: "var(--taupe)" }}>.Pay</span>
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--taupe)" }}>© {new Date().getFullYear()} · RFID-Powered Contactless Payments</span>
      </footer>
    </div>
  );
}

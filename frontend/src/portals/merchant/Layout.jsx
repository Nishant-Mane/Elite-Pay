import React, { useEffect, useRef, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/merchant",              label: "Dashboard",    icon: "⊞" },
  { to: "/merchant/pos",          label: "POS Terminal", icon: "📡" },
  { to: "/merchant/transactions", label: "Transactions", icon: "📋" },
];

export default function MerchantLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bouncingIdx, setBouncingIdx] = useState(null);
  const [pillTop, setPillTop]         = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const linkRefs = useRef([]);

  useEffect(() => {
    const token = localStorage.getItem("ep_token");
    const role  = localStorage.getItem("ep_role");
    if (!token || role !== "merchant") navigate("/merchant/login");
  }, []);

  useEffect(() => {
    const activeIdx = navLinks.findIndex(l =>
      l.to === "/merchant" ? location.pathname === "/merchant" : location.pathname.startsWith(l.to)
    );
    if (linkRefs.current[activeIdx]) setPillTop(linkRefs.current[activeIdx].offsetTop + 8);
    setSidebarOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("ep_token");
    localStorage.removeItem("ep_role");
    localStorage.removeItem("ep_merchant");
    navigate("/merchant/login");
  };

  const merchant = JSON.parse(localStorage.getItem("ep_merchant") || "{}");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
        <span style={{ transform: sidebarOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
        <span style={{ opacity: sidebarOpen ? 0 : 1 }} />
        <span style={{ transform: sidebarOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
      </button>

      <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem", textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: "var(--cream-txt)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "var(--navy)", fontWeight: 900, fontSize: "0.9rem", fontFamily: "Sora, sans-serif" }}>M</span>
          </div>
          <span style={{ fontWeight: 800, color: "var(--cream-txt)", fontFamily: "Sora, sans-serif", fontSize: "1.05rem", whiteSpace: "nowrap" }}>
            Elite<span style={{ color: "var(--gold)" }}>.Pay</span>
          </span>
        </Link>

        <div style={{ padding: "0.75rem 1rem", background: "rgba(196,168,130,0.1)", borderRadius: 10, marginBottom: "1.5rem", border: "1px solid rgba(196,168,130,0.18)" }}>
          <div style={{ fontSize: "0.62rem", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>Business</div>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--cream-txt)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{merchant.businessName || "—"}</div>
        </div>

        <nav style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: pillTop, width: 3, height: 34, background: "var(--gold)", borderRadius: "0 3px 3px 0", transition: "top 0.35s cubic-bezier(0.34,1.56,0.64,1)", pointerEvents: "none" }} />
          {navLinks.map((link, i) => {
            const active = link.to === "/merchant" ? location.pathname === "/merchant" : location.pathname.startsWith(link.to);
            return (
              <Link key={link.to} ref={el => linkRefs.current[i] = el} to={link.to}
                onClick={() => { setBouncingIdx(i); setTimeout(() => setBouncingIdx(null), 400); }}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: 10, marginBottom: "0.3rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: active ? 600 : 400, background: active ? "rgba(240,233,223,0.1)" : "transparent", color: active ? "var(--cream-txt)" : "rgba(240,233,223,0.5)", transition: "all 0.18s", animation: bouncingIdx === i ? "bounce-icon 0.4s cubic-bezier(0.34,1.56,0.64,1)" : undefined }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "var(--cream-txt)"; e.currentTarget.style.background = "rgba(240,233,223,0.06)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "rgba(240,233,223,0.5)"; e.currentTarget.style.background = "transparent"; } }}>
                <span style={{ fontSize: "1.05rem" }}>{link.icon}</span> {link.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: "1px solid rgba(196,168,130,0.18)", paddingTop: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <div style={{ width: 32, height: 32, background: "rgba(240,233,223,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cream-txt)", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>
              {(merchant.name || "M")[0].toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--cream-txt)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{merchant.name}</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(240,233,223,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{merchant.email}</div>
            </div>
          </div>
          <button onClick={logout}
            style={{ width: "100%", padding: "0.55rem", fontSize: "0.8rem", background: "transparent", border: "1px solid rgba(196,168,130,0.25)", color: "rgba(240,233,223,0.55)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--cream-txt)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(196,168,130,0.25)"; e.currentTarget.style.color = "rgba(240,233,223,0.55)"; }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-with-sidebar"><Outlet /></main>
    </div>
  );
}

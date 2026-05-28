import React, { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/admin",              label: "Overview",         icon: "⊞" },
  { to: "/admin/users",        label: "Users",            icon: "👤" },
  { to: "/admin/merchants",    label: "Merchants",        icon: "🏪" },
  { to: "/admin/transactions", label: "All Transactions", icon: "📋" },
];

export default function AdminLayout() {
  const location = useLocation();
  const [bouncingIdx, setBouncingIdx] = useState(null);
  const [pillTop, setPillTop]         = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const linkRefs = useRef([]);

  useEffect(() => {
    const activeIdx = navLinks.findIndex(l =>
      l.to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(l.to)
    );
    if (linkRefs.current[activeIdx]) setPillTop(linkRefs.current[activeIdx].offsetTop + 8);
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
        <span style={{ transform: sidebarOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
        <span style={{ opacity: sidebarOpen ? 0 : 1 }} />
        <span style={{ transform: sidebarOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
      </button>

      <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "2.25rem", textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: "var(--cream-txt)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "var(--navy)", fontWeight: 900, fontSize: "0.9rem", fontFamily: "Sora, sans-serif" }}>A</span>
          </div>
          <div>
            <span style={{ fontWeight: 800, color: "var(--cream-txt)", fontFamily: "Sora, sans-serif", fontSize: "1.05rem", whiteSpace: "nowrap" }}>
              Elite<span style={{ color: "var(--gold)" }}>.Pay</span>
            </span>
            <span style={{ display: "block", fontSize: "0.62rem", color: "rgba(240,233,223,0.4)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin Console</span>
          </div>
        </Link>

        <nav style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: pillTop, width: 3, height: 34, background: "var(--gold)", borderRadius: "0 3px 3px 0", transition: "top 0.35s cubic-bezier(0.34,1.56,0.64,1)", pointerEvents: "none" }} />
          {navLinks.map((link, i) => {
            const active = link.to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(link.to);
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 32, height: 32, background: "rgba(196,168,130,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>A</div>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--cream-txt)" }}>Admin</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(240,233,223,0.4)" }}>Full access</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-with-sidebar"><Outlet /></main>
    </div>
  );
}

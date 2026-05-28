import React from "react";
import { Link } from "react-router-dom";

const TIERS = [
  {
    name: "Bronze",
    color: "#cd7f32",
    bg: "rgba(205,127,50,0.12)",
    threshold: 0,
    next: 1000,
    perks: [
      "Access to all Elite.Pay features",
      "RFID contactless payments",
      "Transaction history",
    ],
    icon: "🥉",
  },
  {
    name: "Silver",
    color: "#7a8a99",
    bg: "rgba(122,138,153,0.12)",
    threshold: 1000,
    next: 5000,
    perks: [
      "All Bronze perks",
      "Priority transaction processing",
      "Silver member badge",
    ],
    icon: "🥈",
  },
  {
    name: "Gold",
    color: "#c4a882",
    bg: "rgba(196,168,130,0.15)",
    threshold: 5000,
    next: 10000,
    perks: [
      "All Silver perks",
      "Reduced transaction fees",
      "Gold member badge",
      "Early access to new features",
    ],
    icon: "🥇",
  },
  {
    name: "Platinum",
    color: "#8b84d7",
    bg: "rgba(139,132,215,0.12)",
    threshold: 10000,
    next: null,
    perks: [
      "All Gold perks",
      "Zero transaction fees",
      "Platinum card design",
      "Priority support",
      "Exclusive merchant offers",
    ],
    icon: "💎",
  },
];

export default function Rewards() {
  const stored = JSON.parse(localStorage.getItem("ep_user") || "{}");
  const totalSpent = stored.totalSpentINR || 0;
  const currentTier = stored.rewardTier || "Bronze";

  const currentTierData = TIERS.find((t) => t.name === currentTier) || TIERS[0];
  const nextTierData = TIERS.find((t) => t.threshold > totalSpent);

  const progressToNext = nextTierData
    ? Math.min(((totalSpent - currentTierData.threshold) / (nextTierData.threshold - currentTierData.threshold)) * 100, 100)
    : 100;

  const amountToNext = nextTierData ? nextTierData.threshold - totalSpent : 0;

  return (
    <div className="page page-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">Rewards & Milestones</h1>
          <p className="page-sub">Your loyalty journey with Elite.Pay</p>
        </div>
        <Link to="/user/dashboard" style={{
          fontSize: "0.82rem", color: "var(--taupe)",
          textDecoration: "none", fontWeight: 600,
          padding: "0.5rem 1rem",
          border: "1px solid rgba(139,125,107,0.25)",
          borderRadius: 8
        }}>← Dashboard</Link>
      </div>

      {/* ── Current tier hero ── */}
      <div style={{
        background: currentTierData.bg,
        border: `1.5px solid ${currentTierData.color}33`,
        borderRadius: 20,
        padding: "2rem 2.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
        flexWrap: "wrap"
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--taupe)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.4rem" }}>
            Current Tier
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "2.5rem" }}>{currentTierData.icon}</span>
            <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 900, fontSize: "2rem", color: currentTierData.color }}>
              {currentTier}
            </span>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--taupe)" }}>
            Total spent: <strong style={{ color: "var(--navy)" }}>₹{totalSpent.toFixed(0)}</strong>
          </div>
        </div>

        {nextTierData ? (
          <div style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--taupe)", fontWeight: 600 }}>Progress to {nextTierData.name}</span>
              <span style={{ fontSize: "0.78rem", color: "var(--taupe)", fontWeight: 600 }}>{progressToNext.toFixed(0)}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(139,125,107,0.15)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${progressToNext}%`,
                background: `linear-gradient(90deg, ${currentTierData.color}, ${nextTierData.color})`,
                borderRadius: 99,
                transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)"
              }} />
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--taupe)", marginTop: "0.5rem" }}>
              Spend <strong style={{ color: "var(--navy)" }}>₹{amountToNext.toFixed(0)}</strong> more to reach {nextTierData.icon} {nextTierData.name}
            </div>
          </div>
        ) : (
          <div style={{
            background: "rgba(139,132,215,0.15)", border: "1px solid rgba(139,132,215,0.3)",
            borderRadius: 12, padding: "1rem 1.5rem", textAlign: "center"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>🏆</div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "#8b84d7", fontSize: "0.9rem" }}>
              Max Tier Reached!
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--taupe)", marginTop: "0.25rem" }}>You're a Platinum member</div>
          </div>
        )}
      </div>

      {/* ── All tiers ── */}
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {TIERS.map((tier, i) => {
          const isUnlocked = totalSpent >= tier.threshold;
          const isCurrent = tier.name === currentTier;
          return (
            <div
              key={tier.name}
              style={{
                background: isCurrent ? tier.bg : "var(--surface)",
                border: isCurrent
                  ? `2px solid ${tier.color}55`
                  : "1.5px solid rgba(139,125,107,0.12)",
                borderRadius: 16,
                padding: "1.5rem",
                opacity: isUnlocked ? 1 : 0.5,
                position: "relative",
                transition: "all 0.2s",
                animationDelay: `${i * 0.08}s`,
                animation: "fadeUp 0.4s ease both"
              }}
            >
              {isCurrent && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: tier.color, color: "#fff",
                  fontSize: "0.65rem", fontWeight: 700,
                  padding: "0.2rem 0.6rem", borderRadius: 99,
                  textTransform: "uppercase", letterSpacing: "0.07em"
                }}>
                  Current
                </div>
              )}
              {!isUnlocked && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(139,125,107,0.15)", color: "var(--taupe)",
                  fontSize: "0.65rem", fontWeight: 700,
                  padding: "0.2rem 0.6rem", borderRadius: 99
                }}>
                  🔒 Locked
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.75rem" }}>{tier.icon}</span>
                <div>
                  <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, color: tier.color, fontSize: "1.1rem" }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--taupe)" }}>
                    {tier.threshold === 0 ? "Starting tier" : `Unlock at ₹${tier.threshold.toLocaleString("en-IN")} spent`}
                  </div>
                </div>
              </div>

              <div className="divider" style={{ marginBottom: "0.875rem" }} />

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {tier.perks.map((perk) => (
                  <li key={perk} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: isUnlocked ? "var(--navy)" : "var(--taupe)" }}>
                    <span style={{ color: isUnlocked ? tier.color : "var(--taupe)", fontWeight: 700, fontSize: "0.9rem" }}>
                      {isUnlocked ? "✓" : "○"}
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ── CTA ── */}
      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💳</div>
        <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>
          Keep spending to unlock more rewards
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--taupe)", marginBottom: "1.25rem" }}>
          Use your RFID card at any Elite.Pay merchant to build your spending history.
        </p>
        <Link to="/user/topup" className="btn btn-primary" style={{ display: "inline-block", padding: "0.75rem 2rem" }}>
          Top Up Wallet
        </Link>
      </div>
    </div>
  );
}

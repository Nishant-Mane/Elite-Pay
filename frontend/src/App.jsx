import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Landing from "./pages/Landing";

import UserLogin from "./portals/user/Login";
import UserLayout from "./portals/user/Layout";
import UserDashboard from "./portals/user/Dashboard";
import UserTopUp from "./portals/user/TopUp";
import UserCards from "./portals/user/Cards";
import UserTransactions from "./portals/user/Transactions";
import UserRewards from "./portals/user/Rewards";

import MerchantLogin from "./portals/merchant/Login";
import MerchantLayout from "./portals/merchant/Layout";
import MerchantDashboard from "./portals/merchant/Dashboard";
import MerchantPOS from "./portals/merchant/POS";
import MerchantTransactions from "./portals/merchant/Transactions";

import AdminLayout from "./portals/admin/Layout";
import AdminDashboard from "./portals/admin/Dashboard";
import AdminUsers from "./portals/admin/Users";
import AdminMerchants from "./portals/admin/Merchants";
import AdminTransactions from "./portals/admin/Transactions";

/* ── Page transition wrapper — fade + upward slide on route change ── */
function PageTransition({ children }) {
  const location = useLocation();

  useEffect(() => {
    // Use View Transitions API if available
    if (document.startViewTransition) {
      document.startViewTransition(() => {});
    }
  }, [location.pathname]);

  return (
    <div
      key={location.pathname}
      style={{
        animation: "page-enter 0.3s ease-out both"
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Landing />} />

      {/* User */}
      <Route path="/user/login" element={<PageTransition><UserLogin /></PageTransition>} />
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<UserDashboard />} />
        <Route path="topup" element={<UserTopUp />} />
        <Route path="cards" element={<UserCards />} />
        <Route path="transactions" element={<UserTransactions />} />
        <Route path="rewards" element={<UserRewards />} />
      </Route>

      {/* Merchant */}
      <Route path="/merchant/login" element={<PageTransition><MerchantLogin /></PageTransition>} />
      <Route path="/merchant" element={<MerchantLayout />}>
        <Route index element={<MerchantDashboard />} />
        <Route path="pos" element={<MerchantPOS />} />
        <Route path="transactions" element={<MerchantTransactions />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="merchants" element={<AdminMerchants />} />
        <Route path="transactions" element={<AdminTransactions />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

import { publicRoutes } from "./publicRoutes";
import { adminRoutes } from "./adminRoutes";
import DashboardOverview from "@/pages/UserDashboard/DashboardOverview";
import PostManagerPage from "@/pages/UserDashboard/PostManagerPage";
import AccountManagement from "@/pages/UserDashboard/AccountManagement";
import PricingPage from "@/pages/UserDashboard/PricingPage";
import PurchagePostPage from "@/pages/UserDashboard/PurchagePostPage";
import OrderManagement from "@/pages/UserDashboard/OrderMangement";
import TransactionManagement from "@/pages/UserDashboard/TransactionManagement";
import DashboardNotFound from "@/pages/UserDashboard/DashboardNotFound";
export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route element={<PublicLayout />}>
        {publicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>

      {/* DASHBOARD */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="posts" element={<PostManagerPage />} />
        <Route path="account" element={<AccountManagement />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="purchase" element={<PurchagePostPage />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="transactions" element={<TransactionManagement />} />
        <Route path="*" element={<DashboardNotFound />} />

      </Route>

      {/* ADMIN */}
      {adminRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}

      <Route path="*" element={<div style={{ padding: 24 }}>404 Not Found</div>} />
    </Routes>
  );
}

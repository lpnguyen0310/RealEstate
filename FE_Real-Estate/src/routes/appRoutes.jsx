import { Routes, Route } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

import { publicRoutes } from "./publicRoutes";   // Home, Login, Register...
import { adminRoutes } from "./adminRoutes";     // superadmin (nếu có)
import DashboardOverview from "@/pages/UserDashboard/DashboardOverview";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Nhóm PUBLIC: có Header + Footer */}
      <Route element={<PublicLayout />}>
        {publicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>

      {/* Nhóm DASHBOARD: KHÔNG có Header + Footer */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        {/* sau này thêm các trang con ở đây */}
      </Route>

      {/* Admin (tuỳ bạn có layout riêng hay không) */}
      {adminRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}

      <Route path="*" element={<div style={{padding:24}}>404 Not Found</div>} />
    </Routes>
  );
}

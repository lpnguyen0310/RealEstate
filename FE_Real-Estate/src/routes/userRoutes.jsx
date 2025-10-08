import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardOverview from "@/pages/UserDashboard/DashboardOverview";
import AccountManagement from "@/pages/UserDashboard/AccountManagement";

export const userRoutes = [
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardOverview /> }, //dashboard
      { path: "account", element: <AccountManagement /> },
    ],
  },
];

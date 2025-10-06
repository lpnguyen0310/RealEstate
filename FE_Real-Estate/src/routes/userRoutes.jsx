import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardOverview from "@/pages/UserDashboard/DashboardOverview";

export const userRoutes = [
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardOverview /> }, //dashboard
    ],
  },
];

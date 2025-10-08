import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardOverview from "@/pages/UserDashboard/DashboardOverview";
import PostManagerPage from "@/pages/UserDashboard/PostManagerPage"; 
import AccountManagement from "@/pages/UserDashboard/AccountManagement";

export const userRoutes = [
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardOverview /> },
      { path: "posts", element: <PostManagerPage /> }, // /dashboard/posts
      { path: "account", element: <AccountManagement /> },
    ],
  },
];
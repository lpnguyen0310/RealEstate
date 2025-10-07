import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardOverview from "@/pages/UserDashboard/DashboardOverview";
import PostManagerPage from "@/pages/UserDashboard/PostManagerPage"; 

export const userRoutes = [
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardOverview /> },
      { path: "posts", element: <PostManagerPage /> }, // /dashboard/posts
    ],
  },
];
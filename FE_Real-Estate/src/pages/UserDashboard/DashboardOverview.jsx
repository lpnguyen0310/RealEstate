// src/pages/UserDashboard/DashboardOverview.jsx
import { useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  UserHeader,
  UserStats,
  PostsReportCard,
  SavedListCard,
  NotificationsCard,
  PostsChartCard,
  PostTypeSummary,
} from "../../components/dashboard/dashboardoverview";

import {
  fetchMyPropertiesThunk,
  selectPostsReport,
} from "@/store/propertySlice";

// Favorites (đọc trực tiếp từ favoriteSlice)
import {
  selectList as selectFavList,
  selectIds as selectFavIds,
} from "@/store/favoriteSlice";

export default function DashboardOverview() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { user: reduxUser } = useOutletContext();

  // Load "tin của tôi" cho dashboard
  useEffect(() => {
    dispatch(fetchMyPropertiesThunk({ page: 0, size: 20, sort: "postedAt,desc" }));
  }, [dispatch]);

  // User info
  const user = useMemo(() => {
    if (!reduxUser) {
      return { name: "Người dùng", email: "", phone: "", avatarUrl: "", balance: 0 };
    }
    const name =
      reduxUser.fullName ||
      `${reduxUser.firstName ?? ""} ${reduxUser.lastName ?? ""}`.trim() ||
      reduxUser.email ||
      "Người dùng";
    return {
      name,
      email: reduxUser.email || "",
      phone: reduxUser.phone || reduxUser.phoneNumber || "",
      avatarUrl: reduxUser.avatarUrl || "",
      balance: reduxUser.balance ?? 0,
    };
  }, [reduxUser]);

  // Favorites (REAL DATA từ Redux)
  const favList = useSelector(selectFavList); // [{id,title,thumb,href,priceDisplay,displayAddress,...}]
  const favCount = useSelector(selectFavIds).length;

  // Convert to SavedListCard items (lấy tối đa 5 tin)
  const savedItems = useMemo(
    () =>
      (favList || []).slice(0, 5).map((p) => ({
        id: p.id,
        image: p.thumb,
        title: p.title,
        subtitle: p.displayAddress || p.address || "",
        type: p.listingType || "",
        href: p.href || "",
        price: p.priceDisplay || p.priceText || "",
        savedAgo: p.savedAgo,
      })),
    [favList]
  );

  // Stats (REAL saved count)
  const stats = useMemo(
    () => ({
      saved: favCount ?? 0,
      messages: 0,
      posts: 0,
      tours: 0,
    }),
    [favCount]
  );

  // Report (REAL from Redux)
  const report = useSelector(selectPostsReport);

  // Other blocks tạm
  const sellSummary = { views: 0, interactions: 0, potential: 0 };
  const rentSummary = { views: 0, interactions: 0, potential: 0 };

  const notifications = [
    {
      id: 1,
      avatar: "https://i.pravatar.cc/80?img=12",
      text: "Bạn đã cập nhật tất cả thông tin của ngày hôm nay 👏",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header hồ sơ */}
      <UserHeader user={user} />

      {/* Thống kê tổng quan */}
      <UserStats
        data={stats}
        loading={false}
        onClickCard={(key) => {
          if (key === "saved") nav("/tin-da-luu");
          if (key === "posts") nav("/user/posts");
          if (key === "messages") nav("/user/messages");
          if (key === "tours") nav("/user/tours");
        }}
      />

      {/* Mobile ưu tiên Saved / Notifications trước, Report sau */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="order-2 md:order-1">
          <SavedListCard
            items={savedItems}
            emptyHint="Bạn chưa lưu tin nào — hãy khám phá và lưu những tin bạn thích!"
            onItemClick={(it) => it.href && nav(it.href)}
            onViewAll={() => nav("/tin-da-luu")}
            maxItems={5}
          />
        </div>

        <div className="order-3 md:order-2">
          <NotificationsCard items={notifications} />
        </div>

        <div className="order-1 md:order-3">
          {/* Báo cáo tin đăng — đã nối data thật */}
          <PostsReportCard data={report} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-5">
          <PostTypeSummary sell={sellSummary} rent={rentSummary} />
        </div>
        <div className="lg:col-span-7">
          <PostsChartCard defaultMode="day" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-2 sm:mb-3">Tổng quan</h1>
        <p className="text-sm sm:text-base">Xin chào! Đây là bảng điều khiển của bạn.</p>
      </div>
    </div>
  );
}

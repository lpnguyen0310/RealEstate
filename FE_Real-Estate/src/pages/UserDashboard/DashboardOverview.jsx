// src/pages/UserDashboard/DashboardOverview.jsx
import { useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import useFavorites from "@/hooks/useFavorites"; // ⬅️ NEW
import {
  UserHeader,
  UserStats,
  PostsReportCard,
  SavedListCard,
  NotificationsCard,
  PostsChartCard,
  PostTypeSummary,
} from "../../components/dashboard/dashboardoverview";

export default function DashboardOverview() {
  const nav = useNavigate();
  const { user: reduxUser } = useOutletContext();

  // ===== User info =====
  const user = useMemo(() => {
    if (!reduxUser) {
      return { name: "Người dùng", email: "", phone: "", avatarUrl: "" };
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
    };
  }, [reduxUser]);

  // ===== Favorites (REAL DATA) =====
  const { list: favList, count: favCount } = useFavorites(); // ⬅️ from store

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
        price: p.priceDisplay || p.priceText || "", // nếu cần show giá trong SavedListCard
        savedAgo: p.savedAgo,
      })),
    [favList]
  );

  // ===== Stats (REAL saved count) =====
  const stats = useMemo(
    () => ({
      saved: favCount ?? 0,
      messages: 0, // TODO: map từ redux/messages nếu có
      posts: 0,    // TODO: map số tin đã đăng của user
      tours: 0,    // TODO: map lịch hẹn nếu có
    }),
    [favCount]
  );

  // ===== Other blocks (giữ nguyên tạm) =====
  const sellSummary = { views: 0, interactions: 0, potential: 0 };
  const rentSummary = { views: 0, interactions: 0, potential: 0 };

  const notifications = [
    {
      id: 1,
      avatar: "https://i.pravatar.cc/80?img=12",
      text: "Bạn đã cập nhật tất cả thông tin của ngày hôm nay 👏",
    },
  ];

  const report = {
    active: 0,
    pending: 0,
    expiring: 0,
    auto: { total: 0, premium: 0, vip: 0, normal: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header hồ sơ (đọc từ Redux qua Outlet) */}
      <UserHeader user={user} />

      {/* Thống kê tổng quan (đã đổ dữ liệu thật cho Tin đã lưu) */}
      <UserStats
        data={stats}
        loading={false}
        onClickCard={(key) => {
          // điều hướng nhanh khi click thẻ stats
          if (key === "saved") nav("/tin-da-luu");
          if (key === "posts") nav("/user/posts");
          if (key === "messages") nav("/user/messages");
          if (key === "tours") nav("/user/tours");
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PostsReportCard data={report} />
        <SavedListCard
          items={savedItems}
          emptyHint="Bạn chưa lưu tin nào — hãy khám phá và lưu những tin bạn thích!"
          onItemClick={(it) => it.href && nav(it.href)}
          onViewAll={() => nav("/tin-da-luu")}
          maxItems={5}
        />
        <NotificationsCard items={notifications} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <PostTypeSummary sell={sellSummary} rent={rentSummary} />
        </div>
        <div className="lg:col-span-7">
          <PostsChartCard defaultMode="day" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-3">Tổng quan</h1>
        <p>Xin chào! Đây là bảng điều khiển của bạn.</p>
      </div>
    </div>
  );
}

import { UserHeader, UserStats, PostsReportCard, SavedListCard, NotificationsCard, PostsChartCard, PostTypeSummary } from "../../components/dashboard/dashboardoverview";
export default function DashboardOverview() {
  const user = {
    name: "Nguyên Lê",
    email: "phuocnguyenlea04@gmail.com",
    phone: "0364 794 955",
  };
  const stats = { saved: 8, messages: 3, posts: 0, tours: 1 };
  const sellSummary = { views: 0, interactions: 0, potential: 0 };
  const rentSummary = { views: 0, interactions: 0, potential: 0 };
  const savedItems = [
    {
      id: 1, image: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2d52?q=80&w=600",
      title: "123 Main St", subtitle: "Los Angeles, CA", type: "Nhà riêng"
    },
    {
      id: 2, image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=600",
      title: "456 Ean St", subtitle: "San Francisco, CA", type: "Căn hộ"
    },
    {
      id: 3, image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=600",
      title: "709 Cak St", subtitle: "Austin, TX", type: "Nhà phố"
    },
  ];

  const notifications = [
    { id: 1, avatar: "https://i.pravatar.cc/80?img=12", text: "Bạn đã cập nhật tất cả thông tin của ngày hôm nay 👏" },
  ];

  const report = {
    active: 0,
    pending: 0,
    expiring: 0,
    auto: { total: 0, premium: 0, vip: 0, normal: 0 },
  };
  return (
    <div className=" space-y-6">
      {/* Header hồ sơ */}
      <UserHeader user={user} />
      {/* Thống kê tổng quan */}
      <UserStats
        data={stats}
        loading={false}
        onPostClick={() => console.log("Đi đến trang đăng tin")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PostsReportCard data={report} />
        <SavedListCard items={savedItems} />
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

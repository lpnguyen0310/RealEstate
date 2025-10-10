export const USER_MENU_ITEMS = [
  { icon: "🏠", text: "Tổng quan", to: "/dashboard", badge: "Mới" },
  { icon: "📝", text: "Quản lý tin đăng", to: "/dashboard/posts" },
  { icon: "🎯", text: "Gói hội viên", to: "/dashboard/pricing", badge2: "Tiết kiệm đến -39%" },
  { icon: "👥", text: "Quản lý khách hàng", to: "/dashboard/customers" },   // nếu chưa có route thì thêm sau
  { icon: "💼", text: "Quản lý tin tài trợ", to: "/dashboard/sponsored" },   // nếu chưa có route thì thêm sau
  { icon: "👤", text: "Thay đổi thông tin", to: "/dashboard/account" },
  { icon: "🔒", text: "Thay đổi mật khẩu", to: "/dashboard/account#password" },
  { icon: "🏅", text: "Môi giới chuyên nghiệp", to: "/dashboard/agent", badge: "Mới" },
  { icon: "💰", text: "Nạp tiền", to: "/dashboard/wallet/topup" },
];
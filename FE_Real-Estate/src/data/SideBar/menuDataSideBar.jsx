import {
    HomeOutlined,
    CreditCardOutlined,
    FileTextOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    ScheduleOutlined,
    DollarCircleOutlined,
    BookOutlined,
    ShoppingOutlined,
    SafetyOutlined,
    TrophyOutlined,
} from "@ant-design/icons";

export const MENUS = [
    { to: "/dashboard", text: "Tổng quan", icon: <HomeOutlined /> },
    { to: "/dashboard/purchase", text: "Mua tin", icon: <CreditCardOutlined /> },
    { to: "/dashboard/posts", text: "Tin đăng", icon: <FileTextOutlined /> },
    { to: "/dashboard/cart", text: "Giỏ hàng", icon: <ShoppingCartOutlined /> },
    { to: "/dashboard/customers", text: "Khách mua/thuê", icon: <TeamOutlined /> },
    { to: "/dashboard/partner", text: "Hợp tác", icon: <ThunderboltOutlined /> },
    { to: "/dashboard/orders", text: "Quản lý đơn hàng", icon: <ScheduleOutlined /> },
    { to: "/dashboard/transactions", text: "Lịch sử giao dịch", icon: <DollarCircleOutlined /> },
    { to: "/dashboard/guide", text: "Hướng dẫn", icon: <BookOutlined /> },
    { to: "/dashboard/pricing", text: "Bảng giá đăng tin", icon: <ShoppingOutlined /> },
    { to: "/dashboard/privacy", text: "Chính sách bảo mật", icon: <SafetyOutlined /> },
    { to: "/dashboard/ranking", text: "Bảng xếp hạng", icon: <TrophyOutlined /> },
];

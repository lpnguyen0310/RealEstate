// src/components/menu/NotificationBell.jsx
import React, { useState, useMemo, useRef, useEffect } from "react"; // 1. Import thêm useRef
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Badge, Dropdown, List, Spin, Typography, Tabs, Avatar } from "antd";
import {
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  NotificationOutlined,
  FileTextOutlined,
  WarningOutlined,
  ShopOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/services/notificationApi";
import TimeAgo from "react-timeago";

const { Text } = Typography;

// Hàm helper để map NotificationType sang Icon
const getIconForType = (type) => {
  switch (type) {
    case "POST_WARNING":
return <WarningOutlined className="text-red-500" />;
    case "ORDER_PENDING":
      return <ClockCircleOutlined className="text-yellow-500" />;
    case "PACKAGE_PURCHASED":
      return <CheckCircleOutlined className="text-green-500" />;
    case "NEW_ORDER_PAID":
      return <DollarCircleOutlined className="text-blue-500" />;
    case "LISTING_APPROVED":
      return <FileTextOutlined className="text-green-500" />;
    case "LISTING_REJECTED":
      return <WarningOutlined className="text-red-500" />;
    case "CATALOG_UPDATED":
      return <ShopOutlined className="text-purple-500" />;
    case "NEW_USER_REGISTERED":
      return <UserAddOutlined className="text-blue-500" />;
    default:
      return <NotificationOutlined className="text-gray-500" />;
  }
};

// Định nghĩa các tab
const TABS = {
  ALL: "Tất cả",
  FINANCE: "Tài chính",
  LISTING: "Tin đăng",
  SYSTEM: "Hệ thống",
};

// Định nghĩa các type cho từng tab
const TAB_TYPES = {
  FINANCE: ["ORDER_PENDING", "PACKAGE_PURCHASED", "NEW_ORDER_PAID"],
  // SỬA DÒNG NÀY: Thêm LISTING_PENDING_USER
  LISTING: ["LISTING_APPROVED", "LISTING_REJECTED", "NEW_LISTING_PENDING", "LISTING_PENDING_USER", "POST_WARNING"],
  SYSTEM: ["CATALOG_UPDATED", "NEW_USER_REGISTERED"],
};

export default function NotificationBell() {
  const nav = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  
  // 2. Tạo một 'ref' để đánh dấu việc click vào item
  const itemClickedRef = useRef(false);

  const isAuthenticated = useSelector((s) => s.auth.user != null);

  // --- RTK Query Hooks ---
  const { data: unreadCount = 0 } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 300000,
  });

  const { data: items = [], isLoading, refetch } = useGetNotificationsQuery(undefined, {
skip: !isAuthenticated || !isOpen,
  });

  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markAsRead] = useMarkAsReadMutation();

  useEffect(() => {
// Khi dropdown được mở (isOpen = true)
// và component đã render lại, hãy gọi refetch.
if (isOpen) {
  refetch();
}
  }, [isOpen, refetch]);

  // --- Memo ---
  const filteredItems = useMemo(() => {
    if (activeTab === "ALL") {
      return items;
    }
    const typesForTab = TAB_TYPES[activeTab] || [];
    return items.filter((item) => typesForTab.includes(item.type));
  }, [items, activeTab]);

  // --- Handlers (Đã cập nhật) ---
  const handleOpenChange = (open) => {
    setIsOpen(open); 
    
    // 3. Logic đã sửa:
    // Chỉ "đọc tất cả" khi người dùng đóng (open=false)
    // VÀ họ KHÔNG PHẢI vừa click vào 1 item (ref=false)
    if (!open && unreadCount > 0 && !itemClickedRef.current) { 
      markAllAsRead();
    }
    
    if (open) { 
      setActiveTab("ALL");
    }
    
    // Luôn reset cờ sau khi xử lý xong
    itemClickedRef.current = false;
  };

  const handleItemClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // 4. Đánh dấu là "tôi vừa click vào item"
    itemClickedRef.current = true;
    
    nav(notification.link);
    setIsOpen(false);
  };

  // --- Render ---
  const renderDropdownContent = () => (
    <div className="bds-submenu bg-white shadow-xl rounded-lg w-[400px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Text strong className="text-lg">Thông báo</Text>
      </div>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="ALL"
        onChange={setActiveTab}
        centered
        items={[
          { key: "ALL", label: TABS.ALL },
          { key: "FINANCE", label: TABS.FINANCE },
          { key: "LISTING", label: TABS.LISTING },
          { key: "SYSTEM", label: TABS.SYSTEM },
        ]}
      />

      {/* Danh sách */}
      {isLoading ? (
        <div className="flex justify-center items-center h-[200px]">
          <Spin />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex justify-center items-center h-[200px]">
          <Text type="secondary">Không có thông báo nào trong mục này.</Text>
        </div>
      ) : (
        <List
          dataSource={filteredItems}
          className="max-h-[400px] overflow-y-auto hide-scrollbar"
          renderItem={(item) => (
            <List.Item
              onClick={() => handleItemClick(item)}
              className={`
                  py-3 cursor-pointer transition-colors duration-150
                  ${!item.read ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}
              `}
              // Sửa lại padding bằng style
              style={{ paddingLeft: 24, paddingRight: 24 }} 
              // extra={!item.read && <Badge status="processing" />}
            >
              <List.Item.Meta
                avatar={
                    <Avatar
                        icon={getIconForType(item.type)}
                        // Phân biệt nền avatar
                        className={!item.read ? "bg-white" : "bg-gray-100"} 
                    />
                }
                title={
                    <Text
                        // Bỏ 'strong', dùng class của Tailwind
                        className={`
                            !mb-0 whitespace-pre-line
                            ${!item.read ? "font-semibold text-gray-900" : "font-normal text-gray-500"}
                        `} // <-- THAY ĐỔI Ở ĐÂY
                    >
                        {item.message}
                        {/* Thêm chấm xanh vào đây cho đẹp hơn */}
                        {!item.read && (
                            <span 
                                className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2" 
                                title="Chưa đọc"
                            />
                        )}
                    </Text>
                }
                description={
                    <Text 
                        type="secondary" 
                        // Phân biệt màu của thời gian
                        className={`text-xs ${!item.read ? "!text-blue-600" : ""}`} // <-- THAY ĐỔI Ở ĐÂY
                    >
                        <TimeAgo date={item.createdAt} />
                    </Text>
                }
            />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  // Chỉ hiện chuông khi đã đăng nhập
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dropdown
      dropdownRender={renderDropdownContent}
      trigger={["click"]}
      placement="bottomRight"
      open={isOpen}
      onOpenChange={handleOpenChange}
      getPopupContainer={(node) => node.parentElement}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 6]}>
        <BellOutlined className="text-[25px] text-gray-800 cursor-pointer hover:text-[#d6402c]" />
      </Badge>
    </Dropdown>
  );
}
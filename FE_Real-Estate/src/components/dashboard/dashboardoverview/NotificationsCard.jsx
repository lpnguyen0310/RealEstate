// src/components/dashboard/dashboardoverview/NotificationsCard.jsx
import React, { useMemo, useState } from "react";
import { List, Typography, Avatar, Spin, Button, Modal, Tabs } from "antd";
import {
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
  DollarCircleOutlined,
  NotificationOutlined,
  ShopOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import TimeAgo from "react-timeago";

import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
} from "@/services/notificationApi";

const { Text } = Typography;

// ==== ICON THEO TYPE (đồng bộ với NotificationBell) ====
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

// ==== ĐỊNH NGHĨA TAB & TYPE (y chang bên NotificationBell) ====
const TABS = {
  ALL: "Tất cả",
  FINANCE: "Tài chính",
  LISTING: "Tin đăng",
  SYSTEM: "Hệ thống",
};

const TAB_TYPES = {
  FINANCE: ["ORDER_PENDING", "PACKAGE_PURCHASED", "NEW_ORDER_PAID"],
  LISTING: [
    "LISTING_APPROVED",
    "LISTING_REJECTED",
    "NEW_LISTING_PENDING",
    "LISTING_PENDING_USER",
    "POST_WARNING",
  ],
  SYSTEM: ["CATALOG_UPDATED", "NEW_USER_REGISTERED"],
};

export default function NotificationsCard() {
  const { data: notifications = [], isLoading } = useGetNotificationsQuery();
  const [markAllAsRead, { isLoading: isMarking }] = useMarkAllAsReadMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");

  // ==== Lọc theo tab ====
  const filteredNotifications = useMemo(() => {
    if (activeTab === "ALL") return notifications;
    const typesForTab = TAB_TYPES[activeTab] || [];
    return (notifications || []).filter((n) => typesForTab.includes(n.type));
  }, [notifications, activeTab]);

  const renderList = (mode = "card", data) => {
    // data là list đã lọc theo tab
    const listData = data ?? filteredNotifications;

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[200px]">
          <Spin />
        </div>
      );
    }

    if (!listData || listData.length === 0) {
      return (
        <div className="flex justify-center items-center h-[200px]">
          <Text type="secondary">Không có thông báo nào trong mục này.</Text>
        </div>
      );
    }

    const maxHeightClass =
      mode === "modal" ? "max-h-[600px]" : "max-h-[400px]";

    return (
      <List
        dataSource={listData}
        className={`${maxHeightClass} overflow-y-auto hide-scrollbar`}
        renderItem={(item) => (
          <List.Item
            className={`py-3 cursor-pointer transition-colors duration-150 ${!item.read
                ? "bg-blue-50 hover:bg-blue-100"
                : "hover:bg-gray-50"
              }`}
            style={{ paddingLeft: 24, paddingRight: 24 }}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  icon={getIconForType(item.type)}
                  className={!item.read ? "bg-white" : "bg-gray-100"}
                />
              }
              title={
                <Text
                  className={`!mb-0 whitespace-pre-line ${!item.read
                      ? "font-semibold text-gray-900"
                      : "font-normal text-gray-500"
                    }`}
                >
                  {item.message}
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
                  className={`text-xs ${!item.read ? "!text-blue-600" : ""
                    }`}
                >
                  <TimeAgo date={item.createdAt} />
                </Text>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const handleViewAllClick = async () => {
    setIsModalOpen(true);

    // Đánh dấu tất cả đã đọc (nếu còn unread)
    const hasUnread = notifications.some((n) => !n.read);
    if (hasUnread) {
      try {
        await markAllAsRead().unwrap();
      } catch (err) {
        console.error("Mark all as read failed:", err);
      }
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-[#f5f7fb] p-4 border border-[#e8edf6]">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
          <Text className="text-xl font-semibold text-[#1c396a]">
            Thông báo
          </Text>
          <Button
            type="link"
            onClick={handleViewAllClick}
            loading={isMarking}
          >
            Xem tất cả
          </Button>
        </div>

        {/* Bản rút gọn trong card: chỉ hiển thị 5 thông báo mới nhất (tab ALL) */}
        {renderList(
          "card",
          (notifications || []).slice(0, 5) // card nhỏ chỉ cần top 5
        )}
      </div>

      {/* Modal hiển thị tất cả + Tabs phân loại */}
      <Modal
        title="Tất cả thông báo"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        {/* Tabs giống NotificationBell */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            { key: "ALL", label: TABS.ALL },
            { key: "FINANCE", label: TABS.FINANCE },
            { key: "LISTING", label: TABS.LISTING },
            { key: "SYSTEM", label: TABS.SYSTEM },
          ]}
        />

        {renderList("modal")}
      </Modal>
    </>
  );
}

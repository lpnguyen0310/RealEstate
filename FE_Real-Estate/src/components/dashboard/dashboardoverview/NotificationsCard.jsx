import React from "react";
import { useSelector } from "react-redux";
import { List, Typography, Avatar, Spin, Badge, Button } from "antd";
import { useGetNotificationsQuery } from "@/services/notificationApi"; // Import API hook
import { BellOutlined, ClockCircleOutlined, CheckCircleOutlined, FileTextOutlined, WarningOutlined } from "@ant-design/icons";
import TimeAgo from "react-timeago";

// Helper function to map notification type to icon
const getIconForType = (type) => {
  switch (type) {
    case "POST_WARNING":
      return <WarningOutlined className="text-red-500" />;
    case "ORDER_PENDING":
      return <ClockCircleOutlined className="text-yellow-500" />;
    case "PACKAGE_PURCHASED":
      return <CheckCircleOutlined className="text-green-500" />;
    case "NEW_ORDER_PAID":
      return <CheckCircleOutlined className="text-blue-500" />;
    case "LISTING_APPROVED":
      return <FileTextOutlined className="text-green-500" />;
    default:
      return <BellOutlined className="text-gray-500" />;
  }
};

const { Text } = Typography;

export default function NotificationsCard() {
  const { data: notifications = [], isLoading } = useGetNotificationsQuery(); // Fetch notifications

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[200px]">
          <Spin />
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex justify-center items-center h-[200px]">
          <Text type="secondary">Không có thông báo nào.</Text>
        </div>
      );
    }

    return (
      <List
        dataSource={notifications}
        className="max-h-[400px] overflow-y-auto hide-scrollbar"
        renderItem={(item) => (
          <List.Item
            className={`py-3 cursor-pointer transition-colors duration-150 ${!item.read ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
              }`}
            style={{ paddingLeft: 24, paddingRight: 24 }}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  icon={getIconForType(item.type)} // Add icon based on notification type
                  className={!item.read ? "bg-white" : "bg-gray-100"}
                />
              }
              title={
                <Text
                  className={`!mb-0 whitespace-pre-line ${!item.read ? "font-semibold text-gray-900" : "font-normal text-gray-500"
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
                <Text type="secondary" className={`text-xs ${!item.read ? "!text-blue-600" : ""}`}>
                  <TimeAgo date={item.createdAt} />
                </Text>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  return (
    <div className="rounded-2xl bg-[#f5f7fb] p-4 border border-[#e8edf6]">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <Text className="text-xl font-semibold text-[#1c396a]">Thông báo</Text>
        <Button type="link" onClick={() => {/* Handle "Mark All as Read" */ }}>
          Xem tất cả
        </Button>
      </div>

      {/* Notifications Content */}
      {renderContent()}
    </div>
  );
}

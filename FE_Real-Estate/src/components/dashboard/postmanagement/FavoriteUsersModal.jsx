import React from 'react';
// ⭐️ Thêm Divider và Empty
import { Modal, List, Avatar, Spin, Button, Typography, Divider, Empty } from "antd";
import { MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Component Modal hiển thị danh sách người dùng đã yêu thích tin đăng.
 * @param {object} props
 * @param {boolean} props.isOpen Trạng thái mở/đóng modal.
 * @param {function} props.onClose Hàm callback khi đóng modal.
 * @param {Array} props.users Danh sách người dùng (UserFavoriteDTO).
 * @param {boolean} props.isLoading Trạng thái đang tải dữ liệu.
 * @param {string|null} props.error Thông báo lỗi (nếu có).
 */
const FavoriteUsersModal = ({
  isOpen,
  onClose,
  users = [],
  isLoading,
  error,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-700"> {/* Style title */}
          <UserOutlined />
          <span>Khách hàng đã yêu thích ({users?.length || 0})</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="rounded-lg"> {/* Style button */}
          Đóng
        </Button>,
      ]}
      destroyOnClose
      maskClosable={false}
      width={600}
      // ⭐️ Bỏ viền padding mặc định của Modal body để List chiếm toàn bộ
      bodyStyle={{ padding: 0 }}
    >
      {isLoading ? (
        // ⭐️ Canh giữa Spinner và thêm khoảng cách
        <div className="text-center p-12">
          <Spin size="large" />
        </div>
      ) : error ? (
        // ⭐️ Style lại thông báo lỗi
        <div className="text-red-600 bg-red-50 p-6 text-center rounded-b-lg">
          <p className="font-semibold mb-1">Đã xảy ra lỗi</p>
          <p>Không thể tải danh sách người yêu thích. Lỗi: {error}</p>
        </div>
      ) : (
        <List
          // ⭐️ Thêm padding cho List thay vì Modal body
          className="max-h-[60vh] overflow-y-auto p-4 md:p-6" // Thêm padding p-4/p-6
          itemLayout="horizontal"
          dataSource={users || []}
          // ⭐️ Thêm đường kẻ phân cách
          renderItem={(user, index) => (
            <>
              {/* Chỉ thêm Divider nếu không phải là item đầu tiên */}
              {index > 0 && <Divider className="my-3" />}
              <List.Item
                key={user.id}
                className="!p-0" // Bỏ padding mặc định của List.Item
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48} // Tăng kích thước Avatar
                      icon={<UserOutlined />}
                      src={user.avatarUrl} // Lấy avatar nếu có
                      className="bg-blue-100 text-blue-600 flex items-center justify-center" // Style Avatar
                    >
                      {/* Chữ cái đầu */}
                      {user.fullName?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                  }
                  title={<span className="font-semibold text-base text-gray-800">{user.fullName || 'Người dùng ẩn'}</span>}
                  description={
                    // ⭐️ Tăng khoảng cách và dùng màu tinh tế hơn
                    <div className="text-gray-500 text-sm space-y-2 mt-1.5">
                      {user.email && (
                        <div className="flex items-center gap-2 group">
                          <MailOutlined className="text-gray-400 group-hover:text-blue-500 transition-colors"/>
                          <Text copyable={{ text: user.email }} className="text-gray-600 group-hover:text-blue-500 transition-colors">{user.email}</Text>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 group">
                          <PhoneOutlined className="text-gray-400 group-hover:text-green-500 transition-colors"/>
                          <Text copyable={{ text: user.phone }} className="text-gray-600 group-hover:text-green-500 transition-colors">{user.phone}</Text>
                        </div>
                      )}
                      {!user.email && !user.phone && (
                          <span className="text-gray-400 italic">Không có thông tin liên hệ</span>
                      )}
                    </div>
                  }
                />
              </List.Item>
            </>
          )}
          // ⭐️ Dùng Empty component của Antd khi rỗng
          locale={{
              emptyText: <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                      <span className="text-gray-500">Chưa có ai yêu thích tin đăng này.</span>
                  }
              />
          }}
        />
      )}
    </Modal>
  );
};

export default FavoriteUsersModal;


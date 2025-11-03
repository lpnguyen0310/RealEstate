// src/components/dashboard/postmanagement/WarningModal.js
import { Modal, Typography, Button, Space } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * Modal (phiên bản Antd) để hiển thị cảnh báo từ Admin cho User
 * @param {boolean} open - Trạng thái mở
 * @param {function} onClose - Callback khi đóng
 * @param {string} message - Nội dung cảnh báo (từ backend, đã có \n)
 */
export default function WarningModal({ open, onClose, message }) {
  return (
    <Modal
      title={
        <Space align="center">
          <WarningOutlined style={{ color: '#faad14', fontSize: '20px' }} />
          <Title level={5} style={{ margin: 0, paddingTop: '4px' }}>
            Thông báo từ Quản trị viên
          </Title>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="confirm" type="primary" onClick={onClose}>
          Đã hiểu
        </Button>
      ]}
    >
      <Text 
        style={{ 
          whiteSpace: 'pre-line', // Quan trọng: để hiển thị dấu \n
          lineHeight: '1.6' 
        }}
      >
        {message || "Không có nội dung cảnh báo."}
      </Text>
    </Modal>
  );
}
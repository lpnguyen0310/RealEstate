import React from "react";
import { Card, Typography } from "antd";
const { Title, Text } = Typography;

export default function ProBrokerBlank() {
  return (
    <div className="max-w-[700px]">
      <Card bordered={false}>
        <Title level={5} className="!mt-0">Đăng ký Môi giới chuyên nghiệp</Title>
        <Text type="secondary">(Trang trống demo – bạn sẽ thêm nội dung sau.)</Text>
      </Card>
    </div>
  );
}

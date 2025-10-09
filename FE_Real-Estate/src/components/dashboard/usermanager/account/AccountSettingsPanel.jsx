import React from "react";
import { Card, Form, Input, Button, Divider, Collapse, Typography, message } from "antd";
import { LockOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function AccountSettingsPanel() {
  return (
    <div className="max-w-[700px] mx-auto">
      <Card bordered={false} styles={{ body: { padding: "5px 24px", borderRadius: 12 } }}>
        <Title level={5} className="!mt-0 !mb-4 !text-[23px] !leading-6 !font-semibold">Đổi mật khẩu</Title>

        <Form layout="vertical" onFinish={() => message.success("Đã lưu mật khẩu (demo)")} className="space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-end gap-3">
            <Form.Item className="!mb-0" label={<span className="text-[14px] font-medium text-gray-700">Mật khẩu hiện tại</span>} name="oldPassword" rules={[{ required: true, message: "Nhập mật khẩu hiện tại" }]}>
              <Input.Password placeholder="Nhập mật khẩu hiện tại" size="middle" />
            </Form.Item>
            <a className="text-[14px] text-red-500 md:self-end md:mb-[6px]">Bạn quên mật khẩu?</a>
          </div>

          <Form.Item className="!mb-0 mt-4" label={<span className="text-[14px] font-medium text-gray-700">Mật khẩu mới</span>} name="newPassword" rules={[{ required: true, message: "Nhập mật khẩu mới" }, { min: 8, message: "Ít nhất 8 ký tự" }]}>
            <Input.Password placeholder="Nhập mật khẩu mới" size="middle" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-end gap-3 mt-4">
            <Form.Item
              className="!mb-0"
              label={<span className="text-[14px] font-medium text-gray-700">Nhập lại mật khẩu mới</span>}
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Nhập lại mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, v) {
                    if (!v || getFieldValue("newPassword") === v) return Promise.resolve();
                    return Promise.reject(new Error("Mật khẩu nhập lại không khớp"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới" size="middle" />
            </Form.Item>

            <Form.Item className="!mb-0">
              <Button type="primary" danger htmlType="submit" className="h-10 w-[128px] rounded-md font-semibold">Lưu thay đổi</Button>
            </Form.Item>
          </div>

          <ul className="text-[13px] text-gray-500 mt-3 space-y-1 list-disc pl-5">
            <li>Mật khẩu tối thiểu 8 ký tự</li>
            <li>Có ít nhất 1 chữ hoa</li>
            <li>Có ít nhất 1 chữ số</li>
          </ul>
        </Form>

        <Divider className="!my-6" />

        <Collapse
          bordered={false}
          expandIconPosition="end"
          className="bg-transparent account-collapse [&_.ant-collapse-header]:!px-0 [&_.ant-collapse-content-box]:!px-0"
          items={[
            {
              key: "lock",
              label: <span className="text-[23px] font-semibold">Yêu cầu khóa tài khoản</span>,
              children: (
                <div className="space-y-3">
                  <Form layout="vertical" onFinish={() => message.success("Đã gửi yêu cầu khóa (demo)")}>
                    <div className="flex gap-3 md:items-end">
                      <Form.Item label={<span className="text-[14px] font-medium text-gray-700">Nhập mật khẩu hiện tại</span>} name="lockPassword" className="flex-1 !mb-0" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
                        <Input.Password placeholder="••••••••" size="middle" />
                      </Form.Item>
                      <Form.Item className="!mb-0">
                        <Button type="primary" danger icon={<LockOutlined />} htmlType="submit" className="h-10 rounded-md font-semibold">Khóa tài khoản</Button>
                      </Form.Item>
                    </div>
                  </Form>

                  <div className="text-[13px] text-gray-600">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Không thể đăng nhập lại sau khi khóa.</li>
                      <li>Tin đang hiển thị sẽ chạy đến hết thời gian đã chọn.</li>
                      <li>Số dư (nếu có) không được hoàn lại.</li>
                    </ul>
                  </div>
                </div>
              ),
            },
            {
              key: "delete",
              label: <span className="text-[23px] font-semibold">Yêu cầu xóa tài khoản</span>,
              children: (
                <div className="space-y-3">
                  <Text className="text-[14px] text-gray-700 block">Gửi yêu cầu xóa toàn bộ dữ liệu. Sau khi xử lý, không thể hoàn tác.</Text>
                  <Button danger icon={<DeleteOutlined />} className="h-10 rounded-md font-semibold w-full md:w-auto" onClick={() => message.warning("Đã gửi yêu cầu xóa (demo)")}>
                    Yêu cầu xóa tài khoản
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

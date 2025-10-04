import { Modal, Form, Input, Button, Checkbox, Divider } from "antd";
import { AppleFilled, GoogleOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

export default function LoginModal({ open, onClose, onRegisterClick, onSuccess }) {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    // TODO: gọi API thực tế ở đây, nhận về profile + token
    // Mock profile demo:
    const profile = {
      id: "u_001",
      fullName: "Lê Phước Nguyên",
      email: /@/.test(values.username) ? values.username : undefined,
      phone: /@/.test(values.username) ? undefined : values.username,
      avatarUrl: "", // có link thì gán vào
    };
    onSuccess?.(profile);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={800}
      destroyOnClose
      maskClosable
      bodyStyle={{ height: 700, padding: 0, overflow: "hidden" }}
      modalRender={(node) => <div className="animate-fade-up">{node}</div>}
    >
      <div className="flex flex-row h-full w-full">
        {/* LEFT */}
        <div className="w-[40%] h-full bg-[#ffe9e6] flex flex-col justify-center items-center rounded-l-[8px]">
          <img
            src="/assets/login-illustration.png"
            alt="illustration"
            className="max-w-[220px] object-contain"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <p className="mt-6 text-[#c23a2a] text-[16px] font-semibold text-center leading-snug">
            Tìm nhà đất<br />Batdongsan.com.vn dẫn lối
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col justify-center w-[60%] h-full px-8">
          <h3 className="text-gray-900 font-semibold text-[14px]">Xin chào bạn</h3>
          <h2 className="text-gray-900 font-bold text-[22px] mb-5">Đăng nhập để tiếp tục</h2>

          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              label="SĐT chính hoặc email"
              name="username"
              rules={[{ required: true, message: "Vui lòng nhập SĐT hoặc email" }]}
            >
              <Input size="large" placeholder="SĐT hoặc email" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                size="large"
                placeholder="Mật khẩu"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <div className="flex items-center justify-between mb-3">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Nhớ tài khoản</Checkbox>
              </Form.Item>
              <a href="/quen-mat-khau" className="text-[#d6402c] text-[14px]">Quên mật khẩu?</a>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="!bg-[#d6402c] hover:!bg-[#c13628] w-full h-[44px] font-semibold"
            >
              Đăng nhập
            </Button>

            <Divider plain>Hoặc</Divider>

            <div className="space-y-3">
              <Button size="large" className="w-full h-[44px]" icon={<AppleFilled />}>
                Đăng nhập với Apple
              </Button>
              <Button size="large" className="w-full h-[44px]" icon={<GoogleOutlined />}>
                Đăng nhập với Google
              </Button>
            </div>

            <p className="text-[12px] text-gray-500 mt-4">
              Bằng việc tiếp tục, bạn đồng ý với{" "}
              <a href="/dieu-khoan" className="text-[#d6402c]">Điều khoản sử dụng</a> và{" "}
              <a href="/bao-mat" className="text-[#d6402c]">Chính sách bảo mật</a>.
            </p>

            <p className="text-[14px] mt-4">
              Chưa là thành viên?{" "}
              <button
                type="button"
                onClick={onRegisterClick}
                className="text-[#d6402c] font-semibold underline hover:text-[#c13628]"
              >
                Đăng ký tại đây
              </button>
            </p>
          </Form>
        </div>
      </div>
    </Modal>
  );
}

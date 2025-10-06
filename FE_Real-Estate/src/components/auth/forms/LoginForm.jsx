import { Form, Input, Button, Checkbox, Divider } from "antd";
import { AppleFilled, GoogleOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

export default function LoginForm({ form, onFinish, onForgot, onRegisterClick }) {
    return (
        <>
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
                        iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                </Form.Item>

                <div className="flex items-center justify-between mb-3">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox>Nhớ tài khoản</Checkbox>
                    </Form.Item>
                    <button type="button" onClick={onForgot} className="text-[#d6402c] text-[14px]">
                        Quên mật khẩu?
                    </button>
                </div>

                <Button type="primary" htmlType="submit" size="large"
                    className="!bg-[#d6402c] hover:!bg-[#c13628] w-full h-[44px] font-semibold">
                    Đăng nhập
                </Button>

                <Divider plain>Hoặc</Divider>

                <div className="space-y-3">
                    <Button size="large" className="w-full h-[44px] !mb-[8px]" icon={<AppleFilled />}>
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
                    <button type="button" onClick={onRegisterClick}
                        className="text-[#d6402c] font-semibold underline hover:text-[#c13628]">
                        Đăng ký tại đây
                    </button>
                </p>
            </Form>
        </>
    );
}

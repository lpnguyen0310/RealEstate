import { Form, Input, Button } from "antd";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { validateEmailOrPhone } from "@/utils/validators";

export default function ForgotForm({ form, onSubmit, loading, onBack }) {
    return (
        <div className="flex flex-col gap-4">
            {/* Nút quay lại */}
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
            >
                <ArrowLeftOutlined className="text-[11px]" />
                <span>Quay lại</span>
            </button>

            {/* Header */}
            <div className="space-y-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-[11px] font-medium text-rose-500 border border-rose-100">
                    Khôi phục mật khẩu
                </span>
                <h2 className="text-gray-900 font-semibold text-[22px] leading-snug">
                    Đặt lại mật khẩu của bạn
                </h2>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                    Nhập <span className="font-medium text-gray-700">email</span> hoặc{" "}
                    <span className="font-medium text-gray-700">số điện thoại</span> để nhận
                    hướng dẫn đặt lại mật khẩu.
                </p>
            </div>

            {/* Form */}
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                requiredMark={false}
                className="mt-1"
            >
                <Form.Item
                    label={
                        <span className="text-[13px] font-medium text-gray-700">
                            Email hoặc số điện thoại
                        </span>
                    }
                    name="account"
                    rules={[{ validator: validateEmailOrPhone }]}
                    className="mb-3"
                >
                    <Input
                        size="large"
                        placeholder="Ví dụ: user@gmail.com hoặc 0901 234 567"
                        prefix={<MailOutlined className="text-gray-400 mr-1" />}
                        className="h-[44px] rounded-xl border-gray-200 focus:border-rose-300 focus:shadow-[0_0_0_2px_rgba(244,114,182,0.15)] transition-all"
                    />
                </Form.Item>

                <div className="text-[12px] text-gray-400 mb-4">
                    • Nếu bạn đăng ký bằng số điện thoại, hãy nhập đúng đầu số. <br />
                    • Kiểm tra thêm hộp thư <span className="font-medium">Spam / Quảng cáo</span>
                    nếu không thấy email.
                </div>

                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="w-full h-[44px] font-semibold border-0 rounded-xl
                               bg-gradient-to-r from-[#f4b4b0] to-[#e58b86]
                               hover:from-[#f1a69f] hover:to-[#df7b75]
                               text-gray-900 shadow-sm hover:shadow-md transition-all"
                >
                    Gửi liên kết đặt lại mật khẩu
                </Button>
            </Form>
        </div>
    );
}

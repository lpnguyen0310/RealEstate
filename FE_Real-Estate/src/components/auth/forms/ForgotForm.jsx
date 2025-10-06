import { Form, Input, Button } from "antd";
import { validateEmailOrPhone } from "@/utils/validators";

export default function ForgotForm({ form, onSubmit, loading, onBack }) {
    return (
        <>
            <div className="mb-4">
                <button type="button" onClick={onBack} className="text-[14px] text-gray-500 hover:text-gray-700">← Quay lại</button>
            </div>
            <h2 className="text-gray-900 font-bold text-[22px] mb-1">Khôi phục mật khẩu</h2>
            <p className="text-[14px] text-gray-500 mb-5">
                Nhập email hoặc số điện thoại để nhận hướng dẫn đặt lại mật khẩu.
            </p>

            <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
                <Form.Item
                    label="Email hoặc số điện thoại"
                    name="account"
                    rules={[{ validator: validateEmailOrPhone }]}
                >
                    <Input size="large" placeholder="Nhập email hoặc số điện thoại" />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={loading} size="large"
                    className="!bg-[#e9a3a0] hover:!bg-[#e08f8b] w-full h-[44px] font-semibold border-0 text-gray-900">
                    Gửi
                </Button>
            </Form>
        </>
    );
}

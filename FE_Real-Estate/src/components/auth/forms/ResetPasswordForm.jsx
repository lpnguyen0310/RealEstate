import { Form, Input, Button } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

const rules = {
    min8: (s) => (s || "").length >= 8,
    upper: (s) => /[A-Z]/.test(s || ""),
    num: (s) => /\d/.test(s || ""),
};

export default function ResetPasswordForm({ form, onSubmit, loading }) {
    const watchPwd = Form.useWatch("newPassword", form) || "";
    const bullet = (ok) => (ok ? "text-[#36b37e]" : "text-gray-500");

    return (
        <>
            <h2 className="text-gray-900 font-bold text-[22px] mb-6">Tạo mật khẩu mới</h2>

            <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
                <Form.Item
                    name="newPassword"
                    label={null}
                    rules={[
                        { required: true, message: "Vui lòng nhập mật khẩu" },
                        () => ({
                            validator(_, v) {
                                if (!v) return Promise.reject();
                                return rules.min8(v) && rules.upper(v) && rules.num(v)
                                    ? Promise.resolve()
                                    : Promise.reject("Mật khẩu chưa đạt yêu cầu");
                            },
                        }),
                    ]}
                >
                    <Input.Password
                        size="large"
                        placeholder="Nhập mật khẩu"
                        className="h-12 rounded-lg"
                        iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label={null}
                    dependencies={["newPassword"]}
                    rules={[
                        { required: true, message: "Vui lòng nhập lại mật khẩu" },
                        ({ getFieldValue }) => ({
                            validator(_, v) {
                                return v === getFieldValue("newPassword")
                                    ? Promise.resolve()
                                    : Promise.reject("Mật khẩu nhập lại không khớp");
                            },
                        }),
                    ]}
                >
                    <Input.Password
                        size="large"
                        placeholder="Nhập lại mật khẩu"
                        className="h-12 rounded-lg"
                        iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                </Form.Item>

                <ul className="mb-4 space-y-1 text-[14px]">
                    <li className={bullet(rules.min8(watchPwd))}>• Mật khẩu tối thiểu 8 ký tự</li>
                    <li className={bullet(rules.upper(watchPwd))}>• Chứa ít nhất 1 ký tự viết hoa</li>
                    <li className={bullet(rules.num(watchPwd))}>• Chứa ít nhất 1 ký tự số</li>
                </ul>

                <Button type="primary" htmlType="submit" loading={loading} size="large"
                    className="w-full h-[46px] font-semibold rounded-lg !bg-[#d6402c] hover:!bg-[#c13628]">
                    Hoàn tất
                </Button>
            </Form>
        </>
    );
}

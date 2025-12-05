import { Form, Input, Button } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined } from "@ant-design/icons";

const rules = {
    min8: (s) => (s || "").length >= 8,
    upper: (s) => /[A-Z]/.test(s || ""),
    num: (s) => /\d/.test(s || ""),
};

export default function ResetPasswordForm({ form, onSubmit, loading }) {
    const watchPwd = Form.useWatch("newPassword", form) || "";
    const bullet = (ok) =>
        `flex items-center gap-2 text-[13px] ${ok ? "text-[#16a34a]" : "text-gray-500"
        }`;

    return (
        <div className="flex flex-col gap-4">
            {/* Badge + Title */}
            <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-[11px] font-medium text-rose-500 border border-rose-100">
                    Đặt lại mật khẩu
                </span>
                <h2 className="text-gray-900 font-semibold text-[22px] leading-snug">
                    Tạo mật khẩu mới an toàn
                </h2>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                    Hạn chế dùng lại mật khẩu cũ hoặc mật khẩu trùng với các dịch vụ khác để
                    bảo vệ tài khoản của bạn tốt hơn.
                </p>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                requiredMark={false}
                className="mt-1"
            >
                {/* New password */}
                <Form.Item
                    name="newPassword"
                    label={
                        <span className="text-[13px] font-medium text-gray-700">
                            Mật khẩu mới
                        </span>
                    }
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
                    className="mb-3"
                >
                    <Input.Password
                        size="large"
                        placeholder="Nhập mật khẩu mới"
                        className="h-12 rounded-xl border-gray-200
                                   focus:border-rose-300 focus:shadow-[0_0_0_2px_rgba(248,113,113,0.2)]
                                   transition-all"
                        iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        prefix={<LockOutlined className="text-gray-400 mr-1" />}
                    />
                </Form.Item>

                {/* Confirm password */}
                <Form.Item
                    name="confirmPassword"
                    label={
                        <span className="text-[13px] font-medium text-gray-700">
                            Nhập lại mật khẩu
                        </span>
                    }
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
                    className="mb-2"
                >
                    <Input.Password
                        size="large"
                        placeholder="Nhập lại mật khẩu"
                        className="h-12 rounded-xl border-gray-200
                                   focus:border-rose-300 focus:shadow-[0_0_0_2px_rgba(248,113,113,0.2)]
                                   transition-all"
                        iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        prefix={<LockOutlined className="text-gray-400 mr-1" />}
                    />
                </Form.Item>

                {/* Password rules */}
                <div className="mb-4 rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-[12px] text-gray-500 mb-1 font-medium">
                        Mật khẩu cần đáp ứng:
                    </p>
                    <ul className="space-y-1.5">
                        <li className={bullet(rules.min8(watchPwd))}>
                            <span className="text-[18px] leading-none">
                                {rules.min8(watchPwd) ? "●" : "○"}
                            </span>
                            <span>Mật khẩu tối thiểu 8 ký tự</span>
                        </li>
                        <li className={bullet(rules.upper(watchPwd))}>
                            <span className="text-[18px] leading-none">
                                {rules.upper(watchPwd) ? "●" : "○"}
                            </span>
                            <span>Chứa ít nhất 1 ký tự viết hoa</span>
                        </li>
                        <li className={bullet(rules.num(watchPwd))}>
                            <span className="text-[18px] leading-none">
                                {rules.num(watchPwd) ? "●" : "○"}
                            </span>
                            <span>Chứa ít nhất 1 ký tự số</span>
                        </li>
                    </ul>
                </div>

                {/* Submit */}
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="w-full h-[46px] font-semibold rounded-xl border-0
                               bg-gradient-to-r from-[#fb8a72] to-[#e6462f]
                               hover:from-[#f9735b] hover:to-[#d23724]
                               text-white shadow-sm hover:shadow-md transition-all"
                >
                    Hoàn tất
                </Button>
            </Form>
        </div>
    );
}

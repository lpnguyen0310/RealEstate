// src/components/dashboard/usermanager/account/ForgotPasswordModal.jsx
import React, { useState } from "react";
import { Modal, Form, Input, Button, message, Typography, Result } from "antd";
import authApi from "@/api/register";

const { Text } = Typography;

export default function ForgotPasswordModal({ open, onClose }) {
    const [step, setStep] = useState(1); // 1=Email, 2=OTP, 3=New Password, 4=Success
    const [email, setEmail] = useState("");
    const [ticket, setTicket] = useState("");
    const [loading, setLoading] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [form] = Form.useForm();

    const resetState = () => {
        setStep(1);
        setEmail("");
        setTicket("");
        setOtpError("");
        form.resetFields();
    };

    const handleClose = () => {
        resetState();
        onClose?.();
    };

    // ========== STEP 1: GỬI OTP ==========
    const handleSendOtp = async (values) => {
        setLoading(true);
        try {
            const res = await authApi.forgotRequestOtp(values.email);

            const data = res?.data?.data || {};
            const masked = data.maskedEmail || values.email;

            message.success(`Đã gửi mã OTP đến ${masked}`);
            setEmail(values.email);
            setStep(2);
            form.resetFields();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Không thể gửi OTP. Vui lòng thử lại.";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // ========== STEP 2: XÁC MINH OTP ==========
    const handleVerifyOtp = async (values) => {
        setLoading(true);
        setOtpError("");

        try {
            const res = await authApi.forgotVerifyOtp({
                email,
                otp: values.otp,
            });

            const data = res?.data?.data || {};
            const t = data.token || data.ticket;
            if (!t) {
                throw new Error("Không nhận được ticket từ server.");
            }

            setTicket(t);
            message.success("Xác thực OTP thành công.");
            setStep(3);
            form.resetFields();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "OTP không đúng hoặc đã hết hạn.";

            setOtpError(msg);         // hiển thị dưới input
            // message.error(msg);    // nếu muốn toast thêm thì mở comment
        } finally {
            setLoading(false);
        }
    };

    // ========== STEP 3: ĐẶT MẬT KHẨU MỚI ==========
    const handleResetPassword = async (values) => {
        setLoading(true);
        try {
            await authApi.forgotResetPassword({
                ticket,
                password: values.newPassword,
                confirmPassword: values.confirmPassword,
            });

            message.success("Đặt lại mật khẩu thành công.");
            setStep(4);
            form.resetFields();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Không thể đặt lại mật khẩu.";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title={
                step === 1
                    ? "Khôi phục mật khẩu"
                    : step === 2
                        ? "Nhập mã OTP"
                        : step === 3
                            ? "Đặt mật khẩu mới"
                            : "Hoàn tất"
            }
            onCancel={handleClose}
            footer={null}
            centered
            destroyOnClose
        >
            {/* ======================= STEP 1: EMAIL ======================= */}
            {step === 1 && (
                <>
                    <p className="mb-4 text-gray-600">
                        Nhập email đăng ký tài khoản. Hệ thống sẽ gửi <b>mã OTP</b> để xác
                        minh.
                    </p>

                    <Form layout="vertical" form={form} onFinish={handleSendOtp}>
                        <Form.Item
                            label="Email đăng ký"
                            name="email"
                            rules={[
                                { required: true, message: "Vui lòng nhập email" },
                                { type: "email", message: "Email không hợp lệ" },
                            ]}
                        >
                            <Input placeholder="example@gmail.com" />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            className="h-10"
                        >
                            Gửi OTP
                        </Button>
                    </Form>
                </>
            )}

            {/* ======================= STEP 2: OTP ======================= */}
            {step === 2 && (
                <>
                    <p className="mb-3 text-gray-600">
                        Mã OTP đã được gửi tới <b>{email}</b>.
                    </p>

                    <Form layout="vertical" form={form} onFinish={handleVerifyOtp}>
                        <Form.Item
                            label="Nhập mã OTP"
                            name="otp"
                            validateStatus={otpError ? "error" : ""}
                            help={otpError}
                            rules={[{ required: true, message: "Vui lòng nhập mã OTP" }]}
                        >
                            <Input placeholder="Nhập mã OTP" maxLength={6} />
                        </Form.Item>

                        <div className="flex gap-2">
                            <Button
                                className="flex-1 h-10"
                                onClick={() => {
                                    setStep(1);
                                    setOtpError("");
                                    form.resetFields();
                                }}
                                disabled={loading}
                            >
                                Quay lại
                            </Button>

                            <Button
                                type="primary"
                                htmlType="submit"
                                className="flex-1 h-10"
                                loading={loading}
                            >
                                Xác minh
                            </Button>
                        </div>
                    </Form>
                </>
            )}

            {/* ======================= STEP 3: NEW PASSWORD ======================= */}
            {step === 3 && (
                <>
                    <p className="mb-4 text-gray-600">
                        Nhập mật khẩu mới cho tài khoản của bạn.
                    </p>

                    <Form layout="vertical" form={form} onFinish={handleResetPassword}>
                        <Form.Item
                            label="Mật khẩu mới"
                            name="newPassword"
                            rules={[
                                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                                {
                                    pattern:
                                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
                                    message:
                                        "Mật khẩu phải có chữ hoa, chữ thường, số, ký tự đặc biệt và ≥ 8 ký tự",
                                },
                            ]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu mới" />
                        </Form.Item>

                        <Form.Item
                            label="Nhập lại mật khẩu mới"
                            name="confirmPassword"
                            dependencies={["newPassword"]}
                            rules={[
                                { required: true, message: "Vui lòng nhập lại mật khẩu" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("newPassword") === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(
                                            new Error("Mật khẩu nhập lại không khớp")
                                        );
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Nhập lại mật khẩu mới" />
                        </Form.Item>

                        <div className="flex gap-2">
                            <Button
                                className="flex-1 h-10"
                                onClick={() => {
                                    setStep(2);
                                    form.resetFields();
                                    setOtpError("");
                                }}
                                disabled={loading}
                            >
                                Quay lại
                            </Button>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="flex-1 h-10"
                            >
                                Đổi mật khẩu
                            </Button>
                        </div>
                    </Form>
                </>
            )}

            {/* ======================= STEP 4: SUCCESS ======================= */}
            {step === 4 && (
                <div className="py-4">
                    <Result
                        status="success"
                        title="Đặt lại mật khẩu thành công!"
                        subTitle="Bạn có thể dùng mật khẩu mới để đăng nhập vào hệ thống."
                    />

                    <Button
                        type="primary"
                        block
                        className="h-10 mb-2"
                        onClick={handleClose}
                    >
                        Đóng
                    </Button>
                </div>
            )}
        </Modal>
    );
}

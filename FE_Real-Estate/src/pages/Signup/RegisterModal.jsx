// src/pages/Signup/RegisterModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Form, Input, Button, Divider, message, Grid } from "antd";
import { AppleFilled, GoogleOutlined, ArrowLeftOutlined, CheckCircleTwoTone } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm";
import {
    requestOtpThunk,
    verifyOtpThunk,
    setPasswordThunk,
} from "@/store/registerSlice";

const OTP_LEN = 6;
const RESEND_SECONDS = 60;

export default function RegisterModal({ open, onClose, onSuccess, onBackToLogin }) {
    const dispatch = useDispatch();
    const { email: storeEmail, ticket } = useSelector((s) => s.register || {});
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md; // < md

    const [form] = Form.useForm();
    const [pwdForm] = Form.useForm();

    // steps: 'email' | 'otp' | 'setPwd' | 'done'
    const [step, setStep] = useState("email");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(Array(OTP_LEN).fill(""));
    const [seconds, setSeconds] = useState(RESEND_SECONDS);

    // Loading flags
    const [sendingOtp, setSendingOtp] = useState(false);
    const [resending, setResending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [settingPwd, setSettingPwd] = useState(false);

    // Lỗi OTP hiển thị dưới dãy ô
    const [otpError, setOtpError] = useState("");

    const inputsRef = useRef([]);

    // Reset khi mở modal
    useEffect(() => {
        if (open) {
            setStep("email");
            setEmail("");
            setOtp(Array(OTP_LEN).fill(""));
            setSeconds(RESEND_SECONDS);
            setOtpError("");
            setSendingOtp(false);
            setResending(false);
            setVerifying(false);
            setSettingPwd(false);
            form.resetFields();
            pwdForm.resetFields();
        }
    }, [open, form, pwdForm, dispatch]);

    useEffect(() => {
        if (step !== "otp") return;
        if (seconds <= 0) return;
        const id = setInterval(() => setSeconds((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [step, seconds]);

    const otpValue = useMemo(() => otp.join(""), [otp]);
    const canVerify = otpValue.length === OTP_LEN && /^\d{6}$/.test(otpValue);

    // ===== STEP 1: gửi OTP =====
    const handleEmailSubmit = async (values) => {
        const em = (values?.email || "").trim();
        if (!em || sendingOtp) return;
        setSendingOtp(true);
        try {
            await dispatch(requestOtpThunk(em)).unwrap();
            setEmail(em);
            setStep("otp");
            setOtp(Array(OTP_LEN).fill(""));
            setSeconds(RESEND_SECONDS);
            setOtpError("");
            setTimeout(() => inputsRef.current?.[0]?.focus(), 0);
            message.success("Đã gửi mã OTP đến email của bạn.");
        } catch (err) {
            const msg = err?.message || "Gửi OTP thất bại";
            if (err?.code === 409 || /được sử dụng|đã tồn tại/i.test(msg)) {
                form.setFields([{ name: "email", errors: [msg] }]);
            } else if (err?.fieldErrors?.email) {
                form.setFields([{ name: "email", errors: [err.fieldErrors.email] }]);
            } else {
                message.error(msg);
            }
        } finally {
            setSendingOtp(false);
        }
    };

    // ===== STEP 2: xác minh OTP =====
    const handleVerify = async () => {
        if (!canVerify || verifying) return;
        setVerifying(true);
        setOtpError("");
        try {
            await dispatch(
                verifyOtpThunk({ email: email || storeEmail, otp: otpValue })
            ).unwrap();
            setStep("setPwd");
            message.success("Xác minh OTP thành công.");
        } catch (err) {
            const msg = err?.message || "OTP không đúng hoặc đã hết hạn.";
            setOtpError(msg);
            setOtp(Array(OTP_LEN).fill(""));
            inputsRef.current?.[0]?.focus();
        } finally {
            setVerifying(false);
        }
    };

    const handleChangeDigit = (idx, value) => {
        const v = value.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[idx] = v;
        setOtp(next);
        if (otpError) setOtpError("");
        if (v && idx < OTP_LEN - 1) inputsRef.current?.[idx + 1]?.focus();
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === "Backspace") {
            if (!otp[idx] && idx > 0) {
                inputsRef.current?.[idx - 1]?.focus();
                const next = [...otp];
                next[idx - 1] = "";
                setOtp(next);
            } else {
                const next = [...otp];
                next[idx] = "";
                setOtp(next);
            }
            if (otpError) setOtpError("");
            e.preventDefault();
        }
        if (e.key === "ArrowLeft" && idx > 0) {
            inputsRef.current?.[idx - 1]?.focus();
            e.preventDefault();
        }
        if (e.key === "ArrowRight" && idx < OTP_LEN - 1) {
            inputsRef.current?.[idx + 1]?.focus();
            e.preventDefault();
        }
        if (e.key === "Enter" && canVerify) handleVerify();
    };

    const handlePaste = (e) => {
        const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
        if (text.length === OTP_LEN) {
            setOtp(text.split(""));
            if (otpError) setOtpError("");
            setTimeout(() => handleVerify(), 0);
            e.preventDefault();
        }
    };

    const handleResend = async () => {
        if (resending) return;
        setResending(true);
        try {
            const em = email || storeEmail;
            await dispatch(requestOtpThunk(em)).unwrap();
            setOtp(Array(OTP_LEN).fill(""));
            setSeconds(RESEND_SECONDS);
            setOtpError("");
            inputsRef.current?.[0]?.focus();
            message.success("Đã gửi lại mã OTP.");
        } catch (err) {
            const msg = err?.message || "Gửi lại OTP thất bại";
            setOtpError(msg);
        } finally {
            setResending(false);
        }
    };

    // ===== STEP 3: đặt mật khẩu =====
    const handleSubmitNewPwd = async ({ newPassword, confirmPassword }) => {
        if (!ticket) {
            message.error("Thiếu ticket xác minh. Vui lòng xác minh lại OTP.");
            setStep("otp");
            return;
        }
        setSettingPwd(true);
        try {
            const em = email || storeEmail;
            await dispatch(
                setPasswordThunk({ email: em, ticket, password: newPassword, confirmPassword })
            ).unwrap();
            setStep("done");
            onSuccess?.();
        } catch (err) {
            const msg = err?.message || "Tạo mật khẩu thất bại";
            if (err?.fieldErrors?.password) {
                pwdForm.setFields([{ name: "newPassword", errors: [err.fieldErrors.password] }]);
            }
            if (err?.fieldErrors?.confirmPassword) {
                pwdForm.setFields([{ name: "confirmPassword", errors: [err.fieldErrors.confirmPassword] }]);
            }
            if (!err?.fieldErrors) message.error(msg);
        } finally {
            setSettingPwd(false);
        }
    };

    // ===== STEP 4: done panel =====
    const SuccessPanel = () => (
        <div className="w-full text-center animate-fade-in">
            <div className="flex flex-col items-center justify-center mt-4">
                <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 64 }} />
                <h2 className="text-gray-900 font-bold text-[22px] mt-3">Tài khoản đã được đăng ký</h2>
                <p className="text-gray-600 mt-2">
                    Bạn có thể đăng nhập bằng email vừa đăng ký và mật khẩu mới tạo.
                </p>
                <Button
                    type="primary"
                    size="large"
                    className="mt-6 !bg-[#d6402c] hover:!bg-[#c13628] h-[44px] px-6 font-semibold"
                    onClick={() => {
                        if (onBackToLogin) onBackToLogin();
                        else onClose?.();
                    }}
                >
                    Quay lại trang đăng nhập
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered={!isMobile}
            width={isMobile ? "100%" : 800}
            destroyOnClose
            maskClosable
            style={{
                top: isMobile ? 0 : undefined,
                padding: 0,
                maxWidth: isMobile ? "100vw" : undefined,
            }}
            bodyStyle={{
                height: isMobile ? "100svh" : 700,
                padding: 0,
                overflow: "hidden",
            }}
            modalRender={(node) => <div className="animate-fade-up">{node}</div>}
        >
            <div className={`flex ${isMobile ? "flex-col h-full w-full" : "flex-row h-full w-full"}`}>
                {/* LEFT — ẨN TRÊN MOBILE */}
                {!isMobile && (
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
                )}

                {/* RIGHT */}
                <div
                    className={
                        isMobile
                            ? "flex-1 w-full h-full px-4 py-6 overflow-y-auto"
                            : "flex flex-col justify-center w-[60%] h-full px-8"
                    }
                >
                    {step === "email" && (
                        <>
                            <h3 className="text-gray-900 font-semibold text-[14px]">Xin chào bạn</h3>
                            <h2 className="text-gray-900 font-bold text-[22px] mb-5">Đăng ký tài khoản mới</h2>

                            <Form form={form} layout="vertical" onFinish={handleEmailSubmit} requiredMark={false}>
                                <Form.Item
                                    name="email"
                                    rules={[
                                        { required: true, message: "Vui lòng nhập email" },
                                        { type: "email", message: "Email không hợp lệ" },
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="Nhập email"
                                        inputMode="email"
                                        disabled={sendingOtp}
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={sendingOtp}
                                    disabled={sendingOtp}
                                    className="!bg-[#f07e7a] hover:!bg-[#ea6a66] w-full h-[44px] font-semibold"
                                >
                                    Tiếp tục
                                </Button>

                                <Divider plain>Hoặc</Divider>

                                <div className="space-y-3">
                                    <Button size="large" className="w-full h-[44px] !mb-[8px]" icon={<AppleFilled />} disabled={sendingOtp}>
                                        Đăng nhập với Apple
                                    </Button>
                                    <Button size="large" className="w-full h-[44px]" icon={<GoogleOutlined />} disabled={sendingOtp}>
                                        Đăng nhập với Google
                                    </Button>
                                </div>

                                <p className="text-[12px] text-gray-500 mt-4">
                                    Bằng việc tiếp tục, bạn đồng ý với{" "}
                                    <a href="/dieu-khoan" className="text-[#d6402c]">Điều khoản sử dụng</a>,{" "}
                                    <a href="/bao-mat" className="text-[#d6402c]">Chính sách bảo mật</a>,{" "}
                                    <a href="/quy-che" className="text-[#d6402c]">Quy chế</a>.
                                </p>
                            </Form>
                        </>
                    )}

                    {step === "otp" && (
                        <>
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                                    onClick={() => {
                                        if (verifying || resending) return;
                                        setStep("email");
                                        setOtpError("");
                                    }}
                                >
                                    <ArrowLeftOutlined />
                                    <span>Quay lại</span>
                                </button>
                            </div>

                            <h2 className="text-gray-900 font-bold text-[22px]">Nhập mã xác minh</h2>
                            <p className="text-[14px] text-gray-600 mt-1">
                                Chúng tôi đã gửi mã xác minh gồm 6 chữ số tới email{" "}
                                <strong>{email || storeEmail}</strong>
                            </p>

                            <Form layout="vertical">
                                <Form.Item
                                    validateStatus={otpError ? "error" : ""}
                                    help={otpError || ""}
                                    className="!mb-0"
                                    label={null}
                                >
                                    <div className="mt-5 flex gap-2 justify-between max-w-[360px]" onPaste={handlePaste}>
                                        {Array.from({ length: OTP_LEN }).map((_, i) => (
                                            <Input
                                                key={i}
                                                ref={(el) => (inputsRef.current[i] = el?.input)}
                                                size="large"
                                                maxLength={1}
                                                value={otp[i]}
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                status={otpError ? "error" : ""}
                                                disabled={verifying}
                                                className={`!w-12 !h-12 text-center text-[18px] ${otpError ? "border-red-500" : ""}`}
                                                onChange={(e) => handleChangeDigit(i, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(i, e)}
                                            />
                                        ))}
                                    </div>
                                </Form.Item>
                            </Form>

                            <div className="text-[12px] text-gray-500 mt-2">
                                Mã có hiệu lực trong 5 phút.{" "}
                                {seconds > 0 ? (
                                    <span>
                                        Gửi lại mã sau{" "}
                                        <span className="text-[#d6402c] font-semibold">
                                            0{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
                                        </span>
                                    </span>
                                ) : (
                                    <Button
                                        type="link"
                                        onClick={handleResend}
                                        loading={resending}
                                        disabled={verifying || resending}
                                        className="!p-0 !h-auto text-[#d6402c] font-semibold underline"
                                    >
                                        Gửi lại mã
                                    </Button>
                                )}
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                loading={verifying}
                                disabled={!canVerify || verifying}
                                onClick={handleVerify}
                                className={`mt-6 w-full h-[44px] font-semibold ${canVerify ? "!bg-[#d6402c] hover:!bg-[#c13628]" : "!bg-[#f5bdbb] cursor-not-allowed"
                                    }`}
                            >
                                Xác minh
                            </Button>
                        </>
                    )}

                    {step === "setPwd" && (
                        <ResetPasswordForm
                            form={pwdForm}
                            loading={settingPwd}
                            onSubmit={handleSubmitNewPwd}
                        />
                    )}

                    {step === "done" && <SuccessPanel />}
                </div>
            </div>
        </Modal>
    );
}

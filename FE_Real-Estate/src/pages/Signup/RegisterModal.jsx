import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Form, Input, Button, Divider } from "antd";
import { AppleFilled, GoogleOutlined, PhoneOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const VN_PHONE_REGEX = /^(0|(\+?84))([3|5|7|8|9])([0-9]{8})$/;
const OTP_LEN = 6;
const RESEND_SECONDS = 60;

export default function RegisterModal({ open, onClose, onSuccess }) {
    const [form] = Form.useForm();
    const [step, setStep] = useState("phone"); // 'phone' | 'otp'
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(Array(OTP_LEN).fill(""));
    const [seconds, setSeconds] = useState(RESEND_SECONDS);
    const inputsRef = useRef([]);

    // Reset khi mở/đóng
    useEffect(() => {
        if (open) {
            setStep("phone");
            setPhone("");
            setOtp(Array(OTP_LEN).fill(""));
            setSeconds(RESEND_SECONDS);
            form.resetFields();
        }
    }, [open, form]);

    // Timer đếm ngược cho resend
    useEffect(() => {
        if (step !== "otp") return;
        if (seconds <= 0) return;

        const id = setInterval(() => setSeconds((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [step, seconds]);

    const otpValue = useMemo(() => otp.join(""), [otp]);
    const canVerify = otpValue.length === OTP_LEN && /^\d{6}$/.test(otpValue);

    const handlePhoneSubmit = (values) => {
        const raw = String(values.phone || "").replace(/\s+/g, "");
        setPhone(raw);

        // TODO: gọi API gửi OTP qua Zalo/SMS tại đây
        // await api.sendOtp({ phone: raw });

        setStep("otp");
        setOtp(Array(OTP_LEN).fill(""));
        setSeconds(RESEND_SECONDS);

        // focus ô đầu tiên
        setTimeout(() => inputsRef.current?.[0]?.focus(), 0);
    };

    const handleVerify = async () => {
        if (!canVerify) return;

        // TODO: gọi API verify OTP thật tại đây
        // const ok = await api.verifyOtp({ phone, otp: otpValue });
        const ok = true; // mock

        if (ok) {
            const profile = {
                id: "u_" + Date.now(),
                fullName: "Người dùng mới",
                phone,
                avatarUrl: "",
            };
            onSuccess?.(profile);
            onClose?.();
        } else {
            // Xử lý lỗi OTP sai:
            // message.error("Mã OTP không đúng, vui lòng thử lại");
            setOtp(Array(OTP_LEN).fill(""));
            inputsRef.current?.[0]?.focus();
        }
    };

    const handleChangeDigit = (idx, value) => {
        const v = value.replace(/\D/g, "").slice(-1); // chỉ 1 số
        const next = [...otp];
        next[idx] = v;
        setOtp(next);

        if (v && idx < OTP_LEN - 1) {
            inputsRef.current?.[idx + 1]?.focus();
        }
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === "Backspace") {
            if (!otp[idx] && idx > 0) {
                // lùi sang ô trước khi đang trống
                inputsRef.current?.[idx - 1]?.focus();
                const next = [...otp];
                next[idx - 1] = "";
                setOtp(next);
            } else {
                // xóa ô hiện tại
                const next = [...otp];
                next[idx] = "";
                setOtp(next);
            }
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
        if (e.key === "Enter" && canVerify) {
            handleVerify();
        }
    };

    const handlePaste = (e) => {
        const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
        if (text.length === OTP_LEN) {
            setOtp(text.split(""));
            // auto submit nếu đủ 6 số
            setTimeout(() => handleVerify(), 0);
            e.preventDefault();
        }
    };

    const handleResend = async () => {
        // TODO: gọi API gửi lại OTP
        // await api.resendOtp({ phone });

        setOtp(Array(OTP_LEN).fill(""));
        setSeconds(RESEND_SECONDS);
        inputsRef.current?.[0]?.focus();
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
                {/* LEFT illustration */}
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

                {/* RIGHT content */}
                <div className="flex flex-col justify-center w-[60%] h-full px-8">
                    {step === "phone" && (
                        <>
                            <h3 className="text-gray-900 font-semibold text-[14px]">Xin chào bạn</h3>
                            <h2 className="text-gray-900 font-bold text-[22px] mb-5">Đăng ký tài khoản mới</h2>

                            <Form form={form} layout="vertical" onFinish={handlePhoneSubmit} requiredMark={false}>
                                <Form.Item
                                    name="phone"
                                    rules={[
                                        { required: true, message: "Vui lòng nhập số điện thoại" },
                                        {
                                            validator: (_, v) =>
                                                !v || VN_PHONE_REGEX.test(String(v).replace(/\s+/g, ""))
                                                    ? Promise.resolve()
                                                    : Promise.reject("Số điện thoại không hợp lệ"),
                                        },
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="Nhập số điện thoại"
                                        prefix={<PhoneOutlined />}
                                        inputMode="tel"
                                        maxLength={15}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    className="!bg-[#f07e7a] hover:!bg-[#ea6a66] w-full h-[44px] font-semibold"
                                >
                                    Tiếp tục
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
                                    onClick={() => setStep("phone")}
                                >
                                    <ArrowLeftOutlined />
                                    <span>Quay lại</span>
                                </button>
                            </div>

                            <h2 className="text-gray-900 font-bold text-[22px]">Nhập mã xác minh</h2>
                            <p className="text-[14px] text-gray-600 mt-1">
                                Chúng tôi đã gửi mã xác minh gồm 6 chữ số tới số điện thoại{" "}
                                <strong>{phone}</strong> qua tài khoản Zalo hoặc SMS
                            </p>

                            <div className="mt-5 flex gap-2" onPaste={handlePaste}>
                                {Array.from({ length: OTP_LEN }).map((_, i) => (
                                    <Input
                                        key={i}
                                        ref={(el) => (inputsRef.current[i] = el?.input)}
                                        size="large"
                                        maxLength={1}
                                        value={otp[i]}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="!w-12 !h-12 text-center text-[18px]"
                                        onChange={(e) => handleChangeDigit(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                    />
                                ))}
                            </div>

                            <div className="text-[12px] text-gray-500 mt-2">
                                Mã có hiệu lực trong 5 phút.{" "}
                                {seconds > 0 ? (
                                    <span>Gửi lại mã sau <span className="text-[#d6402c] font-semibold">0{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span></span>
                                ) : (
                                    <button onClick={handleResend} className="text-[#d6402c] font-semibold underline">
                                        Gửi lại mã
                                    </button>
                                )}
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                disabled={!canVerify}
                                onClick={handleVerify}
                                className={`mt-6 w-full h-[44px] font-semibold ${canVerify ? "!bg-[#d6402c] hover:!bg-[#c13628]" : "!bg-[#f5bdbb] cursor-not-allowed"
                                    }`}
                            >
                                Xác minh
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}

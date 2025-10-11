import { Form, Input, Button } from "antd";

export default function OtpZaloForm({
    form,
    maskInfo,
    sentTo,
    resendIn,
    onResend,
    onBack,
    onVerify,
    loading,
    channel = "email", // 'email' | 'zalo' (mặc định email)
}) {
    const isEmail = channel === "email";
    const viaText = isEmail ? "email" : "Zalo";
    const seeCodeText = isEmail ? "Mở hộp thư của bạn" : "Xem mã trong Zalo ngay";
    const resendText = isEmail ? "Gửi lại OTP qua email" : "Gửi lại OTP qua Zalo";
    const noteText = isEmail
        ? "Lưu ý: Kiểm tra Inbox/Spam để nhận mã kịp thời."
        : "Lưu ý: Kiểm tra thông báo Zalo để nhận mã kịp thời.";

    return (
        <>
            <p className="text-[14px] text-gray-700 mb-2">
                Mã OTP đã được gửi qua <b>{viaText}</b> tới{" "}
                <b>{maskInfo || sentTo}</b>.{" "}
                <a href="#" className="text-[#2d5be3] hover:underline">
                    {seeCodeText}
                </a>
            </p>

            <Form form={form} onFinish={onVerify} layout="vertical" requiredMark={false}>
                <Form.Item
                    name="otp"
                    label="Nhập OTP"
                    rules={[
                        { required: true, message: "Vui lòng nhập OTP" },
                        { pattern: /^\d{6}$/, message: "OTP phải gồm 6 chữ số" },
                    ]}
                >
                    <Input
                        size="large"
                        placeholder="Nhập OTP"
                        maxLength={6}
                        inputMode="numeric"
                        className="h-[44px] rounded-lg"
                    />
                </Form.Item>

                <div className="text-[14px] text-gray-600 -mt-2 mb-4">
                    Không nhận được OTP.{" "}
                    {resendIn > 0 ? (
                        <>
                            {isEmail ? "Gửi lại qua email sau " : "Gửi lại qua Zalo sau "}
                            <b>{resendIn}s</b>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onResend}
                            className="text-[#2d5be3] hover:underline"
                            disabled={loading}
                        >
                            {resendText}
                        </button>
                    )}
                    <div className="mt-2 text-center">{noteText}</div>
                </div>

                <div className="flex items-center justify-between">
                    <button type="button" onClick={onBack} className="text-[#2d5be3] hover:underline">
                        Quay lại
                    </button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={loading}
                        className="h-[44px] px-8 rounded-xl !bg-[#6f80a0] hover:!bg-[#5e6f8f] border-0"
                    >
                        Tiếp tục
                    </Button>
                </div>
            </Form>
        </>
    );
}

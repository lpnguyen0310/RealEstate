import { Form, Input, Button } from "antd";
import { ArrowLeftOutlined, SafetyCertificateOutlined } from "@ant-design/icons";

export default function OtpZaloForm({
  form,
  maskInfo,
  sentTo,
  resendIn,
  onResend,
  onBack,
  onVerify,
  loading,
  channel = "email", // 'email' | 'zalo'
  otpError,          // 🔴 lỗi từ BE
  onClearOtpError,   // 🔴 hàm clear lỗi
}) {
  const isEmail = channel === "email";
  const viaText = isEmail ? "email" : "Zalo";
  const seeCodeText = isEmail ? "Mở hộp thư của bạn" : "Xem mã trong Zalo ngay";
  const resendText = isEmail ? "Gửi lại OTP qua email" : "Gửi lại OTP qua Zalo";
  const noteText = isEmail
    ? "Lưu ý: Kiểm tra Inbox/Spam để nhận mã kịp thời."
    : "Lưu ý: Kiểm tra thông báo Zalo để nhận mã kịp thời.";

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

      {/* Header + badge */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[11px] font-medium text-sky-600 border border-sky-100">
          <SafetyCertificateOutlined className="text-[12px]" />
          Xác minh OTP
        </span>

        <h2 className="text-gray-900 font-semibold text-[22px] leading-snug">
          Nhập mã xác thực 6 số
        </h2>

        <p className="text-[13px] text-gray-600 leading-relaxed">
          Mã OTP đã được gửi qua{" "}
          <span className="font-semibold text-gray-900">{viaText}</span> đến{" "}
          <span className="font-semibold text-gray-900">
            {maskInfo || sentTo}
          </span>
          .{" "}
          <a
            href="#"
            className="text-[#2d5be3] hover:underline font-medium"
          >
            {seeCodeText}
          </a>
        </p>
      </div>

      <Form
        form={form}
        onFinish={onVerify}
        layout="vertical"
        requiredMark={false}
        className="mt-1"
      >
        {/* OTP input */}
        <Form.Item
          name="otp"
          label={
            <span className="text-[13px] font-medium text-gray-700">
              Nhập OTP
            </span>
          }
          validateStatus={otpError ? "error" : ""}
          help={otpError}
          rules={[
            { required: true, message: "Vui lòng nhập OTP" },
            { pattern: /^\d{6}$/, message: "OTP phải gồm 6 chữ số" },
          ]}
          className="mb-3"
        >
          <Input
            size="large"
            placeholder="● ● ● ● ● ●"
            maxLength={6}
            inputMode="numeric"
            className="h-[48px] rounded-xl text-center tracking-[0.4em] font-mono text-[18px]
                       border-gray-200 focus:border-sky-400 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.25)]
                       placeholder:tracking-normal placeholder:text-gray-300 transition-all"
            onChange={() => onClearOtpError?.()} // gõ lại thì clear lỗi BE
          />
        </Form.Item>

        {/* Resend + note */}
        <div className="text-[13px] text-gray-600 -mt-1 mb-4">
          <div className="flex flex-wrap items-center gap-1 justify-between">
            <span>
              Không nhận được OTP?{" "}
              {resendIn > 0 ? (
                <>
                  {isEmail
                    ? "Bạn có thể gửi lại qua email sau "
                    : "Bạn có thể gửi lại qua Zalo sau "}
                  <b>{resendIn}s</b>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onResend}
                  className="text-[#2d5be3] hover:underline font-medium"
                  disabled={loading}
                >
                  {resendText}
                </button>
              )}
            </span>
          </div>

          <div className="mt-2 text-[12px] text-gray-400 text-left">
            {noteText}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-[13px] text-gray-500 hover:text-gray-800 hover:underline"
          >
            Quay lại bước trước
          </button>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="h-[44px] px-8 rounded-xl border-0 font-semibold
                       bg-gradient-to-r from-[#7da4ff] to-[#4c6fff]
                       hover:from-[#6b96fb] hover:to-[#3f63f3]
                       shadow-sm hover:shadow-md transition-all"
          >
            Tiếp tục
          </Button>
        </div>
      </Form>
    </div>
  );
}

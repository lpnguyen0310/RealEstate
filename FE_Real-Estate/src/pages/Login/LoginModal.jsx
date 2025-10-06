import { useEffect, useState } from "react";
import { Modal, Form, Button, message } from "antd";
import LoginForm from "@/components/auth/forms/LoginForm";
import ForgotForm from "@/components/auth/forms/ForgotForm";
import OtpZaloForm from "@/components/auth/forms/OtpZaloForm";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm";
import ForgotSuccessPanel from "@/components/auth/panels/ForgotSuccessPanel";
import useCountdown from "@/utils/useCountdown";
import { isPhone, isEmail, maskPhone } from "@/utils/validators";

export default function LoginModal({ open, onClose, onRegisterClick, onSuccess }) {
  const [form] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  // 'login' | 'forgot' | 'otp_zalo' | 'reset' | 'forgot_success'
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [maskInfo, setMaskInfo] = useState("");

  const { value: resendIn, restart: restartCountdown, setValue: setResendIn } = useCountdown(60);

  // ===== LOGIN =====
  const onFinishLogin = (values) => {
    const profile = {
      id: "u_001",
      fullName: "Lê Phước Nguyên",
      email: /@/.test(values.username) ? values.username : undefined,
      phone: /@/.test(values.username) ? undefined : values.username,
      avatarUrl: "",
    };
    onSuccess?.(profile);
    onClose?.();
  };

  // ===== FORGOT =====
  const onFinishForgot = async ({ account }) => {
    try {
      setLoading(true);
      // TODO: call API gửi link/OTP
      await new Promise((r) => setTimeout(r, 600));
      setSentTo(account);

      if (isPhone(account)) {
        setMaskInfo(maskPhone(account));
        setMode("otp_zalo");
        restartCountdown(60);
        otpForm.resetFields();
      } else if (isEmail(account)) {
        setMode("forgot_success");
        message.success("Đã gửi hướng dẫn khôi phục. Vui lòng kiểm tra email!");
      }
    } catch {
      message.error("Gửi yêu cầu thất bại, thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // ===== OTP =====
  const resendOtp = async () => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500)); // TODO: API resend
      restartCountdown(60);
      message.success("Đã gửi lại OTP qua Zalo.");
    } catch {
      message.error("Không gửi lại được OTP.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async ({ otp }) => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600)); // TODO: verify { phone: sentTo, otp }
      message.success("Xác thực OTP thành công.");
      setMode("reset");
    } catch {
      message.error("OTP không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  // ===== RESET PASSWORD =====
  const onFinishReset = async ({ newPassword }) => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700)); // TODO: reset API
      message.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      setMode("login");
      resetForm.resetFields();
      form.resetFields();
    } catch {
      message.error("Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
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

        {/* RIGHT: sub-views */}
        <div className="flex flex-col justify-center w-[60%] h-full px-8">
          {mode === "login" && (
            <LoginForm
              form={form}
              onFinish={onFinishLogin}
              onForgot={() => setMode("forgot")}
              onRegisterClick={onRegisterClick}
            />
          )}

          {mode === "forgot" && (
            <ForgotForm
              form={forgotForm}
              onSubmit={onFinishForgot}
              loading={loading}
              onBack={() => setMode("login")}
            />
          )}

          {mode === "otp_zalo" && (
            <OtpZaloForm
              form={otpForm}
              maskInfo={maskInfo}
              sentTo={sentTo}
              resendIn={resendIn}
              onResend={resendOtp}
              onBack={() => setMode("forgot")}
              onVerify={onVerifyOtp}
              loading={loading}
            />
          )}

          {mode === "reset" && (
            <ResetPasswordForm form={resetForm} onSubmit={onFinishReset} loading={loading} />
          )}

          {mode === "forgot_success" && (
            <ForgotSuccessPanel sentTo={sentTo} onBackToLogin={() => setMode("login")} />
          )}
        </div>
      </div>
    </Modal>
  );
}

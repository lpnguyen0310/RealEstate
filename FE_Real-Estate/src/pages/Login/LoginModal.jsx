// src/pages/Login/LoginModal.jsx
import { useEffect, useState } from "react";
import { Modal, Form, message } from "antd";

import LoginForm from "@/components/auth/forms/LoginForm";
import ForgotForm from "@/components/auth/forms/ForgotForm";
import OtpZaloForm from "@/components/auth/forms/OtpZaloForm";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm";
import ForgotSuccessPanel from "@/components/auth/panels/ForgotSuccessPanel";
import LoggingInPanel from "@/components/auth/panels/LoggingInPanel";

import useCountdown from "@/utils/useCountdown";
import { isPhone, isEmail, maskPhone } from "@/utils/validators";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginModal({
  open,
  onClose,
  onRegisterClick,
  onSuccess,
  onBeginLogging, // ✅ mới
}) {
  const { login } = useAuth();

  const [form] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  // login | forgot | otp_zalo | reset | forgot_success | logging_in
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [forceClosed, setForceClosed] = useState(false); // ✅ ép đóng nội bộ

  const [sentTo, setSentTo] = useState("");
  const [maskInfo, setMaskInfo] = useState("");

  const { value: resendIn, restart: restartCountdown } = useCountdown(60);

  // Reset khi mở modal
  useEffect(() => {
    if (open) {
      setMode("login");
      setLoading(false);
      setForceClosed(false);
      form.resetFields();
      forgotForm.resetFields();
      otpForm.resetFields();
      resetForm.resetFields();
    }
  }, [open]);

  // ===== ĐĂNG NHẬP =====
  const onFinishLogin = async (values) => {
    try {
      setLoading(true);
      await login({
        username: values.username,
        password: values.password,
      });

      // Không đóng ngay → chuyển qua panel "Đang đăng nhập"
      setMode("logging_in");
      onBeginLogging?.(); // ✅ báo Header bật Skeleton
      message.success("Đăng nhập thành công!");
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("chưa được đăng ký")) {
        form.setFields([{ name: "username", errors: [msg] }]);
      } else if (msg.includes("mật khẩu không đúng")) {
        form.setFields([{ name: "password", errors: [msg] }]);
      } else {
        message.error(msg || "Đăng nhập thất bại, vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== QUÊN MẬT KHẨU =====
  const onFinishForgot = async ({ account }) => {
    try {
      setLoading(true);
      // TODO: gọi API thật
      await new Promise((r) => setTimeout(r, 600));
      setSentTo(account);

      if (isPhone(account)) {
        setMaskInfo(maskPhone(account));
        setMode("otp_zalo");
        restartCountdown(60);
        otpForm.resetFields();
      } else if (isEmail(account)) {
        setMode("forgot_success");
        message.success("Đã gửi hướng dẫn khôi phục qua email!");
      }
    } catch {
      message.error("Gửi yêu cầu thất bại, thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // ===== OTP (Zalo) =====
  const resendOtp = async () => {
    try {
      setLoading(true);
      // TODO: gọi API resend OTP
      await new Promise((r) => setTimeout(r, 500));
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
      // TODO: gọi API verify OTP
      await new Promise((r) => setTimeout(r, 600));
      message.success("Xác thực OTP thành công.");
      setMode("reset");
    } catch {
      message.error("OTP không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  // ===== ĐẶT LẠI MẬT KHẨU =====
  const onFinishReset = async ({ newPassword }) => {
    try {
      setLoading(true);
      // TODO: API đổi mật khẩu
      await new Promise((r) => setTimeout(r, 700));
      message.success("Đổi mật khẩu thành công, vui lòng đăng nhập lại.");
      setMode("login");
      resetForm.resetFields();
      form.resetFields();
    } catch {
      message.error("Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Panel "Đang đăng nhập" xong → đóng chắc chắn & báo ra ngoài
  const handleLoggingDone = () => {
    setForceClosed(true); // ✅ ép đóng modal (dù cha quên setOpen(false))
    onSuccess?.();
    onClose?.();
  };

  const isBlockingClose = mode === "logging_in";
  // GHIM mở modal khi đang logging_in, và KHÔNG mở nếu đã bị ép đóng
  const shouldOpen = (open || isBlockingClose) && !forceClosed;

  return (
    <Modal
      open={shouldOpen}
      onCancel={isBlockingClose ? undefined : onClose}
      footer={null}
      centered
      width={800}
      destroyOnClose
      maskClosable={!isBlockingClose}
      closable={!isBlockingClose}
      bodyStyle={{ height: 700, padding: 0, overflow: "hidden" }}
      modalRender={(node) => <div className="animate-fade-up">{node}</div>}
    >
      <div className="flex flex-row h-full w-full">
        {/* Bên trái: minh họa */}
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

        {/* Bên phải: form/panel */}
        <div className="flex flex-col justify-center w-[60%] h-full px-8">
          {mode === "login" && (
            <LoginForm
              form={form}
              onFinish={onFinishLogin}
              loading={loading}
              onForgot={() => setMode("forgot")}
              onRegisterClick={onRegisterClick}
            />
          )}

          {mode === "forgot" && (
            <ForgotForm
              form={forgotForm}
              loading={loading}
              onSubmit={onFinishForgot}
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
            <ResetPasswordForm
              form={resetForm}
              onSubmit={onFinishReset}
              loading={loading}
            />
          )}

          {mode === "forgot_success" && (
            <ForgotSuccessPanel
              sentTo={sentTo}
              onBackToLogin={() => setMode("login")}
            />
          )}

          {mode === "logging_in" && <LoggingInPanel onDone={handleLoggingDone} />}
        </div>
      </div>
    </Modal>
  );
}

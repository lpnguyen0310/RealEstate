import { useEffect, useState } from "react";
import { Modal, Form, message, Grid } from "antd";
import { useDispatch } from "react-redux";
import { loginThunk } from "@/store/authSlice";
import { redirectAfterLogin } from "@/routes/helpers/redirectAfterLogin";
import { useNavigate, useLocation } from "react-router-dom";

import LoginForm from "@/components/auth/forms/LoginForm";
import ForgotForm from "@/components/auth/forms/ForgotForm";
import OtpZaloForm from "@/components/auth/forms/OtpZaloForm";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm";
import LoggingInPanel from "@/components/auth/panels/LoggingInPanel";

import useCountdown from "@/utils/useCountdown";
import { isPhone, isEmail, maskPhone, maskEmail } from "@/utils/validators";

export default function LoginModal({
  open,
  onClose,
  onRegisterClick,
  onSuccess,
  onBeginLogging,
}) {
  const dispatch = useDispatch();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [form] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [forceClosed, setForceClosed] = useState(false);
  const [loginRoles, setLoginRoles] = useState([]);
  const [sentTo, setSentTo] = useState("");
  const [maskInfo, setMaskInfo] = useState("");
  const [channel, setChannel] = useState("zalo");

  const { value: resendIn, restart: restartCountdown } = useCountdown(60);

  useEffect(() => {
    if (open) {
      setMode("login");
      setLoading(false);
      setForceClosed(false);
      setSentTo("");
      setMaskInfo("");
      setChannel("zalo");
      form.resetFields();
      forgotForm.resetFields();
      otpForm.resetFields();
      resetForm.resetFields();
    }
  }, [open]);

  const onFinishLogin = async (values) => {
    try {
      setLoading(true);
      const { roles = [] } = await dispatch(
        loginThunk({
          username: values.username,
          password: values.password,
        })
      ).unwrap();

      setLoginRoles(roles);
      setMode("logging_in");
      onBeginLogging?.();
      message.success("Đăng nhập thành công!");
    } catch (errMsg) {
      const msg = errMsg || "";
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

  const onFinishForgot = async ({ account }) => {
    try {
      setLoading(true);
      setSentTo(account);

      if (isPhone(account)) {
        setChannel("zalo");
        setMaskInfo(maskPhone(account));
        setMode("otp_zalo");
        restartCountdown(60);
        otpForm.resetFields();
        await new Promise((r) => setTimeout(r, 500));
        message.success("Đã gửi OTP qua Zalo.");
        return;
      }

      if (isEmail(account)) {
        setChannel("email");
        setMaskInfo(maskEmail(account));
        setMode("otp_zalo");
        restartCountdown(60);
        otpForm.resetFields();
        await new Promise((r) => setTimeout(r, 500));
        message.success("Đã gửi OTP qua email.");
        return;
      }

      message.error("Vui lòng nhập email hoặc số điện thoại hợp lệ.");
    } catch {
      message.error("Gửi yêu cầu thất bại, thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));
      restartCountdown(60);
      message.success(
        channel === "zalo" ? "Đã gửi lại OTP qua Zalo." : "Đã gửi lại OTP qua email."
      );
    } catch {
      message.error("Không gửi lại được OTP.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async ({ otp }) => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      message.success("Xác thực OTP thành công.");
      setMode("reset");
    } catch {
      message.error("OTP không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const onFinishReset = async ({ newPassword }) => {
    try {
      setLoading(true);
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

  const handleLoggingDone = () => {
    redirectAfterLogin({
      roles: loginRoles,
      navigate,
      location,
    });
    setForceClosed(true);
    onSuccess?.();
    onClose?.();
  };

  const isBlockingClose = mode === "logging_in";
  const shouldOpen = (open || isBlockingClose) && !forceClosed;

  return (
    <Modal
      open={shouldOpen}
      onCancel={isBlockingClose ? undefined : onClose}
      footer={null}
      centered={!isMobile}
      destroyOnClose
      maskClosable={!isBlockingClose}
      closable={!isBlockingClose}
      width={isMobile ? "100%" : 800}
      style={{
        top: isMobile ? 0 : undefined,
        padding: 0,
        maxWidth: isMobile ? "100vw" : undefined,
      }}
      bodyStyle={{
        padding: 0,
        overflow: "hidden",
        height: isMobile ? "100svh" : 700,
      }}
      modalRender={(node) => <div className="animate-fade-up">{node}</div>}
    >
      <div
        className={`flex ${isMobile ? "flex-col h-full w-full" : "flex-row h-full w-full"
          }`}
      >
        {/* Bên trái: chỉ hiện desktop */}
        {!isMobile && (
          <div className="w-[40%] h-full bg-[#ffe9e6] flex flex-col justify-center items-center rounded-l-[8px]">
            <img
              src="/assets/login-illustration.png"
              alt="illustration"
              className="max-w-[220px] object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <p className="mt-6 text-[#c23a2a] text-[16px] font-semibold text-center leading-snug">
              Tìm nhà đất
              <br />
              Batdongsan.com.vn dẫn lối
            </p>
          </div>
        )}

        {/* Bên phải */}
        <div
          className={
            isMobile
              ? "flex-1 w-full h-full px-4 py-6 overflow-y-auto"
              : "flex flex-col justify-center w-[60%] h-full px-8"
          }
        >
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
              channel={channel}
            />
          )}

          {mode === "reset" && (
            <ResetPasswordForm
              form={resetForm}
              onSubmit={onFinishReset}
              loading={loading}
            />
          )}

          {mode === "logging_in" && <LoggingInPanel onDone={handleLoggingDone} />}
        </div>
      </div>
    </Modal>
  );
}

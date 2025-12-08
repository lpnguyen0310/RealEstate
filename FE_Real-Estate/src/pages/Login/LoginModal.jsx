import { useEffect, useState } from "react";
import { Modal, Form, message, Grid, Button } from "antd";
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
import { isPhone, isEmail, maskEmail } from "@/utils/validators";
import authApi from "@/api/register";

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
  const [channel, setChannel] = useState("email"); // email | zalo
  const [resetTicket, setResetTicket] = useState("");
  const [otpError, setOtpError] = useState(""); // 🔴 thêm state lỗi OTP

  const { value: resendIn, restart: restartCountdown } = useCountdown(60);

  useEffect(() => {
    if (open) {
      setMode("login");
      setLoading(false);
      setForceClosed(false);
      setSentTo("");
      setMaskInfo("");
      setChannel("email");
      setResetTicket("");
      setOtpError("");

      form.resetFields();
      forgotForm.resetFields();
      otpForm.resetFields();
      resetForm.resetFields();
    }
  }, [open]);

  // ========== LOGIN ==========
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

  // ========== FORGOT – BƯỚC 1 ==========
  const onFinishForgot = async ({ account }) => {
    try {
      setLoading(true);
      setOtpError(""); // clear lỗi OTP nếu có

      // Hiện tại chỉ hỗ trợ email
      if (isPhone(account)) {
        message.warning("Hiện tại chỉ hỗ trợ khôi phục mật khẩu qua email.");
        return;
      }

      if (!isEmail(account)) {
        message.error("Vui lòng nhập email hợp lệ.");
        return;
      }

      setSentTo(account);
      setChannel("email");

      const res = await authApi.forgotRequestOtp(account);
      const data = res?.data?.data || {};
      const masked = data.maskedEmail || maskEmail(account);

      setMaskInfo(masked);
      setMode("otp_zalo");
      restartCountdown(60);
      otpForm.resetFields();

      message.success(`Đã gửi mã OTP đến ${masked}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Gửi yêu cầu thất bại, thử lại sau.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ========== RESEND OTP ==========
  const resendOtp = async () => {
    try {
      if (!sentTo) return;
      setLoading(true);
      setOtpError(""); // clear lỗi khi gửi lại

      if (channel === "email") {
        await authApi.forgotRequestOtp(sentTo);
        restartCountdown(60);
        message.success("Đã gửi lại OTP qua email.");
      } else {
        await new Promise((r) => setTimeout(r, 500));
        restartCountdown(60);
        message.success("Đã gửi lại OTP.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Không gửi lại được OTP.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ========== VERIFY OTP ==========
  const onVerifyOtp = async ({ otp }) => {
    try {
      setLoading(true);
      setOtpError(""); // clear lỗi cũ

      if (channel === "email") {
        const res = await authApi.forgotVerifyOtp({
          email: sentTo,
          otp,
        });

        const data = res?.data?.data || {};
        const ticket = data.token || data.ticket;
        if (!ticket) {
          throw new Error("Không nhận được ticket từ server.");
        }

        setResetTicket(ticket);
        message.success("Xác thực OTP thành công.");
        setMode("reset");
        resetForm.resetFields();
      } else {
        await new Promise((r) => setTimeout(r, 600));
        message.success("Xác thực OTP thành công.");
        setMode("reset");
        resetForm.resetFields();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "OTP không đúng hoặc đã hết hạn.";
      setOtpError(msg); // 🔴 GẮN LỖI VÀO FIELD
      // message.error(msg);  // nếu muốn toast thêm thì mở lại
    } finally {
      setLoading(false);
    }
  };

  // ========== RESET PASSWORD ==========
  const onFinishReset = async ({ newPassword, confirmPassword }) => {
    try {
      if (!resetTicket) {
        message.error("Thiếu ticket reset, vui lòng thực hiện lại từ đầu.");
        return;
      }

      setLoading(true);

      await authApi.forgotResetPassword({
        ticket: resetTicket,
        password: newPassword,
        confirmPassword,
      });

      message.success("Đổi mật khẩu thành công.");
      setMode("reset_success");
      resetForm.resetFields();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Đổi mật khẩu thất bại.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ========== LOGIN DONE ==========
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
        {!isMobile && (
          <div className="w-[40%] h-full bg-[#ffe9e6] flex flex-col justify-center items-center rounded-l-[8px]">
            <img
              src="/assets/login-illustration.png"
              alt="illustration"
              className="max-w-[220px] object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <p className="mt-6 text-[#c23a2a] text-[16px] font-semibold text-center leading-snug">
              Tìm nhà đất
              <br />
              Nexus5-land.com.vn dẫn lối
            </p>
          </div>
        )}

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
              onBack={() => {
                setMode("forgot");
                setOtpError("");
                otpForm.resetFields();
              }}
              onVerify={onVerifyOtp}
              loading={loading}
              channel={channel}
              otpError={otpError}                  // 🔴 truyền xuống
              onClearOtpError={() => setOtpError("")} // 🔴 clear khi user gõ lại
            />
          )}

          {mode === "reset" && (
            <ResetPasswordForm
              form={resetForm}
              onSubmit={onFinishReset}
              loading={loading}
            />
          )}

          {mode === "reset_success" && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-[22px] font-bold text-gray-900 mb-2">
                Mật khẩu đã được cập nhật
              </h2>
              <p className="text-[14px] text-gray-600 mb-6 max-w-[320px]">
                Bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản của mình.
              </p>

              <div className="flex gap-3 w-full max-w-[320px]">
                <Button
                  block
                  className="h-[44px]"
                  onClick={() => {
                    setMode("login");
                    form.resetFields();
                  }}
                >
                  Quay lại đăng nhập
                </Button>
                <Button
                  type="primary"
                  block
                  className="h-[44px] !bg-[#d6402c] hover:!bg-[#c13628]"
                  onClick={() => {
                    onClose?.();
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}

          {mode === "logging_in" && (
            <LoggingInPanel onDone={handleLoggingDone} />
          )}
        </div>
      </div>
    </Modal>
  );
}

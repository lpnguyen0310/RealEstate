import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginModal from "./LoginModal";

export default function LoginPage() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleClose = () => {
    setOpen(false);
    navigate(-1); // hoặc navigate("/", { replace: true })
  };

  const handleSuccess = () => {
    setOpen(false);                      // Đóng state trước
    navigate(from, { replace: true });   // rồi mới điều hướng
  };

  const handleGoRegister = () => {
    setOpen(false);
    navigate("/register", { replace: true });
  };

  return (
    <LoginModal
      open={open}                   // dùng state
      onClose={handleClose}
      onRegisterClick={handleGoRegister}
      onSuccess={handleSuccess}
    />
  );
}

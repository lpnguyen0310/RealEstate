import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";

export default function LoginPage() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
    navigate(-1);                   // hoặc: navigate("/", { replace: true })
  };

  const handleSuccess = (profile) => {
    // TODO: lưu profile vào Redux/localStorage...
    navigate("/", { replace: true });
  };

  const handleGoRegister = () => {
    setOpen(false);
    navigate("/register");
  };

  return (
    <LoginModal
      open={open}
      onClose={handleClose}
      onRegisterClick={handleGoRegister}
      onSuccess={handleSuccess}
    />
  );
}

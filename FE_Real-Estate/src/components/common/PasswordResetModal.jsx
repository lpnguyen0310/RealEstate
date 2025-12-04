// src/components/common/PasswordResetModal.jsx
import { useEffect, useState } from "react";
import { Modal, Button } from "antd";

export default function PasswordResetModal({
    open,
    message,
    onLogout,
    seconds = 10,
}) {
    const [countdown, setCountdown] = useState(seconds);

    // Reset countdown mỗi lần mở
    useEffect(() => {
        if (!open) return;
        setCountdown(seconds);
    }, [open, seconds]);

    // Đếm ngược, hết giờ thì gọi onLogout
    useEffect(() => {
        if (!open) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (onLogout) onLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [open, onLogout]);

    return (
        <Modal
            open={open}
            footer={null}
            closable={false}
            maskClosable={false}
            centered
        >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Mật khẩu đã được đặt lại
            </h3>
            <p style={{ marginBottom: 8 }}>
                {message ||
                    "Mật khẩu tài khoản của bạn đã được quản trị viên đặt lại. Vui lòng đăng nhập lại bằng mật khẩu mới được gửi qua email."}
            </p>
            <p style={{ marginBottom: 16, fontWeight: 500 }}>
                Bạn sẽ được tự động đăng xuất sau <b>{countdown}</b> giây.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button type="primary" onClick={onLogout}>
                    Đăng xuất ngay
                </Button>
            </div>
        </Modal>
    );
}

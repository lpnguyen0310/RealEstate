import { useEffect, useState } from "react";
import { Modal, Button } from "antd";

export default function ForceLogoutModal({
    open,
    type,       // "reset" | "locked"
    message,
    onLogout,
    seconds = 10,
}) {
    const [countdown, setCountdown] = useState(seconds);

    useEffect(() => {
        if (!open) return;
        setCountdown(seconds);
    }, [open, seconds]);

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

    // ================= TEMPLATE THEO TYPE =================
    let titleText = "";
    let defaultMessage = "";

    if (type === "reset") {
        titleText = "Mật khẩu đã được đặt lại";
        defaultMessage =
            "Mật khẩu tài khoản của bạn đã được quản trị viên đặt lại. Vui lòng đăng nhập lại bằng mật khẩu mới được gửi qua email.";
    } else if (type === "locked") {
        titleText = "Tài khoản đã bị khóa";
        defaultMessage =
            "Tài khoản của bạn đã bị khóa bởi quản trị viên. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ.";
    } else {
        // fallback nếu lỡ không truyền type
        titleText = "Thông báo";
        defaultMessage =
            "Phiên đăng nhập của bạn sẽ kết thúc. Vui lòng đăng nhập lại để tiếp tục.";
    }

    return (
        <Modal
            open={open}
            footer={null}
            closable={false}
            maskClosable={false}
            centered
        >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {titleText}
            </h3>

            <p style={{ marginBottom: 8 }}>
                {message || defaultMessage}
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

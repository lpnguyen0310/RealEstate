import { Modal, Button } from "antd";
import {
    CheckCircleOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";

export default function AppNotificationModal(props) {
    const {
        open,
        status = "info",       // "success" | "warning" | "error" | "info"
        title,
        message,
        description,
        primaryText = "OK",
        secondaryText,         // ví dụ: "Đóng", "Bỏ qua"
        onPrimary,
        onSecondary,
        onClose,
    } = props;

    const handlePrimary = () => {
        onPrimary && onPrimary();
        onClose && onClose();
    };

    const handleSecondary = () => {
        onSecondary && onSecondary();
        onClose && onClose();
    };

    let Icon = InfoCircleOutlined;
    let iconColor = "#1677ff";

    if (status === "success") {
        Icon = CheckCircleOutlined;
        iconColor = "#52c41a";
    } else if (status === "warning") {
        Icon = ExclamationCircleOutlined;
        iconColor = "#faad14";
    } else if (status === "error") {
        Icon = ExclamationCircleOutlined;
        iconColor = "#ff4d4f";
    }

    return (
        <Modal
            open={open}
            footer={null}
            closable
            onCancel={onClose}
            maskClosable={false}
            centered
        >
            <div style={{ display: "flex", gap: 12 }}>
                <Icon style={{ fontSize: 28, color: iconColor, marginTop: 4 }} />

                <div>
                    <h3
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 8,
                        }}
                    >
                        {title}
                    </h3>

                    {message && (
                        <p style={{ marginBottom: description ? 4 : 16 }}>{message}</p>
                    )}

                    {description && (
                        <p style={{ marginBottom: 16, color: "#555" }}>{description}</p>
                    )}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            marginTop: 8,
                        }}
                    >
                        {secondaryText && (
                            <Button onClick={handleSecondary}>{secondaryText}</Button>
                        )}

                        <Button type="primary" onClick={handlePrimary}>
                            {primaryText}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// src/components/cards/NotificationModal.jsx
import React from "react";
import { Modal, Button } from "antd";

const NotificationModal = ({ visible, onClose, onLoginClick, title, content }) => {
    return (
        <Modal
            title={title}
            visible={visible}
            onCancel={onClose}
            footer={null}
            centered
        >
            <p>{content}</p>
            <Button
                type="primary"
                onClick={onLoginClick}
                style={{ width: "100%" }}
            >
                Đăng nhập
            </Button>
        </Modal>
    );
};

export default NotificationModal;

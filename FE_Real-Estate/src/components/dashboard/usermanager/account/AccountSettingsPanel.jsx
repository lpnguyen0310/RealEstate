// src/components/dashboard/usermanager/account/AccountSettingsPanel.jsx
import React, { useState } from "react";
import {
  Card, Form, Input, Button, Divider, Collapse, Typography, message, Modal,
} from "antd";
import { LockOutlined, DeleteOutlined, StopOutlined, RollbackOutlined } from "@ant-design/icons";
import { userAccountApi } from "@/api/adminApi/userAccountApi";

const { Title, Text } = Typography;

export default function AccountSettingsPanel({ user, onChanged }) {
  const [pwdForm] = Form.useForm();
  const [lockForm] = Form.useForm();

  const [loading, setLoading] = useState({
    lock: false, cancelLock: false, del: false, cancelDel: false, changePwd: false,
  });

  const lockRequested = !!user?.lockRequested;
  const deleteRequested = !!user?.deleteRequested;

  // ===== Modal phản hồi CHUNG (success / error) =====
  const [feedback, setFeedback] = useState({
    open: false,
    type: "success", // 'success' | 'error'
    title: "",
    content: "",
  });

  const openSuccess = (title, content) =>
    setFeedback({ open: true, type: "success", title, content });

  const openError = (title, content) =>
    setFeedback({ open: true, type: "error", title, content });

  const closeFeedback = () =>
    setFeedback((s) => ({ ...s, open: false }));

  /* ========== ĐỔI MẬT KHẨU ========== */
  const onChangePassword = async (values) => {
    console.debug("[onChangePassword] submit values:", values);
    const payload = {
      currentPassword: values.oldPassword,
      newPassword: values.newPassword,
      confirmNewPassword: values.confirmPassword,
    };

    try {
      setLoading((s) => ({ ...s, changePwd: true }));
      const res = await userAccountApi.changePassword(payload);
      console.debug("[onChangePassword] OK:", res);

      // Modal thành công
      openSuccess(
        "Thay đổi mật khẩu thành công",
        (res?.data || res?.message || "Mật khẩu của bạn đã được cập nhật.")
      );

      pwdForm.resetFields(["oldPassword", "newPassword", "confirmPassword"]);
    } catch (err) {
      console.error("[onChangePassword] ERROR:", err);
      const msg = err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại.";
      // Modal lỗi
      openError("Không thể đổi mật khẩu", msg);
    } finally {
      setLoading((s) => ({ ...s, changePwd: false }));
    }
  };

  /* ========== KHÓA TÀI KHOẢN ========== */
  const onLockFinish = async (values) => {
    setLoading((s) => ({ ...s, lock: true }));
    try {
      await userAccountApi.requestLock(values.lockPassword);
      message.success("Đã gửi yêu cầu khóa tài khoản.");
      lockForm.resetFields(["lockPassword"]);
      onChanged?.();
    } catch (err) {
      const msg = err?.response?.data?.message || "Gửi yêu cầu khóa thất bại.";
      openError("Lỗi yêu cầu khóa tài khoản", msg);
    } finally {
      setLoading((s) => ({ ...s, lock: false }));
    }
  };

  const onCancelLock = async () => {
    setLoading((s) => ({ ...s, cancelLock: true }));
    try {
      await userAccountApi.cancelLock();
      message.success("Đã hủy yêu cầu khóa.");
      onChanged?.();
    } catch (err) {
      const msg = err?.response?.data?.message || "Hủy yêu cầu khóa thất bại.";
      openError("Lỗi hủy yêu cầu khóa", msg);
    } finally {
      setLoading((s) => ({ ...s, cancelLock: false }));
    }
  };

  /* ========== XÓA TÀI KHOẢN (giữ nguyên của bạn) ========== */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const onConfirmOk = async () => {
    setConfirmLoading(true);
    try {
      const res = await userAccountApi.requestDelete();
      message.success(res?.data || res?.message || "Đã gửi yêu cầu xóa tài khoản.");
      setConfirmOpen(false);
      onChanged?.();
    } catch (err) {
      const msg = err?.response?.data?.message || "Gửi yêu cầu xóa thất bại.";
      openError("Lỗi yêu cầu xóa", msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto">
      <Card bordered={false} styles={{ body: { padding: "5px 24px" } }}>
        {/* ========== ĐỔI MẬT KHẨU ========== */}
        <Title level={5} className="!mt-0 !mb-4 !text-[23px] font-semibold">Đổi mật khẩu</Title>

        <Form layout="vertical" form={pwdForm} onFinish={onChangePassword}>
          <div className="grid md:grid-cols-[1fr_auto] gap-3">
            <Form.Item
              name="oldPassword"
              label="Mật khẩu hiện tại"
              rules={[{ required: true, message: "Nhập mật khẩu hiện tại" }]}
              className="!mb-0"
            >
              <Input.Password placeholder="Nhập mật khẩu hiện tại" />
            </Form.Item>
            <a className="text-red-500 md:self-end">Bạn quên mật khẩu?</a>
          </div>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Nhập mật khẩu mới" },
              { min: 8, message: "Ít nhất 8 ký tự" },
            ]}
            className="mt-4 !mb-0"
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <div className="grid md:grid-cols-[1fr_auto] gap-3 mt-4">
            <Form.Item
              name="confirmPassword"
              label="Nhập lại mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Nhập lại mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                    return Promise.reject(new Error("Mật khẩu nhập lại không khớp"));
                  },
                }),
              ]}
              className="!mb-0"
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>

            <Form.Item className="!mb-0">
              <Button type="primary" danger htmlType="submit" loading={loading.changePwd}>
                Lưu thay đổi
              </Button>
            </Form.Item>
          </div>
        </Form>

        <Divider className="!my-6" />

        {/* ========== KHÓA & XÓA TÀI KHOẢN ========== */}
        <Collapse
          bordered={false}
          expandIconPosition="end"
          className="bg-transparent"
          items={[
            {
              key: "lock",
              label: <span className="text-[23px] font-semibold">Yêu cầu khóa tài khoản</span>,
              children: (
                <div className="space-y-3">
                  {!lockRequested ? (
                    <Form layout="vertical" form={lockForm} onFinish={onLockFinish}>
                      <div className="flex gap-3 md:items-end">
                        <Form.Item
                          label="Nhập mật khẩu hiện tại"
                          name="lockPassword"
                          className="flex-1 !mb-0"
                          rules={[{ required: true, message: "Nhập mật khẩu" }]}
                        >
                          <Input.Password placeholder="••••••••" />
                        </Form.Item>
                        <Form.Item className="!mb-0">
                          <Button type="primary" danger icon={<LockOutlined />} htmlType="submit" loading={loading.lock}>
                            Gửi yêu cầu khóa
                          </Button>
                        </Form.Item>
                      </div>
                    </Form>
                  ) : (
                    <div className="flex items-center gap-8">
                      <Text type="warning">Bạn đã gửi yêu cầu khóa. Chờ admin xử lý.</Text>
                      <Button icon={<RollbackOutlined />} onClick={onCancelLock} loading={loading.cancelLock}>
                        Hủy yêu cầu khóa
                      </Button>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "delete",
              label: <span className="text-[23px] font-semibold">Yêu cầu xóa tài khoản</span>,
              children: (
                <div className="space-y-3">
                  {!deleteRequested ? (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      className="h-10 rounded-md font-semibold w-full md:w-auto"
                      onClick={() => setConfirmOpen(true)}
                    >
                      Gửi yêu cầu xóa tài khoản
                    </Button>
                  ) : (
                    <div className="flex items-center gap-8">
                      <Text type="danger">Bạn đã gửi yêu cầu xóa. Chờ admin xử lý.</Text>
                      <Button icon={<StopOutlined />} onClick={() => { /* onCancelDelete(); */ }} >
                        Hủy yêu cầu xóa
                      </Button>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal xác nhận xóa (giữ của bạn) */}
      <Modal
        title="Xác nhận yêu cầu xóa tài khoản"
        open={confirmOpen}
        onOk={onConfirmOk}
        onCancel={() => setConfirmOpen(false)}
        okText="Gửi yêu cầu xóa"
        okButtonProps={{ danger: true, icon: <DeleteOutlined /> }}
        cancelText="Hủy"
        centered
        maskClosable={false}
        zIndex={3500}
        getContainer={() => document.body}
        confirmLoading={confirmLoading}
      >
        <div>
          <p>Sau khi gửi yêu cầu xóa, admin sẽ xử lý và <b>không thể hoàn tác</b>.</p>
          <ul style={{ paddingLeft: 18 }}>
            <li>Tin đang hiển thị có thể bị gỡ theo chính sách.</li>
            <li>Số dư (nếu có) sẽ không hoàn lại.</li>
          </ul>
        </div>
      </Modal>

      {/* Modal phản hồi CHUNG — luôn render ra body, zIndex cao */}
      <Modal
        title={feedback.title}
        open={feedback.open}
        onOk={closeFeedback}
        onCancel={closeFeedback}
        okText="Đã hiểu"
        centered
        maskClosable
        zIndex={5000}
        getContainer={() => document.body}
        okButtonProps={feedback.type === "error" ? { danger: true } : {}}
      >
        <div>{feedback.content}</div>
      </Modal>
    </div>
  );
}

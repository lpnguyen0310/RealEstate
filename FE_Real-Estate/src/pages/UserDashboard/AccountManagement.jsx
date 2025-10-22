// src/pages/UserDashboard/AccountManagement.jsx
import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Tabs, Space, Typography, Affix, Button, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";

import AccountSummaryCard from "@/components/dashboard/usermanager/AccountSummaryCard";
import EditInfoForm from "@/components/dashboard/usermanager/account/EditInfoForm";
import AccountSettingsPanel from "@/components/dashboard/usermanager/account/AccountSettingsPanel";
import ProBrokerBlank from "@/components/dashboard/usermanager/account/ProBrokerBlank";
import TopUpForm from "@/components/payments/TopUpForm";

const { Title } = Typography;

export default function AccountManagement() {
  // Lấy user & refetchUser từ DashboardLayout (Outlet context)
  const { user, refetchUser } = useOutletContext() || {};

  // Chuẩn hoá dữ liệu hiển thị thẻ tóm tắt
  const summary = useMemo(() => {
    const username =
      user?.username ||
      user?.fullName ||
      `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
      user?.email ||
      "Người dùng";

    const points = user?.points ?? user?.wallet?.points ?? 0;
    const postBalance = user?.wallet?.postBalance ?? 0;
    const promoBalance = user?.wallet?.promoBalance ?? 0;

    const identityAccount =
      user?.identityCode ||
      user?.accountCode ||
      `BDS${(user?.id ?? "USER").toString().padStart(8, "0")}`;

    const isNewIdentity = !user?.identityCode;

    return { username, points, postBalance, promoBalance, identityAccount, isNewIdentity };
  }, [user]);

  // Tabs & Right panel
  const [activeTab, setActiveTab] = useState("edit");
  const [rightPanel, setRightPanel] = useState("manage"); // 'manage' | 'topup'

  const openTopUp = () => {
    setRightPanel("topup");
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { }
  };
  const backToManage = () => setRightPanel("manage");

  return (
    <section className="w-full max-w-[1100px] mx-auto px-4 md:px-1">
      <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] gap-6">
        {/* LEFT */}
        <div>
          <Affix offsetTop={16}>
            <AccountSummaryCard
              username={summary.username}
              points={summary.points}
              postBalance={summary.postBalance}
              promoBalance={summary.promoBalance}
              identityAccount={summary.identityAccount}
              isNewIdentity={summary.isNewIdentity}
              onTopUp={openTopUp}
            />
          </Affix>
        </div>

        {/* RIGHT */}
        <div>
          {rightPanel === "manage" ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  className="tabs-elevated"
                  items={[
                    {
                      key: "edit",
                      label: "Chỉnh sửa thông tin",
                      // Nếu EditInfoForm có lưu BE, truyền onChanged để refetch user sau khi lưu
                      children: <EditInfoForm initialData={user} onChanged={refetchUser} />,
                    },
                    {
                      key: "settings",
                      label: "Cài đặt tài khoản",
                      // Truyền onChanged để sau khi gửi/hủy yêu cầu khóa/xóa -> refetch user
                      children: <AccountSettingsPanel user={user} onChanged={refetchUser} />,
                    },
                    {
                      key: "pro",
                      label: (
                        <Space>
                          Đăng ký Môi giới chuyên nghiệp
                          <span className="text-red-500 text-xs ml-1">Mới</span>
                        </Space>
                      ),
                      children: <ProBrokerBlank />,
                    },
                  ]}
                />
              </div>

              {activeTab === "edit" && (
                <Affix offsetBottom={24}>
                  <div className="w-full flex justify-end">
                    <Button
                      type="primary"
                      size="large"
                      icon={<SaveOutlined />}
                      onClick={() => message.success("Đã lưu thay đổi (demo).")}
                    // onClick={() => document.getElementById("edit-info-submit")?.click()}
                    >
                      Lưu thay đổi
                    </Button>
                  </div>
                </Affix>
              )}
            </>
          ) : (
            // ===== TOPUP MODE =====
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <Title level={3} className="!m-0">Nạp tiền vào tài khoản</Title>
                <Button onClick={backToManage}>Quay lại quản lý</Button>
              </div>

              <TopUpForm
                user={user}
                onContinue={(amount, method) => {
                  message.success(`Tiếp tục nạp ${amount?.toLocaleString("vi-VN")}đ qua ${method}`);
                  // TODO: điều hướng bước thanh toán
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// src/pages/UserDashboard/AccountManagement.jsx
import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Tabs, Space, Typography, Affix, Button, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";

import AccountSummaryCard from "@/components/dashboard/usermanager/AccountSummaryCard";
import EditInfoForm from "@/components/dashboard/usermanager/account/EditInfoForm";
import AccountSettingsPanel from "@/components/dashboard/usermanager/account/AccountSettingsPanel";
import ProBrokerBlank from "@/components/dashboard/usermanager/account/ProBrokerBlank";

// ✨ import TopUpForm
import TopUpForm from "@/components/payments/TopUpForm";

const { Title } = Typography;

export default function AccountManagement() {
  // 👉 Lấy user từ DashboardLayout qua Outlet context
  const { user: reduxUser } = useOutletContext();
  // Chuẩn hoá dữ liệu summary bên trái
  const summary = useMemo(() => {
    const username =
      reduxUser?.username ||
      reduxUser?.fullName ||
      `${reduxUser?.firstName ?? ""} ${reduxUser?.lastName ?? ""}`.trim() ||
      reduxUser?.email ||
      "Người dùng";

    // Các số dư/điểm — chỉnh theo schema BE của bạn:
    const points = reduxUser?.points ?? reduxUser?.wallet?.points ?? 0;
    const postBalance = reduxUser?.wallet?.postBalance ?? 0;
    const promoBalance = reduxUser?.wallet?.promoBalance ?? 0;

    // Mã định danh tài khoản — tuỳ theo BE
    const identityAccount =
      reduxUser?.identityCode ||
      reduxUser?.accountCode ||
      `BDS${(reduxUser?.id ?? "USER").toString().padStart(8, "0")}`;

    const isNewIdentity = !reduxUser?.identityCode; // ví dụ: chưa có mã chính thức

    return { username, points, postBalance, promoBalance, identityAccount, isNewIdentity };
  }, [reduxUser]);

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
              onTopUp={openTopUp}              // ✨ bấm "Nạp tiền" → mở panel TopUp
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
                      // (tuỳ) truyền initial data cho form nếu component của bạn hỗ trợ
                      children: <EditInfoForm initialData={reduxUser} />,
                    },
                    {
                      key: "settings",
                      label: "Cài đặt tài khoản",
                      children: <AccountSettingsPanel user={reduxUser} />,
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
                user={reduxUser}  // (tuỳ) truyền user cho form
                onContinue={(amount, method) => {
                  message.success(`Tiếp tục nạp ${amount?.toLocaleString("vi-VN")}đ qua ${method}`);
                  // TODO: điều hướng bước thanh toán
                }}
              // invoiceContent={...}  // (tuỳ) nếu cần dữ liệu xuất hoá đơn
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import React, { useState } from "react";
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
  const [activeTab, setActiveTab] = useState("edit");
  // ✨ trạng thái hiển thị panel bên phải: 'manage' (Tabs) | 'topup'
  const [rightPanel, setRightPanel] = useState("manage");

  const openTopUp = () => {
    setRightPanel("topup");
    // (tuỳ chọn) cuộn lên trên cho đẹp
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
  };

  const backToManage = () => setRightPanel("manage");

  return (
    <section className="w-full max-w-[1100px] mx-auto px-4 md:px-1">
      <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] gap-6">
        {/* LEFT */}
        <div>
          <Affix offsetTop={16}>
            <AccountSummaryCard
              username="user4706412"
              points={0}
              postBalance={0}
              promoBalance={0}
              identityAccount="BDSVN047064126"
              isNewIdentity
              // ✨ bấm Nạp tiền -> mở panel TopUp
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
                    { key: "edit",     label: "Chỉnh sửa thông tin", children: <EditInfoForm /> },
                    { key: "settings", label: "Cài đặt tài khoản",   children: <AccountSettingsPanel /> },
                    { key: "pro",      label: <Space>Đăng ký Môi giới chuyên nghiệp <span className="text-red-500 text-xs ml-1">Mới</span></Space>, children: <ProBrokerBlank /> },
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
                onContinue={(amount, method) => {
                  message.success(`Tiếp tục nạp ${amount?.toLocaleString("vi-VN")}đ qua ${method}`);
                  // TODO: điều hướng bước thanh toán
                }}
                // có thể truyền invoiceContent nếu muốn form xuất HĐ
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

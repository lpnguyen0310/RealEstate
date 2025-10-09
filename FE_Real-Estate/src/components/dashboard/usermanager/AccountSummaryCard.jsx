// components/AccountSummaryCard.jsx
import { Card, Avatar, Button, Tag, Tooltip, Space, Typography, message } from "antd";
import { UserOutlined, CopyOutlined, SafetyCertificateFilled, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import React from "react";

const { Text, Title } = Typography;

/**
 * AccountSummaryCard
 * Props:
 *  - username: string
 *  - points: number
 *  - postBalance: number
 *  - promoBalance: number
 *  - identityAccount: string
 *  - isNewIdentity?: boolean
 *  - onTopUp?: () => void
 */
export default function AccountSummaryCard({
  username = "user000000",
  points = 0,
  postBalance = 0,
  promoBalance = 0,
  identityAccount = "BDSVN000000000",
  isNewIdentity = true,
  onTopUp = () => message.info("Nạp tiền (demo)"),
}) {
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(identityAccount);
      message.success("Đã sao chép số tài khoản");
    } catch {
      message.error("Không sao chép được, thử lại");
    }
  };

  return (
    <Card
      className="rounded-2xl border border-gray-100 shadow-sm"
      bodyStyle={{ padding: 16 }}
    >
      {/* Header: avatar + username + points */}
      <div className="flex items-center gap-3">
        <Avatar size={48} icon={<UserOutlined />} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Text className="font-medium truncate">{username}</Text>
            <Tooltip title="Điểm dùng để đổi ưu đãi">
              <QuestionCircleOutlined className="text-gray-400" />
            </Tooltip>
          </div>
          <Text type="secondary" className="text-[13px]">{points} điểm</Text>
        </div>
      </div>

      {/* Body: balances + identity */}
      <div className="mt-4 p-4 bg-gray-50 rounded-xl">
        <Title level={5} className="!m-0 !mb-3 text-gray-800">Số dư tài khoản</Title>

        <div className="space-y-2 text-[14px]">
          <div className="flex items-center justify-between">
            <Text className="text-gray-600">TK tin đăng</Text>
            <Text className="font-semibold">{postBalance.toLocaleString("vi-VN")}</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text className="text-gray-600">TK Khuyến mãi</Text>
            <Text className="font-semibold">{promoBalance.toLocaleString("vi-VN")}</Text>
          </div>
        </div>

        <div className="mt-4">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                {/* Hàng 1: badge + label + (i) */}
                <div className="flex items-center gap-2">
                {isNewIdentity && (
                    <span className="inline-flex h-5 items-center px-2 rounded-md text-[12px] font-semibold bg-red-500 text-white">
                    Mới
                    </span>
                )}
                <span className="text-[13px] text-gray-600">Số tài khoản định danh</span>
                <Tooltip title="Tài khoản dùng để nạp/rút gắn định danh">
                    <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
                </div>

                {/* Hàng 2: icon + số tài khoản + copy */}
                <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <SafetyCertificateFilled className="text-green-600 text-[14px]" />
                    </span>

                    <Text copyable={false} className="font-semibold select-all tracking-wide">
                    {identityAccount}
                    </Text>
                </div>

                <Tooltip title="Sao chép">
                    <Button type="text" shape="circle" size="small" icon={<CopyOutlined />} onClick={copyId} />
                </Tooltip>
                </div>
            </div>
        </div>


        <Button
          type="default"
          danger
          icon={<PlusOutlined />}
          className="mt-4 w-full h-10 rounded-lg font-semibold"
          onClick={onTopUp}
        >
          Nạp tiền
        </Button>
      </div>
    </Card>
  );
}

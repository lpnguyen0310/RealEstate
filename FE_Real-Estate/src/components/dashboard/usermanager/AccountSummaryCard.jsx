// components/AccountSummaryCard.jsx
import { Card, Avatar, Button, Tooltip, Typography, message, Divider, Tag } from "antd";
import {
  UserOutlined,
  CopyOutlined,
  SafetyCertificateFilled,
  PlusOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import React from "react";

const { Text, Title } = Typography;

/** Compact VND: 50000 -> "50 nghìn đ", 120000000 -> "120 triệu đ", 50000000000 -> "50 tỷ đ" */
const formatVNDCompact = (n = 0) => {
  try {
    const c = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
    return `${c} đ`;
  } catch {
    return `${Number(n || 0).toLocaleString("vi-VN")} đ`;
  }
};

/**
 * Props:
 *  - username, points, postBalance, promoBalance, identityAccount, isNewIdentity, onTopUp
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
    <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3 sm:p-4 text-white">
        <div className="flex items-center gap-3">
          <Avatar size={54} icon={<UserOutlined />} className="shadow-md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Text className="!text-white !font-semibold truncate max-w-[200px] sm:max-w-[260px]">
                {username}
              </Text>
              <Tooltip title="Điểm dùng để đổi ưu đãi">
                <QuestionCircleOutlined className="opacity-90" />
              </Tooltip>
            </div>
            <Text className="!text-white/90 text-[13px]">{points} điểm</Text>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="p-3 sm:p-4">
        <Title level={5} className="!m-0 text-gray-900">Số dư tài khoản</Title>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-3 hover:shadow-sm transition">
            <div className="text-[12px] text-gray-500">TK tin đăng</div>
            <div className="mt-1 text-lg font-semibold leading-tight">
              {formatVNDCompact(postBalance)}
            </div>
            <Tag className="mt-2" color="blue">Sử dụng khi đăng tin</Tag>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3 hover:shadow-sm transition">
            <div className="text-[12px] text-gray-500">TK khuyến mãi</div>
            <div className="mt-1 text-lg font-semibold leading-tight">
              {formatVNDCompact(promoBalance)}
            </div>
            <Tag className="mt-2" color="green">Ưu đãi/hoàn tiền</Tag>
          </div>
        </div>

        {/* Identity account */}
        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
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

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                <SafetyCertificateFilled className="text-green-600 text-[15px]" />
              </span>
              <Text className="font-semibold tracking-wide truncate">{identityAccount}</Text>
            </div>
            <Tooltip title="Sao chép">
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<CopyOutlined />}
                onClick={copyId}
                className="hover:!bg-gray-100"
              />
            </Tooltip>
          </div>
        </div>

        <Divider className="!my-4" />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="w-full h-11 sm:h-10 rounded-lg font-semibold"
          onClick={onTopUp}
        >
          Nạp tiền
        </Button>
      </div>
    </Card>
  );
}

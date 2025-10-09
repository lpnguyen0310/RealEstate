import React from "react";
import { Button, Typography } from "antd";
import { CopyOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function TransferBankInfo({
  bank = {
    name: "Vietcombank",
    subtitle: "Ngân hàng TMCP Ngoại thương Việt Nam",
    color: "#8b1010", // đỏ đậm như ảnh
    logo: null,       // có thể truyền <img .../> hoặc icon
  },
  accountNumber = "BDSVN047064126",
  recipientName = "CTCP PROPERTYGURU VIETNAM - user4706412",
  onCopy = async (val) => {
    try { await navigator.clipboard.writeText(val); } catch {}
  },
  tiers = [
    { label: "Dưới 2 triệu", note: "+0% giá trị" },
    { label: "Từ 2 triệu - dưới 4 triệu", note: "+2% giá trị" },
    { label: "Từ 4 triệu - dưới 12 triệu", note: "+5% giá trị" },
  ],
}) {
  return (
    <div>
      <h3 className="text-[18px] font-semibold mb-3">Thông tin chuyển khoản dành riêng cho bạn</h3>

      {/* Khung ngân hàng */}
      <div className="rounded-2xl border border-red-300 overflow-hidden">
        <div
          className="px-4 py-3 text-white flex items-center gap-3"
          style={{ background: bank.color }}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            {/* Logo/Shield placeholder */}
            {bank.logo ?? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l9 4v6c0 5-3.8 9.7-9 10-5.2-.3-9-5-9-10V6l9-4z" />
              </svg>
            )}
          </span>
          <div>
            <div className="font-semibold">{bank.name}</div>
            <div className="text-[12px] opacity-90">{bank.subtitle}</div>
          </div>
        </div>

        <div className="p-4 space-y-3 bg-white">
          {/* Số tài khoản */}
          <div>
            <div className="text-[13px] text-gray-600">Số tài khoản</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 h-10 bg-gray-100 rounded-md px-3 grid place-items-center text-[15px] font-semibold select-all">
                {accountNumber}
              </div>
              <Button onClick={() => onCopy(accountNumber)}>Sao chép</Button>
            </div>
          </div>

          {/* Tên người nhận */}
          <div>
            <div className="text-[13px] text-gray-600">Tên người nhận</div>
            <div className="mt-1 text-[15px]">{recipientName}</div>
          </div>
        </div>
      </div>

      {/* Ưu đãi nạp tiền */}
      <div className="mt-4">
        <div className="text-[13px] text-gray-600">Ưu đãi nạp tiền</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {tiers.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-3 text-center"
            >
              <div className="font-semibold">{t.label}</div>
              <div className="mt-2 text-[12px] text-red-500 bg-red-50 inline-block px-2 py-1 rounded">
                {t.note}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1">
          <a className="text-red-500 text-[13px]" href="#">Xem tất cả ưu đãi</a>
        </div>
      </div>
    </div>
  );
}

// src/pages/UserDashboard/Tools/VietQRDemo.jsx
import { useMemo } from "react";

/**
 * VietQR đơn giản – dùng 1 QR mặc định.
 * Sau này backend trả dữ liệu -> truyền vào props (bank, account, amount, addInfo, accountName).
 */
export default function VietQRDemo({
  bank = "mb",
  account = "0823720226",
  amount = 5000,
  addInfo = "nhan chuyen khoan",
  accountName = "", // optional: có thì điền, không thì bỏ trống
}) {
  const qrUrl = useMemo(() => {
    const qs = new URLSearchParams({
      amount: String(amount ?? ""),
      addInfo: addInfo ?? "",
      ...(accountName ? { accountName } : {}), // chỉ đính nếu có
    });
    return `https://img.vietqr.io/image/${bank}-${account}-qr_only.png?${qs.toString()}`;
  }, [bank, account, amount, addInfo, accountName]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2 style={{ fontWeight: 700, marginBottom: 12 }}>VietQR chuyển khoản</h2>

      <div
        style={{
          display: "inline-block",
          padding: 12,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #eee",
        }}
      >
        <img src={qrUrl} alt="VietQR" width={280} height={280} />
      </div>

      <div style={{ marginTop: 12, fontSize: 14, color: "#475569" }}>
        STK: <b>{account}</b> · Ngân hàng: <b>MB Bank</b> · Số tiền: <b>{amount.toLocaleString("vi-VN")}đ</b>
        <br />
        Nội dung: <b>{addInfo}</b>
      </div>
    </div>
  );
}

// src/components/dashboard/postmanagement/purchagemangement/PaymentCard.jsx
import React, { useMemo, useState } from "react";
import { Radio, Space } from "antd";

/* =============== Helpers =============== */
const chipClassByCode = (code) => {
    switch (code) {
        case "VIP":
            return "bg-[#ff6532]/10 text-[#ff6532] border border-[#ff6532]/30";
        case "PREMIUM":
            return "bg-[#3059ff]/10 text-[#3059ff] border border-[#3059ff]/30";
        default:
            return "bg-gray-100 text-gray-600 border border-gray-200";
    }
};

const typeLabel = (code) => {
    if (code === "VIP") return "Tin VIP";
    if (code === "PREMIUM") return "Tin Premium";
    return code || "Loại tin";
};

// summary an toàn: vẫn chạy dù mảng rỗng / phần tử thiếu field
const comboSummary = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return "";
    const order = { PREMIUM: 0, VIP: 1 };
    return items
        .filter(Boolean)
        .sort((a, b) => (order[a?.typeCode ?? "ZZZ"] ?? 9) - (order[b?.typeCode ?? "ZZZ"] ?? 9))
        .map((it) => {
            const qty = Number(it?.qty ?? 0);
            if (!qty) return null;
            const label = String(typeLabel(it?.typeCode ?? "")).toLowerCase(); // chống undefined
            return `${qty} ${label}`;
        })
        .filter(Boolean)
        .join(", ");
};

const Chevron = ({ open }) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        aria-hidden
    >
        <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/* =============== Component =============== */
export default function PaymentCard({
    qty = {},
    allItems = [],
    total = 0,
    fmt = (n) => n?.toString(),

    onPay,
    disabled = false,

    mainBalance = 0,
    bonusBalance = 0,
    paymentMethod = "online",
    setPaymentMethod,
}) {
    const hasItems = useMemo(
        () => Array.isArray(allItems) && allItems.some((it) => (qty[it?.id] || 0) > 0),
        [allItems, qty]
    );

    const totalBalance = (Number(mainBalance) || 0) + (Number(bonusBalance) || 0);
    const canPayWithBalance = totalBalance >= total && total > 0;

    const [openMap, setOpenMap] = useState({});
    const toggleOpen = (id) => setOpenMap((m) => ({ ...m, [id]: !m[id] }));

    return (
        <div className="bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] px-6 pt-5 pb-6 sticky top-4">
            <h3 className="text-[20px] font-semibold text-[#1a3b7c]">Thông tin Thanh toán</h3>

            <div className="my-4 border-t border-dashed border-[#D7DFEC]" />

            {/* Danh sách dòng đã chọn */}
            <div className="space-y-3">
                {!hasItems ? (
                    <div className="text-center text-[14px] text-[#7A8AA1]">Bạn chưa chọn gói tin nào.</div>
                ) : (
                    allItems
                        .filter((it) => (qty[it?.id] || 0) > 0)
                        .map((it) => {
                            const id = it?.id;
                            const q = qty[id] || 0;
                            const price = Number(it?.price) || 0;
                            const lineTotal = q * price;

                            // _raw.items có thể undefined / không phải array
                            const comboItems = Array.isArray(it?._raw?.items) ? it._raw.items : [];
                            const isCombo = comboItems.length > 0;
                            const open = !!openMap[id];

                            return (
                                <div key={id} className="text-[14px]">
                                    {/* Row chính */}
                                    <div className="flex items-center">
                                        <div className="flex-1 text-[#2B3A55] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                {isCombo && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleOpen(id)}
                                                        className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-[#e0e6f2] text-[#5c6c86] hover:bg-[#f4f7ff] transition-colors"
                                                        title={open ? "Thu gọn" : "Xem thành phần"}
                                                    >
                                                        <Chevron open={open} />
                                                    </button>
                                                )}
                                                <span>{it?.title ?? "Gói đăng"}</span>
                                            </div>
                                        </div>

                                        <div className="w-10 text-right text-[#2B3A55]">{q}</div>
                                        <div className="w-28 text-right text-[#2B3A55]">{fmt(lineTotal)}</div>
                                    </div>

                                    {/* Hàng tóm tắt (khi đóng) */}
                                    {isCombo && !open && (
                                        <div className="pl-8 mt-0.5 text-[12px] text-[#7A8AA1]">
                                            {comboSummary(comboItems)}
                                        </div>
                                    )}

                                    {/* Hàng chi tiết (khi mở) */}
                                    {isCombo && open && (
                                        <div className="mt-2 pl-8">
                                            <div className="flex flex-wrap gap-1.5">
                                                {comboItems.filter(Boolean).map((c, idx) => {
                                                    const code = c?.typeCode ?? "";
                                                    const qtyC = Number(c?.qty) || 0;
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className={
                                                                "px-2 py-[2px] rounded-full text-[11px] font-semibold " +
                                                                chipClassByCode(code)
                                                            }
                                                        >
                                                            {typeLabel(code)} × {qtyC}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            {it?.sub && <div className="text-[12px] text-[#7A8AA1] mt-1">{it.sub}</div>}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                )}
            </div>

            <div className="mt-4 border-t border-dashed border-[#D7DFEC]" />

            {/* Tổng tiền */}
            <div className="flex items-center justify-between py-4">
                <span className="text-[22px] font-semibold text-[#1a3b7c]">Tổng tiền</span>
                <span className="text-[22px] font-semibold text-[#1a3b7c]">{fmt(total)}</span>
            </div>

            {/* Số tiền cần thanh toán */}
            <div className="flex items-center justify-between py-3 border-t border-dashed border-[#D7DFEC]">
                <span className="text-[15px] font-semibold text-[#2B3A55]">Số tiền cần thanh toán</span>
                <span className="text-[#e32222] font-semibold">{fmt(total)} VNĐ</span>
            </div>

            {/* Số dư */}
            <div className="border-t border-dashed border-gray-200 my-4 pt-4 space-y-1 text-sm text-gray-500">
                <div className="flex justify-between">
                    <span>Số dư TK Chính:</span>
                    <span className="font-medium text-green-600">{fmt(mainBalance)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Số dư TK Khuyến mãi:</span>
                    <span className="font-medium text-blue-600">{fmt(bonusBalance)}</span>
                </div>
                {total > 0 && (
                    <div
                        className={`flex justify-between font-semibold ${canPayWithBalance ? "text-green-700" : "text-red-600"
                            }`}
                    >
                        <span>Tổng số dư:</span>
                        <span>{fmt(totalBalance)}</span>
                    </div>
                )}
            </div>

            {/* Ưu đãi (placeholder) */}
            <button
                type="button"
                className="w-full h-[44px] mt-2 bg-[#eef4ff] hover:bg-[#e6efff] rounded-xl px-4 flex items-center justify-between text-[#2e62ff] transition-colors"
            >
                <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-white text-[13px] border border-[#d6e1ff]">
                        🎟️
                    </span>
                    Ưu đãi
                </span>
                <span className="text-[#6a7aa0]">›</span>
            </button>

            {/* Phương thức thanh toán */}
            <div className="border-t border-dashed border-gray-200 my-4 pt-4">
                <h4 className="font-medium text-[#1a3b7c] mb-3 text-base">Chọn phương thức thanh toán:</h4>
                <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)} value={paymentMethod} className="w-full">
                    <Space direction="vertical" className="w-full">
                        <Radio value="balance" disabled={!canPayWithBalance}>
                            Thanh toán bằng số dư
                            {!canPayWithBalance && total > 0 && <span className="text-xs text-red-500 ml-2">(Không đủ)</span>}
                        </Radio>
                        <Radio value="online">Thanh toán trực tuyến (Thẻ quốc tế)</Radio>
                    </Space>
                </Radio.Group>
            </div>

            {/* Toggle xuất hoá đơn (placeholder) */}
            <div className="bg-[#f7f9fe] rounded-2xl p-3 mt-3 shadow-[0_10px_20px_rgba(13,47,97,0.06)]">
                <div className="flex items-center gap-3">
                    <div className="relative w-11 h-[26px] rounded-full bg-[#E6ECF7] select-none">
                        <span className="absolute top-[3px] left-[3px] h-[20px] w-[20px] rounded-full bg-white shadow" />
                    </div>
                    <span className="text-[15px] text-[#637089]">Xuất hoá đơn cho giao dịch</span>
                </div>
            </div>

            {/* Điều khoản */}
            <p className="text-[13px] text-[#6B7A90] mt-5 leading-relaxed">
                Bằng việc bấm vào Thanh toán, bạn đã đồng ý với các{" "}
                <a className="text-[#2e62ff] hover:underline" href="#">
                    điều khoản sử dụng
                </a>{" "}
                và{" "}
                <a className="text-[#2e62ff] hover:underline" href="#">
                    chính sách bảo mật
                </a>{" "}
                của chúng tôi.
            </p>

            {/* Nút Thanh Toán */}
            <button
                disabled={total === 0 || disabled}
                onClick={onPay}
                className={`mt-4 w-full h-[48px] rounded-xl text-white font-semibold transition-colors duration-200 ${total <= 0 || disabled ? "bg-[#93a3bd] cursor-not-allowed" : "bg-[#0f2f63] hover:bg-[#0c2550]"
                    }`}
            >
                {disabled ? "Đang xử lý..." : paymentMethod === "balance" ? "Xác nhận trừ số dư" : "Tiếp tục Thanh toán"}
            </button>
        </div>
    );
}

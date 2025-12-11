import React, { useMemo, useState } from "react";
import { Radio, Space } from "antd";

/* helpers */
const chipClassByCode = (code) => {
    switch (String(code || "").toUpperCase()) {
        case "VIP":
            return "bg-[#ff6532]/10 text-[#ff6532] border border-[#ff6532]/30";
        case "PREMIUM":
            return "bg-[#3059ff]/10 text-[#3059ff] border border-[#3059ff]/30";
        default:
            return "bg-gray-100 text-gray-600 border border-gray-200";
    }
};
const typeLabel = (code) => {
    const c = String(code || "").toUpperCase();
    if (c === "VIP") return "Tin VIP";
    if (c === "PREMIUM") return "Tin Premium";
    return code || "Loại tin";
};
const moneyShort = (n) => {
    const v = Number(n) || 0;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1)} tỷ`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)} triệu`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)} nghìn`;
    return `${v}`;
};
const extractTypeAndQty = (c) => {
    if (!c) return null;
    const child = c.childPackage || {};
    const rawType = c.typeCode || child.listingType || child.code || "";
    const typeCode = String(rawType || "").toUpperCase();
    const baseQty = Number(c.qty ?? c.quantity ?? 0) || 0;
    const name = child.name || typeLabel(typeCode);
    return { typeCode, label: name, baseQty };
};

// Tóm tắt combo theo loại tin, có nhân số lượng (multiplier = số lượng combo người dùng chọn)
const comboSummary = (items = [], multiplier = 1) => {
    if (!Array.isArray(items) || items.length === 0) return "";
    const m = Number(multiplier) || 1;
    const order = { PREMIUM: 0, VIP: 1 };
    const totalByType = {};
    for (const it of items) {
        const info = extractTypeAndQty(it);
        if (!info || !info.typeCode || info.baseQty <= 0) continue;
        totalByType[info.typeCode] = (totalByType[info.typeCode] || 0) + info.baseQty * m;
    }
    return Object.entries(totalByType)
        .sort(([a], [b]) => (order[a] ?? 9) - (order[b] ?? 9))
        .map(([type, total]) => `${total} tin ${typeLabel(type).replace(/^Tin\s+/i, "")}`)
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

export default function PaymentCard({
    className = "",
    qty = {},
    allItems = [],
    total = 0,
    fmt = moneyShort,
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
        <div
            className={[
                "bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] px-6 pt-5 pb-6 md:sticky md:top-4",
                className,
            ].join(" ")}
        >
            <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#1a3b7c]">Thông tin Thanh toán</h3>

            <div className="my-4 border-t border-dashed border-[#D7DFEC]" />

            {/* selected lines */}
            <div className="space-y-3">
                {!hasItems ? (
                    <div className="text-center text-[13px] sm:text-[14px] text-[#7A8AA1]">
                        Bạn chưa chọn gói tin nào.
                    </div>
                ) : (
                    allItems
                        .filter((it) => (qty[it?.id] || 0) > 0)
                        .map((it) => {
                            const id = it?.id;
                            const q = qty[id] || 0;
                            const price = Number(it?.price) || 0;
                            const lineTotal = q * price;

                            const comboItems = Array.isArray(it?._raw?.items) ? it._raw.items : [];
                            const isCombo = comboItems.length > 0;
                            const open = !!openMap[id];

                            const detailAgg = {};
                            if (isCombo) {
                                for (const c of comboItems) {
                                    const info = extractTypeAndQty(c);
                                    if (!info || !info.typeCode || info.baseQty <= 0) continue;
                                    detailAgg[info.typeCode] = (detailAgg[info.typeCode] || 0) + info.baseQty * q;
                                }
                            }

                            return (
                                <div key={id} className="text-[13px] sm:text-[14px]">
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
                                        <div className="w-24 sm:w-28 text-right text-[#2B3A55]">{fmt(lineTotal)}</div>
                                    </div>

                                    {isCombo && !open && (
                                        <div className="pl-8 mt-0.5 text-[12px] text-[#7A8AA1]">
                                            {comboSummary(comboItems, q)}
                                        </div>
                                    )}

                                    {isCombo && open && (
                                        <div className="mt-2 pl-8">
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(detailAgg).map(([typeCode, totalQty]) => (
                                                    <span
                                                        key={typeCode}
                                                        className={
                                                            "px-3 py-[3px] rounded-full text-[12px] font-semibold " +
                                                            chipClassByCode(typeCode)
                                                        }
                                                    >
                                                        {typeLabel(typeCode)} × {totalQty}
                                                    </span>
                                                ))}
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

            {/* total */}
            <div className="flex items-center justify-between py-4">
                <span className="text-[18px] sm:text-[22px] font-semibold text-[#1a3b7c]">Tổng tiền</span>
                <span className="text-[18px] sm:text-[22px] font-semibold text-[#1a3b7c]">
                    {fmt(total)}
                </span>
            </div>

            {/* need to pay */}
            <div className="flex items-center justify-between py-3 border-t border-dashed border-[#D7DFEC]">
                <span className="text-[14px] sm:text-[15px] font-semibold text-[#2B3A55]">
                    Số tiền cần thanh toán
                </span>
                <span className="text-[#e32222] font-semibold">{fmt(total)} VNĐ</span>
            </div>

            {/* balances */}
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

            {/* coupon button */}
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

            {/* payment methods */}
            <div className="border-t border-dashed border-gray-200 my-4 pt-4">
                <h4 className="font-medium text-[#1a3b7c] mb-3 text-sm sm:text-base">
                    Chọn phương thức thanh toán:
                </h4>
                <Radio.Group
                    onChange={(e) => setPaymentMethod?.(e.target.value)}
                    value={paymentMethod}
                    className="w-full"
                >
                    <Space direction="vertical" className="w-full">
                        <Radio value="balance" disabled={!canPayWithBalance}>
                            Thanh toán bằng số dư
                            {!canPayWithBalance && total > 0 && (
                                <span className="text-xs text-red-500 ml-2">(Không đủ)</span>
                            )}
                        </Radio>
                        <Radio value="online">Thanh toán trực tuyến (Thẻ quốc tế)</Radio>
                    </Space>
                </Radio.Group>
            </div>

            {/* invoice toggle (placeholder) */}
            <div className="bg-[#f7f9fe] rounded-2xl p-3 mt-3 shadow-[0_10px_20px_rgba(13,47,97,0.06)]">
                <div className="flex items-center gap-3">
                    <div className="relative w-11 h-[26px] rounded-full bg-[#E6ECF7] select-none">
                        <span className="absolute top-[3px] left-[3px] h-[20px] w-[20px] rounded-full bg-white shadow" />
                    </div>
                    <span className="text-[14px] sm:text-[15px] text-[#637089]">
                        Xuất hoá đơn cho giao dịch
                    </span>
                </div>
            </div>

            {/* terms */}
            <p className="text-[12px] sm:text-[13px] text-[#6B7A90] mt-4 sm:mt-5 leading-relaxed">
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

            {/* pay button */}
            <button
                disabled={total === 0 || disabled}
                onClick={onPay}
                className={`mt-3 sm:mt-4 w-full h-[46px] sm:h-[48px] rounded-xl !text-white font-semibold transition-colors duration-200 ${total <= 0 || disabled ? "bg-[#93a3bd] cursor-not-allowed" : "bg-[#0f2f63] hover:bg-[#0c2550]"
                    }`}
            >
                {disabled
                    ? "Đang xử lý..."
                    : paymentMethod === "balance"
                        ? "Xác nhận trừ số dư"
                        : "Tiếp tục Thanh toán"}
            </button>
        </div>
    );
}

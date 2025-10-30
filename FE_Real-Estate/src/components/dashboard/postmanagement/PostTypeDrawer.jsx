import React, { useMemo, useState, useCallback } from "react";
import { Card, Radio, Button, Alert, Skeleton, Tooltip, message } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

// ------- Helpers -------
const LABEL_MAP = { NORMAL: "Thường", VIP: "VIP", PREMIUM: "Premium" };
const minutesToText = (m) => (m >= 60 ? `${Math.round(m / 60)} giờ` : `${m} phút`);

// Icon tròn: tick / x (kích thước cố định)
function Bullet({ ok, size = 18 }) {
    const common = {
        viewBox: "0 0 20 20",
        className: "shrink-0",
        style: { width: size, height: size, minWidth: size, display: "block" },
        "aria-hidden": true,
        focusable: "false",
    };
    return ok ? (
        <svg {...common}>
            <circle cx="10" cy="10" r="10" fill="#2E5BFF" />
            <path d="M6 10.2l2.6 2.6 5.4-5.6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
    ) : (
        <svg {...common}>
            <circle cx="10" cy="10" r="10" fill="#EF4444" />
            <path d="M6.5 6.5l7 7m0-7l-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/**
 * @param {Object} props
 * @param {number|null} props.value - id policy đang chọn
 * @param {(id:number)=>void} props.onChange
 * @param {Array} props.items - danh sách policy từ BE
 * @param {boolean} [props.loading]
 * @param {string|null} [props.error]
 * @param {Record<'VIP'|'PREMIUM'|'NORMAL', number|undefined>} [props.inventory]
 * @param {"NORMAL"|"VIP"|"PREMIUM"|null} [props.currentTypeText] - gói hiện tại của tin (khi edit)
 */
export default function PostTypeSection({
    value,
    onChange,
    items = [],
    loading = false,
    error = null,
    inventory = {},
    currentTypeText = null,
}) {
    const selectedId = value;
    const [showDetails, setShowDetails] = useState(true);

    // ✅ Sắp xếp thứ tự: NORMAL -> VIP -> PREMIUM
    const options = useMemo(() => {
        const order = { NORMAL: 0, VIP: 1, PREMIUM: 2 };
        const sorted = [...(items || [])].sort(
            (a, b) => (order[a.listingType] ?? 99) - (order[b.listingType] ?? 99)
        );

        return sorted.map((it) => {
            const t = it.listingType; // NORMAL | VIP | PREMIUM
            const photoLine =
                t === "NORMAL"
                    ? "1 ảnh vừa (Máy tính) / 1 ảnh nhỏ (Điện thoại)"
                    : t === "PREMIUM"
                        ? "2 ảnh lớn, 1 ảnh vừa, 2 ảnh nhỏ (Máy tính) / 1 ảnh lớn, 3 ảnh nhỏ (Điện thoại)"
                        : "1 ảnh vừa, 3 ảnh nhỏ (Máy tính) / 1 ảnh lớn (Điện thoại)";
            const rankLine =
                t === "NORMAL" ? "Hiển thị mặc định" : t === "VIP" ? "Hiển thị trên tin thường" : "Tin đầu trang";
            const contactOnSearch = t !== "NORMAL";

            return {
                id: it.id,
                type: t,
                label: LABEL_MAP[t] || t,
                qty: inventory?.[t], // số lượng còn
                features: [
                    { text: rankLine, ok: true },
                    { text: `${it.durationDays} ngày hiển thị`, ok: true },
                    { text: photoLine, ok: true },
                    { text: `Xác thực trong ${minutesToText(it.verifySlaMinutes)}`, ok: true },
                    { text: "Hiển thị thông tin liên hệ ở trang chi tiết", ok: true },
                    { text: "Hiển thị thông tin liên hệ ở trang tìm kiếm", ok: contactOnSearch },
                ],
            };
        });
    }, [items, inventory]);

    const handleSelect = useCallback(
        (id) => {
            if (id !== selectedId) onChange?.(id);
        },
        [onChange, selectedId]
    );

    return (
        <div className="rounded-2xl border border-[#e7edf9] bg-[#f6f9ff]/50 p-4 md:p-5">
            <div className="mb-4">
                <div className="text-[20px] font-semibold text-[#0f223a]">Loại tin đăng</div>
                <div className="mt-2 h-[2px] w-full bg-[#0f223a]" />
            </div>

            {error && <Alert type="error" message="Không tải được gói tin" description={error} className="mb-3" />}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Skeleton active className="rounded-2xl" />
                    <Skeleton active className="rounded-2xl" />
                    <Skeleton active className="rounded-2xl" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {options.map((opt) => {
                        const isActive = String(selectedId) === String(opt.id);
                        const isVipLike = opt.type === "VIP" || opt.type === "PREMIUM";
                        const isDepleted = isVipLike && opt.qty === 0; // hết lượt
                        const isCurrent = currentTypeText === opt.type; // gói hiện tại khi edit
                        const isBlocked = isDepleted && !isCurrent; // hết lượt & không phải gói hiện tại → cấm chọn

                        const defaultBadge = isVipLike
                            ? (typeof opt.qty === "number" ? `Còn ${opt.qty}` : "—")
                            : "Free";

                        const cardStyle = isActive
                            ? {
                                background: "linear-gradient(180deg,#eff5ff 0%, #e6eeff 100%)",
                                boxShadow:
                                    "0 8px 20px rgba(46,91,255,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
                                borderColor: "#2E5BFF",
                            }
                            : { background: "#fff", boxShadow: "0 4px 12px rgba(15,23,42,0.06)" };

                        const cardClass =
                            "rounded-2xl overflow-hidden select-none transition-all border " +
                            (isActive
                                ? "ring-1 ring-[#2E5BFF]/30"
                                : "border-[#e9eef7] hover:border-[#cfdcff] hover:-translate-y-[1px]") +
                            (isBlocked ? " cursor-not-allowed opacity-60" : " cursor-pointer") +
                            (isDepleted ? " border-dashed" : "");

                        return (
                            <Tooltip
                                key={opt.id}
                                title={
                                    isBlocked
                                        ? "Đã hết lượt gói này. Vui lòng mua thêm để chuyển sang gói này."
                                        : ""
                                }
                            >
                                <Card
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        if (isBlocked) {
                                            message.warning(
                                                "Bạn đã hết lượt của gói này. Vào mục Mua gói để nạp thêm nhé!"
                                            );
                                            return;
                                        }
                                        handleSelect(opt.id);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            if (isBlocked) {
                                                message.warning(
                                                    "Bạn đã hết lượt của gói này. Vào mục Mua gói để nạp thêm nhé!"
                                                );
                                            } else {
                                                handleSelect(opt.id);
                                            }
                                        }
                                    }}
                                    className={cardClass}
                                    style={cardStyle}
                                    bodyStyle={{ padding: 18, background: "transparent" }}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <Radio checked={isActive} className="mt-0.5">
                                            <span
                                                className={[
                                                    "font-semibold text-[16px]",
                                                    isActive ? "text-[#2E5BFF]" : "text-[#20314d]",
                                                ].join(" ")}
                                            >
                                                {opt.label}
                                            </span>
                                        </Radio>

                                        <span className="inline-flex items-center justify-center px-2.5 h-6 rounded-full text-[12px] leading-none font-semibold bg-[#2E5BFF] text-white shadow-sm">
                                            {isActive ? "Đang chọn" : isCurrent ? "Hiện tại" : defaultBadge}
                                        </span>
                                    </div>

                                    {showDetails ? (
                                        <ul className="mt-2 space-y-2 list-none pl-0" style={{ listStyle: "none" }}>
                                            {opt.features.map((f, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <Bullet ok={f.ok} />
                                                    <span
                                                        className={[
                                                            "text-[14px] leading-6",
                                                            f.ok
                                                                ? isActive
                                                                    ? "text-[#23407a]"
                                                                    : "text-[#334e7a]"
                                                                : "text-[#ef4444]",
                                                        ].join(" ")}
                                                    >
                                                        {f.text}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div
                                            className={[
                                                "mt-2 text-[13px]",
                                                isActive ? "text-[#2a4e9a]" : "text-[#5d6b85]",
                                            ].join(" ")}
                                        />
                                    )}
                                </Card>
                            </Tooltip>
                        );
                    })}
                </div>
            )}

            <div className="mt-5 flex justify-center">
                <Button
                    onClick={() => setShowDetails((s) => !s)}
                    className="rounded-xl border-[#d6deef] hover:border-[#9bb0f5]"
                    icon={showDetails ? <UpOutlined /> : <DownOutlined />}
                >
                    {showDetails ? "Thu Gọn" : "Chi Tiết Gói"}
                </Button>
            </div>
        </div>
    );
}

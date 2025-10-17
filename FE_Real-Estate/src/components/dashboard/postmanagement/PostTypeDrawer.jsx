// PostTypeSection.jsx
import React, { useMemo, useState, useCallback } from "react";
import { Card, Radio, Button } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

// Icon tròn: tick / x
function Bullet({ ok }) {
    return ok ? (
        <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0">
            <circle cx="10" cy="10" r="10" fill="#2E5BFF" />
            <path d="M6 10.2l2.6 2.6 5.4-5.6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
    ) : (
        <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0">
            <circle cx="10" cy="10" r="10" fill="#EF4444" />
            <path d="M6.5 6.5l7 7m0-7l-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function PostTypeSection({ value = "free", onChange }) {
    const selected = value;
    const [showDetails, setShowDetails] = useState(true); // mở sẵn như hình 2

    const options = useMemo(
        () => [
            {
                key: "free",
                label: "Tin Thường",
                badge: "Free",
                sub: "Đăng tin cơ bản",
                features: [
                    { text: "Hiển thị mặc định", ok: true },
                    { text: "10 ngày hiển thị", ok: true },
                    { text: "1 ảnh vừa (Máy tính)", ok: true },
                    { text: "1 ảnh nhỏ (Điện thoại)", ok: true },
                    { text: "Xác thực trong 4 giờ", ok: true },
                    { text: "Hiển thị thông tin liên hệ ở trang chi tiết", ok: true },
                    { text: "Hiển thị thông tin liên hệ ở trang tìm kiếm", ok: false },
                ],
            },
            {
                key: "vip",
                label: "Tin VIP",
                badge: "x0",
                sub: "Ưu tiên hiển thị, thu hút khách hàng",
                features: [
                    { text: "Hiển thị trên tin thường", ok: true },
                    { text: "15 ngày hiển thị", ok: true },
                    { text: "1 ảnh vừa, 3 ảnh nhỏ (Máy tính)", ok: true },
                    { text: "1 ảnh lớn (Điện thoại)", ok: true },
                    { text: "Xác thực trong 2 giờ", ok: true },
                    { text: "Hiển thị thông tin liên hệ ở trang chi tiết", ok: true },
                    { text: "Hiển thị thông tin liên hệ ở trang tìm kiếm", ok: true },
                ],
            },
            {
                key: "premium",
                label: "Tin Premium",
                badge: "x0",
                sub: "Top đầu hiển thị, bứt phá doanh thu",
                features: [
                    { text: "Tin đầu trang", ok: true },
                    { text: "20 ngày hiển thị", ok: true },
                    { text: "2 ảnh lớn, 1 ảnh vừa, 2 ảnh nhỏ (Máy tính)", ok: true },
                    { text: "1 ảnh lớn, 3 ảnh nhỏ (Điện thoại)", ok: true },
                    { text: "Xác thực trong 30 phút", ok: true },
                    { text: "Hiển thị thông tin liên hệ ở trang chi tiết", ok: true },
                    { text: "Hiển thị thông tin liên hệ ở trang tìm kiếm", ok: true },
                ],
            },
        ],
        []
    );

    const handleSelect = useCallback(
        (key) => {
            if (key !== selected) onChange?.(key);
        },
        [onChange, selected]
    );

    return (
        <div className="rounded-2xl border border-[#e7edf9] bg-[#f6f9ff]/50 p-4 md:p-5">
            {/* Title */}
            <div className="mb-4">
                <div className="text-[20px] font-semibold text-[#0f223a]">Loại tin đăng</div>
                <div className="mt-2 h-[2px] w-full bg-[#0f223a]" />
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {options.map((opt) => {
                    const isActive = selected === opt.key;

                    // gradient & shadow đặt ở container để tránh "viền trắng" dưới đáy
                    const cardStyle = isActive
                        ? {
                            background: "linear-gradient(180deg,#eff5ff 0%, #e6eeff 100%)",
                            boxShadow:
                                "0 8px 20px rgba(46,91,255,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
                            borderColor: "#2E5BFF",
                        }
                        : {
                            background: "#fff",
                            boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
                        };

                    return (
                        <Card
                            key={opt.key}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelect(opt.key)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleSelect(opt.key);
                                }
                            }}
                            className={[
                                "rounded-2xl overflow-hidden cursor-pointer select-none transition-all",
                                "border",
                                isActive
                                    ? "ring-1 ring-[#2E5BFF]/30"
                                    : "border-[#e9eef7] hover:border-[#cfdcff] hover:-translate-y-[1px]",
                            ].join(" ")}
                            style={cardStyle}                 // nền/gradient ở container
                            bodyStyle={{ padding: 18, background: "transparent" }} // body trong suốt
                        >
                            {/* Header */}
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

                                <span
                                    className={[
                                        "inline-flex items-center justify-center",
                                        "px-2.5 h-6 rounded-full text-[12px] leading-none font-semibold",
                                        "bg-[#2E5BFF] text-white shadow-sm",
                                    ].join(" ")}
                                >
                                    {opt.badge}
                                </span>
                            </div>

                            {/* Sub / Features */}
                            {showDetails ? (
                                <ul className="mt-2 space-y-2">
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
                                >
                                    {opt.sub}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Toggle details */}
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

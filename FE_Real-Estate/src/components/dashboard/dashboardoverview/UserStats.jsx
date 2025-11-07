// src/components/dashboard/UserStats.jsx
import {
    HomeOutlined,
    MessageOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";

export default function UserStats({
    data = { saved: 0, messages: 0, posts: 0, tours: 0 },
    loading = false,
    onClickCard,
}) {
    const items = [
        {
            key: "saved",
            icon: <HomeOutlined />,
            label: "Tin đã lưu",
            value: data.saved,
            gradient: "from-[#e4548c] to-[#b36ad6]",
        },
        {
            key: "messages",
            icon: <MessageOutlined />,
            label: "Tin nhắn mới",
            value: data.messages,
            gradient: "from-[#ff8c42] to-[#ff4b2b]",
        },
        {
            key: "posts",
            icon: <FileTextOutlined />,
            label: "Tin đăng",
            value: data.posts,
            gradient: "from-[#7b5de3] to-[#b36ad6]",
        },
        {
            key: "tours",
            icon: <ClockCircleOutlined />,
            label: "Lịch hẹn xem nhà",
            value: data.tours,
            gradient: "from-[#3bb78f] to-[#0bab64]",
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl p-5 bg-gray-100 animate-pulse h-[108px]" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {items.map((s) => (
                <button
                    key={s.key}
                    type="button"
                    onClick={() => onClickCard?.(s.key)}
                    className={[
                        "rounded-2xl p-4 sm:p-5 text-white bg-gradient-to-r",
                        s.gradient,
                        "shadow-[0_8px_24px_rgba(13,47,97,0.08)]",
                        "transition duration-200 hover:-translate-y-1",
                        "hover:shadow-[0_12px_32px_rgba(13,47,97,0.12)]",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20",
                        "text-left",
                    ].join(" ")}
                >
                    <div className="flex items-center justify-between">
                        <div className="text-[26px] sm:text-[30px] opacity-90">{s.icon}</div>
                        <div className="text-right">
                            <div className="text-[20px] sm:text-[24px] font-extrabold leading-none">
                                {Number.isFinite(+s.value)
                                    ? Number(s.value).toLocaleString("vi-VN")
                                    : s.value ?? 0}
                            </div>
                            <div className="text-[12px] sm:text-[14px] opacity-90">{s.label}</div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

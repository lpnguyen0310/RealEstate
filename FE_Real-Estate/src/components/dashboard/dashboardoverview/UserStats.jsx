import {
    HomeOutlined,
    MessageOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";

export default function UserStats({
    data = { saved: 0, messages: 0, posts: 0, tours: 0 },
}) {
    const items = [
        {
            icon: <HomeOutlined />,
            label: "Tin đã lưu",
            value: data.saved,
            gradient: "from-[#e4548c] to-[#b36ad6]", // Hồng → tím
        },
        {
            icon: <MessageOutlined />,
            label: "Tin nhắn mới",
            value: data.messages,
            gradient: "from-[#ff8c42] to-[#ff4b2b]", // Cam → đỏ
        },
        {
            icon: <FileTextOutlined />,
            label: "Tin đăng",
            value: data.posts,
            gradient: "from-[#7b5de3] to-[#b36ad6]", // Tím → hồng
        },
        {
            icon: <ClockCircleOutlined />,
            label: "Lịch hẹn xem nhà",
            value: data.tours,
            gradient: "from-[#3bb78f] to-[#0bab64]", // Xanh lá → teal
        },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {items.map((s, i) => (
                <div
                    key={i}
                    className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.gradient}
                      shadow-[0_8px_24px_rgba(13,47,97,0.08)]
                      transition duration-200 hover:-translate-y-1
                      hover:shadow-[0_12px_32px_rgba(13,47,97,0.12)]`}
                >
                    <div className="flex items-center justify-between">
                        {/* Icon */}
                        <div className="text-[30px] opacity-90">{s.icon}</div>

                        {/* Giá trị + Nhãn */}
                        <div className="text-right">
                            <div className="text-[24px] font-extrabold leading-none">
                                {Number.isFinite(+s.value)
                                    ? Number(s.value).toLocaleString("vi-VN")
                                    : s.value}
                            </div>
                            <div className="text-[14px] opacity-90">{s.label}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

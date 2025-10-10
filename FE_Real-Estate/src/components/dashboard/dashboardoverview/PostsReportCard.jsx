import { CheckCircleTwoTone, ClockCircleTwoTone, CloseCircleTwoTone, RedoOutlined } from "@ant-design/icons";

export default function PostsReportCard({ data }) {
    const d = {
        active: 0,
        pending: 0,
        expiring: 0,
        auto: { total: 0, premium: 0, vip: 0, normal: 0 },
        ...data,
    };

    const Item = ({ icon, title, value, sub }) => (
        <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#eef2f8] shadow-[0_4px_12px_rgba(13,47,97,0.05)]">
            <div className="h-9 w-9 grid place-items-center rounded-lg bg-[#f6f9ff] text-[18px]">{icon}</div>
            <div className="flex-1">
                <div className="text-[14px] text-[#3c4a5d]">{title}</div>
                <div className="text-[13px] text-gray-400">{sub}</div>
            </div>
            <div className="text-[18px] font-bold text-[#1c396a]">{d[value]}</div>
        </div>
    );

    return (
        <div className="rounded-2xl bg-[#f5f7fb] p-4 border border-[#e8edf6]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-bold text-[#1c396a] leading-none !mb-[0]">
                    Báo cáo tin đăng
                </h3>
                <span className="text-[13px] text-[#3b7cff] leading-none">
                    Tổng số {d.active + d.pending + d.expiring + d.auto.total} tin đăng
                </span>
            </div>

            <div className="space-y-3">
                <Item icon={<CheckCircleTwoTone twoToneColor="#52C41A" />} title="Đang đăng" value="active" sub={d.active || 0} />
                <Item icon={<ClockCircleTwoTone twoToneColor="#faad14" />} title="Chờ duyệt" value="pending" sub={d.pending || 0} />
                <Item icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />} title="Sắp hết hạn" value="expiring" sub={d.expiring || 0} />

                <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#eef2f8] shadow-[0_4px_12px_rgba(13,47,97,0.05)]">
                    <div className="h-9 w-9 grid place-items-center rounded-lg bg-[#fff7f1] text-[18px]"><RedoOutlined /></div>
                    <div className="flex-1">
                        <div className="text-[14px] text-[#3c4a5d]">Tin đăng lại tự động</div>
                        <div className="text-[12px] text-gray-500">
                            {d.auto.total} PREMIUM · {d.auto.vip} VIP · {d.auto.normal} THƯỜNG
                        </div>
                    </div>
                    <div className="text-[18px] font-bold text-[#1c396a]">{d.auto.total}</div>
                </div>
            </div>
        </div>
    );
}

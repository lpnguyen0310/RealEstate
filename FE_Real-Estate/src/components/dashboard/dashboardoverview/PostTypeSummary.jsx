// src/components/dashboard/dashboardoverview/PostTypeSummary.jsx
export default function PostTypeSummary({ sell = {}, rent = {} }) {
    return (
        <div className="space-y-4">
            <SummaryCard title="Tin đăng bán" data={sell} />
            <SummaryCard title="Tin đăng cho thuê" data={rent} />
        </div>
    );
}

function SummaryCard({ title, data }) {
    const d = {
        views: 0,
        interactions: 0,
        potential: 0,
        ...data,
    };

    return (
        <div className="rounded-2xl bg-white p-4 border border-[#e8edf6] shadow-[0_8px_24px_rgba(13,47,97,0.06)]">
            <h3 className="text-[16px] font-bold text-[#1c396a] mb-3">{title}</h3>

            <div className="border-t-2 border-[#3b7cff]/60 mb-3" />

            <div className="space-y-3">
                <Row label="Lượt xem" value={d.views} />
                <Row label="Lượt tương tác" value={d.interactions} />
                <Row label="Khách tiềm năng" value={d.potential} />
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#3c4a5d]">{label}</span>
            <span className="text-[14px] text-[#3c4a5d] font-semibold">{Number(value).toLocaleString("vi-VN")}</span>
        </div>
    );
}

export default function SavedListCard({ items = [] }) {
    return (
        <div className="rounded-2xl bg-[#f5f7fb] p-4 border border-[#e8edf6]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-bold text-[#1c396a] leading-none !mb-[0]">
                    Tin yêu thích
                </h3>
                <button className="text-[13px] text-[#3b7cff] hover:underline leading-none">
                    Xem tất cả
                </button>
            </div>

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="text-[14px] text-gray-500 bg-white rounded-xl p-4 border border-[#eef2f8] text-center">
                        Chưa có tin nào được lưu
                    </div>
                )}

                {items.map((it) => (
                    <div
                        key={it.id}
                        className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#eef2f8] hover:border-[#d9e4ff]
                       shadow-[0_4px_12px_rgba(13,47,97,0.05)] transition"
                    >
                        <img
                            src={it.image}
                            alt={it.title}
                            className="h-14 w-20 object-cover rounded-lg border border-[#eef2f8]"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-[#1c396a] truncate">{it.title}</div>
                            <div className="text-[12px] text-gray-500 truncate">{it.subtitle}</div>
                        </div>
                        <div className="text-[12px] px-2 py-1 rounded-md bg-[#f0f4ff] text-[#375a8b] whitespace-nowrap">
                            {it.type}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

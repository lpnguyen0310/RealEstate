export default function NotificationsCard({ items = [] }) {
  return (
    <div className="rounded-2xl bg-[#f5f7fb] p-4 border border-[#e8edf6]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px] font-bold text-[#1c396a] leading-none">
          Thông tin
        </h3>
        <span className="text-[12px] px-8 h-7  h-5 min-w-5 px-1 grid place-items-center rounded-full bg-white border border-[#eef2f8] text-[#375a8b] leading-none">
          Xem tất cả {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-[14px] text-gray-500 bg-white rounded-xl p-4 border border-[#eef2f8] text-center">
            Hiện chưa có thông báo
          </div>
        )}

        {items.map((n) => (
          <div key={n.id} className="bg-white rounded-xl p-3 border border-[#eef2f8] shadow-[0_4px_12px_rgba(13,47,97,0.05)]">
            <div className="flex gap-3">
              <img src={n.avatar} alt="" className="h-8 w-8 rounded-full border border-[#eef2f8]" />
              <div className="text-[14px] text-[#26364d]">{n.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

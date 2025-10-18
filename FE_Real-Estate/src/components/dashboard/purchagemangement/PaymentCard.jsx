// src/components/dashboard/postmanagement/purchagemangement/PaymentCard.jsx
export default function PaymentCard({
  qty = {},
  allItems = [],
  total = 0,
  fmt = (n) => n?.toString(),
  onPay,                    // optional
  disabled
}) {
  const hasItems = allItems.some((it) => (qty[it.id] || 0) > 0);

  return (
    <div className="bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] px-6 pt-5 pb-6">
      {/* Title */}
      <h3 className="text-[20px] font-semibold text-[#1a3b7c]">Thông tin Thanh toán</h3>

      {/* dashed */}
      <div className="my-4 border-t border-dashed border-[#D7DFEC]" />

      {/* Danh sách các dòng đã chọn */}
      <div className="space-y-3">
        {!hasItems ? (
          <div className="text-center text-[14px] text-[#7A8AA1]">
            Bạn đã chọn gói/combos như bên trái.
          </div>
        ) : (
          allItems
            .filter((it) => (qty[it.id] || 0) > 0)
            .map((it) => {
              const q = qty[it.id] || 0;
              const line = q * it.price;
              return (
                <div key={it.id} className="flex items-center text-[14px]">
                  <div className="flex-1 text-[#2B3A55]">{it.title}</div>
                  <div className="w-10 text-right text-[#2B3A55]">{q}</div>
                  <div className="w-28 text-right text-[#2B3A55]">{fmt(line)}</div>
                </div>
              );
            })
        )}
      </div>

      {/* dashed */}
      <div className="mt-4 border-t border-dashed border-[#D7DFEC]" />

      {/* Tổng tiền */}
      <div className="flex items-center justify-between py-4">
        <span className="text-[22px] font-semibold text-[#1a3b7c]">Tổng tiền</span>
        <span className="text-[22px] font-semibold text-[#1a3b7c]">{fmt(total)}</span>
      </div>

      {/* dashed */}
      <div className="border-t border-dashed border-[#D7DFEC]" />

      {/* Số tiền cần thanh toán */}
      <div className="flex items-center justify-between py-3">
        <span className="text-[15px] font-semibold text-[#2B3A55]">
          Số tiền cần thanh toán
        </span>
        <span className="text-[#e32222] font-semibold">{fmt(total)} VNĐ</span>
      </div>

      {/* Ưu đãi (UI only) */}
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

      {/* Toggle (UI only) */}
      <div className="bg-[#f7f9fe] rounded-2xl p-3 mt-3 shadow-[0_10px_20px_rgba(13,47,97,0.06)]">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-[26px] rounded-full bg-[#E6ECF7] select-none">
            <span className="absolute top-[3px] left-[3px] h-[20px] w-[20px] rounded-full bg-white shadow" />
          </div>
          <span className="text-[15px] text-[#637089]">Xuất hoá đơn cho giao dịch</span>
        </div>
      </div>

      {/* Terms */}
      <p className="text-[13px] text-[#6B7A90] mt-5 leading-relaxed">
        Bằng việc bấm vào Thanh toán, bạn đã đồng ý với các{" "}
        <a className="text-[#2e62ff] hover:underline" href="#">điều khoản sử dụng</a>{" "}
        và{" "}
        <a className="text-[#2e62ff] hover:underline" href="#">chính sách bảo mật</a> của chúng tôi.
      </p>

      {/* Button */}
      <button
        disabled={total === 0 || disabled}
        onClick={onPay}
        className={`mt-4 w-full h-[48px] rounded-xl text-white font-semibold transition-colors duration-200 ${
          total > 0 ? "bg-[#0f2f63] hover:bg-[#0c2550]" : "bg-[#93a3bd] cursor-not-allowed"
        }`}
      >
        Thanh Toán
      </button>
    </div>
  );
}
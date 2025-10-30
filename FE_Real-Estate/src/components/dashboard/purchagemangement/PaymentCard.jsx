// src/components/dashboard/postmanagement/purchagemangement/PaymentCard.jsx

import React from 'react'; // Đảm bảo import React
import { Radio, Space } from 'antd'; // Import các thành phần UI cần thiết

export default function PaymentCard({
    qty = {},
    allItems = [],
    total = 0,
    fmt = (n) => n?.toString(), // Hàm định dạng tiền tệ (ví dụ: fmtVND)
    onPay,                // Hàm xử lý khi nhấn nút thanh toán (từ component cha)
    disabled = false,     // Trạng thái disable nút thanh toán (từ component cha)

    // Props mới cho số dư và phương thức thanh toán
    mainBalance = 0,      // Số dư TK Chính (từ component cha)
    bonusBalance = 0,     // Số dư TK Khuyến mãi (từ component cha)
    paymentMethod = 'online', // Giá trị state: 'balance' | 'online' (từ component cha)
    setPaymentMethod,     // Hàm để cập nhật state paymentMethod (từ component cha)
}) {
    // Kiểm tra xem có item nào được chọn không
    const hasItems = allItems.some((it) => (qty[it.id] || 0) > 0);

    // Tính toán tổng số dư và khả năng thanh toán bằng số dư
    const totalBalance = mainBalance + bonusBalance;
    const canPayWithBalance = totalBalance >= total && total > 0;

    return (
        <div className="bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] px-6 pt-5 pb-6 sticky top-4">
            {/* Title */}
            <h3 className="text-[20px] font-semibold text-[#1a3b7c]">Thông tin Thanh toán</h3>

            {/* Dấu gạch ngang */}
            <div className="my-4 border-t border-dashed border-[#D7DFEC]" />

            {/* Danh sách các dòng (sản phẩm) đã chọn */}
            <div className="space-y-3">
                {!hasItems ? (
                    <div className="text-center text-[14px] text-[#7A8AA1]">
                        Bạn chưa chọn gói tin nào.
                    </div>
                ) : (
                    allItems
                        .filter((it) => (qty[it.id] || 0) > 0)
                        .map((it) => {
                            const q = qty[it.id] || 0;
                            const lineTotal = q * it.price; // Tính tổng tiền cho dòng này
                            return (
                                <div key={it.id} className="flex items-center text-[14px]">
                                    <div className="flex-1 text-[#2B3A55]">{it.title}</div>
                                    <div className="w-10 text-right text-[#2B3A55]">{q}</div>
                                    <div className="w-28 text-right text-[#2B3A55]">{fmt(lineTotal)}</div>
                                </div>
                            );
                        })
                )}
            </div>

            {/* Dấu gạch ngang */}
            <div className="mt-4 border-t border-dashed border-[#D7DFEC]" />

            {/* Tổng tiền */}
            <div className="flex items-center justify-between py-4">
                <span className="text-[22px] font-semibold text-[#1a3b7c]">Tổng tiền</span>
                <span className="text-[22px] font-semibold text-[#1a3b7c]">{fmt(total)}</span>
            </div>

            {/* Số tiền cần thanh toán */}
             <div className="flex items-center justify-between py-3 border-t border-dashed border-[#D7DFEC]">
                 <span className="text-[15px] font-semibold text-[#2B3A55]">
                     Số tiền cần thanh toán
                 </span>
                 <span className="text-[#e32222] font-semibold">{fmt(total)} VNĐ</span>
             </div>

            {/* --- PHẦN HIỂN THỊ SỐ DƯ --- */}
            <div className="border-t border-dashed border-gray-200 my-4 pt-4 space-y-1 text-sm text-gray-500">
                <div className="flex justify-between">
                    <span>Số dư TK Chính:</span>
                    <span className="font-medium text-green-600">{fmt(mainBalance)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Số dư TK Khuyến mãi:</span>
                    <span className="font-medium text-blue-600">{fmt(bonusBalance)}</span>
                </div>
                 {total > 0 && ( // Chỉ hiển thị dòng này nếu có chọn hàng
                    <div className={`flex justify-between font-semibold ${canPayWithBalance ? 'text-green-700' : 'text-red-600'}`}>
                        <span>Tổng số dư:</span>
                        <span>{fmt(totalBalance)}</span>
                    </div>
                 )}
            </div>
            {/* --------------------------- */}

            {/* Ưu đãi (Nút giả lập) */}
            <button
                type="button"
                className="w-full h-[44px] mt-2 bg-[#eef4ff] hover:bg-[#e6efff] rounded-xl px-4 flex items-center justify-between text-[#2e62ff] transition-colors"
                // Bạn có thể thêm onClick để mở modal/drawer ưu đãi sau
            >
                <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-white text-[13px] border border-[#d6e1ff]">
                        🎟️
                    </span>
                    Ưu đãi
                </span>
                <span className="text-[#6a7aa0]">›</span>
            </button>

            {/* --- PHẦN CHỌN PHƯƠNG THỨC --- */}
            <div className="border-t border-dashed border-gray-200 my-4 pt-4">
                <h4 className="font-medium text-[#1a3b7c] mb-3 text-base">Chọn phương thức thanh toán:</h4>
                <Radio.Group
                    onChange={(e) => setPaymentMethod(e.target.value)} // Gọi hàm set state từ cha
                    value={paymentMethod} // Nhận giá trị state từ cha
                    className="w-full"
                >
                    <Space direction="vertical" className="w-full">
                        <Radio value="balance" disabled={!canPayWithBalance}>
                             Thanh toán bằng số dư
                             {!canPayWithBalance && total > 0 && (
                                 <span className="text-xs text-red-500 ml-2">(Không đủ)</span>
                             )}
                        </Radio>
                        <Radio value="online">
                             Thanh toán trực tuyến (Thẻ quốc tế)
                        </Radio>
                        {/* Thêm các Radio button khác cho các PTTT khác nếu cần */}
                    </Space>
                </Radio.Group>
            </div>
            {/* --------------------------- */}

            {/* Toggle Xuất hóa đơn (Nút giả lập) */}
            {/* Bạn có thể thay bằng Checkbox hoặc Switch thật sau */}
            <div className="bg-[#f7f9fe] rounded-2xl p-3 mt-3 shadow-[0_10px_20px_rgba(13,47,97,0.06)]">
                <div className="flex items-center gap-3">
                    <div className="relative w-11 h-[26px] rounded-full bg-[#E6ECF7] select-none">
                        {/* Thêm logic để thay đổi vị trí nút tròn nếu cần */}
                        <span className="absolute top-[3px] left-[3px] h-[20px] w-[20px] rounded-full bg-white shadow" />
                    </div>
                    <span className="text-[15px] text-[#637089]">Xuất hoá đơn cho giao dịch</span>
                </div>
            </div>

            {/* Điều khoản */}
            <p className="text-[13px] text-[#6B7A90] mt-5 leading-relaxed">
                Bằng việc bấm vào Thanh toán, bạn đã đồng ý với các{" "}
                <a className="text-[#2e62ff] hover:underline" href="#">điều khoản sử dụng</a>{" "}
                và{" "}
                <a className="text-[#2e62ff] hover:underline" href="#">chính sách bảo mật</a> của chúng tôi.
            </p>

            {/* Nút Thanh Toán */}
            <button
                // Disable khi tổng tiền là 0 HOẶC khi prop 'disabled' là true (đang loading)
                disabled={total === 0 || disabled}
                onClick={onPay} // Gọi hàm xử lý từ component cha
                className={`mt-4 w-full h-[48px] rounded-xl text-white font-semibold transition-colors duration-200 ${
                    (total <= 0 || disabled) // Điều kiện để disable nút
                        ? "bg-[#93a3bd] cursor-not-allowed"
                        : "bg-[#0f2f63] hover:bg-[#0c2550]" // Điều kiện khi nút active
                }`}
            >
                {/* Thay đổi text nút dựa vào phương thức và trạng thái loading */}
                {disabled
                    ? 'Đang xử lý...'
                    : (paymentMethod === 'balance' ? 'Xác nhận trừ số dư' : 'Tiếp tục Thanh toán')
                }
            </button>
        </div>
    );
}
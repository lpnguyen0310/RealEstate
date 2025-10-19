import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadPricing } from "@/store/pricingSlice";
// 1. IMPORT CÁC ACTION TỪ ORDER SLICE
import { createOrder, clearOrderError } from "@/store/orderSlice";
import { fmtVND as fmt, calcTotal } from "@/utils/countToToal";
import { SingleCard, ComboCard, PaymentCard } from "@/components/dashboard/purchagemangement";
import { useNavigate } from "react-router-dom";

export default function PurchagePostPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // Lấy state từ slice quản lý giá sản phẩm
    const { SINGLE, COMBOS, ALL_ITEMS, loading: pricingLoading, error: pricingError } = useSelector((s) => s.pricing);

    // 2. LẤY STATE TỪ SLICE QUẢN LÝ ORDER
    const { loading: isCreatingOrder, error: orderError } = useSelector((s) => s.orders);

    const [qty, setQty] = useState({});
    const setItem = (id, v) => setQty((s) => ({ ...s, [id]: v }));

    // Tải danh sách giá khi component được mount
    useEffect(() => {
        dispatch(loadPricing());
    }, [dispatch]);

    const total = useMemo(() => calcTotal(qty, SINGLE, COMBOS), [qty, SINGLE, COMBOS]);

    // 3. HÀM XỬ LÝ KHI NHẤN NÚT "THANH TOÁN"
    const handlePayment = async () => {
        // Xóa lỗi cũ (nếu có) trước khi thực hiện lần mới
        if (orderError) {
            dispatch(clearOrderError());
        }

        // Chuyển đổi state `qty` sang định dạng payload mà backend yêu cầu
        // State `qty`: { "vip-1": 2, "combo-1": 1 }
        // Payload cần: [ { code: "VIP_01", qty: 2 }, { code: "COMBO_EXP", qty: 1 } ]
        // Trong hàm handlePayment của file PurchagePostPage.jsx

        const itemsPayload = Object.keys(qty)
            .filter(itemId => qty[itemId] > 0)
            .map(itemId => {
                const itemInfo = ALL_ITEMS.find(item => item.id.toString() === itemId);

                if (!itemInfo) return null;

                // SỬA LẠI Ở ĐÂY: Lấy `code` từ bên trong `_raw`
                // Dùng `itemInfo._raw?.code` để an toàn, nếu `_raw` không tồn tại cũng không bị lỗi
                // Dùng `|| itemInfo.id` làm phương án dự phòng, nếu không có code thì dùng id
                const codeToSend = itemInfo._raw?.code || itemInfo.id;

                return {
                    code: codeToSend,
                    qty: qty[itemId]
                };
            })
            .filter(Boolean); // Lọc ra các giá trị null

        // BƯỚC DEBUG QUAN TRỌNG NHẤT
        console.log("State giỏ hàng (qty):", qty);
        console.log("Danh sách tất cả sản phẩm (ALL_ITEMS):", ALL_ITEMS);
        console.log("Payload sẽ gửi đi (itemsPayload):", itemsPayload);

        if (itemsPayload.length === 0) {
            alert("Giỏ hàng rỗng hoặc không hợp lệ, không thể gửi đi.");
            return;
        }

        // Dispatch action `createOrder` để bắt đầu quá trình
        const resultAction = await dispatch(createOrder(itemsPayload));
        if (createOrder.fulfilled.match(resultAction)) {
            const newOrder = resultAction.payload; // { orderId, ... }
            setQty({}); // reset giỏ hàng
            // 👉 Điều hướng sang trang thanh toán thẻ (mock)
            navigate(`/dashboard/pay?orderId=${encodeURIComponent(newOrder.orderId)}&amount=${encodeURIComponent(total)}`);
        }
    };

    if (pricingLoading) return <div className="p-6">Đang tải bảng giá…</div>;

    return (
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
                <div className="bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] p-6">
                    <h2 className="font-semibold text-[#1a3b7c] text-[16px] mb-4">Mua tin lẻ</h2>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {SINGLE.map((it) => (
                            <SingleCard key={it.id} item={it} value={qty[it.id] || 0} onChange={(v) => setItem(it.id, v)} />
                        ))}
                    </div>

                    <h2 className="font-semibold text-[#1a3b7c] text-[16px] mb-4">Mua theo Combo</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {COMBOS.map((it) => (
                            <ComboCard key={it.id} item={it} value={qty[it.id] || 0} onChange={(v) => setItem(it.id, v)} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="col-span-4">
                {/* 4. TRUYỀN HÀM MỚI VÀ TRẠNG THÁI LOADING VÀO COMPONENT THANH TOÁN */}
                <PaymentCard
                    qty={qty}
                    allItems={ALL_ITEMS}
                    total={total}
                    fmt={fmt}
                    onPay={handlePayment}
                    // Vô hiệu hóa nút thanh toán khi đang gọi API
                    disabled={isCreatingOrder}
                />

                {/* Hiển thị các thông báo trạng thái cho người dùng */}
                {pricingError && <div className="mt-3 text-xs text-amber-600">{pricingError}</div>}
                {isCreatingOrder && <div className="mt-3 text-center text-blue-600 font-semibold">Đang xử lý đơn hàng...</div>}
                {orderError && <div className="mt-3 text-xs text-red-600">Lỗi: {orderError}</div>}
            </div>
        </div>
    );
}
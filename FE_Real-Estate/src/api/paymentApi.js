import api from "./axios";

// src/api/paymentApi.js
export async function createPaymentIntent(orderId) {
    if (!orderId) throw new Error("Thiếu orderId");

    const res = await fetch(`/api/payments/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Không tạo được PaymentIntent");
    }

    return res.json(); // trả về { clientSecret, paymentIntentId } từ BE
}

export async function fetchOrderStatus(orderId) {
    const res = await fetch(`/api/orders/${orderId}`);
    if (!res.ok) throw new Error("Không lấy được trạng thái đơn hàng");
    return res.json(); // BE trả về { status: "PAID" | "PENDING" | ... }
}

export async function createTopUpIntent(amount) {
    if (!amount || amount <= 0) throw new Error("Số tiền không hợp lệ");

    try {
        // ⭐️ DÙNG `api.post` (axios)
        // Nó sẽ TỰ ĐỘNG đính kèm Authorization token
        const res = await api.post("/payments/top-up/create-intent", { amount });
        
        // Backend trả về { clientSecret, orderId }
        return res.data; 
    } catch (err) {
        // Xử lý lỗi chuẩn của axios
        const beError = err.response?.data; // {code, message}
        if (beError && beError.message) {
            throw new Error(beError.message);
        }
        throw new Error(err.message || "Không tạo được PaymentIntent nạp tiền");
    }
}

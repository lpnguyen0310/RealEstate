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

// src/components/dashboard/purchagemangement/Checkout/StripeCheckout.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
// ⭐️ Vẫn import hàm cũ
import { createPaymentIntent } from "@/api/paymentApi"; 

import { useDispatch } from "react-redux";
import { notificationApi } from "@/services/notificationApi";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK);
const BACK_HREF = "/dashboard/purchage"; 

// ... (Component Modal và Spinner của bạn giữ nguyên) ...
function Modal({ open, onClose, children, width = "max-w-md" }) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className={`w-full ${width} mx-4 rounded-2xl bg-white shadow-2xl p-6`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

function Spinner({ label }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-600">{label}</span>
        </div>
    );
}

// ... (Component Inner của bạn giữ nguyên) ...
function Inner({ orderId, amount, onPaid }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState(""); // small note under button
    const [openProcessing, setOpenProcessing] = useState(false);
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const pollOrder = async (timeoutMs = 60000, intervalMs = 1200) => {
        // ⭐️ LƯU Ý: Hàm này cần 'orderId' để hoạt động
        if (!orderId) {
            console.warn("pollOrder: Bỏ qua polling vì thiếu orderId");
            return false; // Không thể poll nếu không có orderId
        }
        const t0 = Date.now();
        while (Date.now() - t0 < timeoutMs) {
            try {
                const r = await fetch(`/api/orders/${orderId}`);
                if (r.ok) {
                    const data = await r.json();
                    const st = (data.status || data.orderStatus || "").toUpperCase();
                    if (st === "PAID") return true;
                    if (st === "CANCELED" || st === "EXPIRED") return false;
                }
            } catch (_) { }
            await new Promise((r) => setTimeout(r, intervalMs));
        }
        return false;
    };
    
    const handlePay = async () => {
        if (!stripe || !elements) return;

        setInfo("");
        setLoading(true);
        setOpenProcessing(true);

        const { error, paymentIntent } = await stripe
            .confirmPayment({
                elements,
                redirect: "if_required",
            })
            .catch(() => ({ error: { message: "Không thể kết nối Stripe." } }));

        if (!mounted.current) return;

        if (error) {
            setLoading(false);
            setOpenProcessing(false);
            setErrorMsg(error.message || "Thanh toán thất bại.");
            setOpenError(true);
            return;
        }

        if (paymentIntent?.status === "succeeded") {
            setLoading(false);
            setOpenProcessing(false);
            setOpenSuccess(true);
            onPaid?.();
            dispatch(
                notificationApi.util.invalidateTags(['UnreadCount', 'Notifications'])
            );
            return;
        }

        // Async: chờ webhook cập nhật đơn
        setInfo("Đang xử lý qua ngân hàng…");
        const ok = await pollOrder();
        if (!mounted.current) return;

        setLoading(false);
        setOpenProcessing(false);
        if (ok) {
            setOpenSuccess(true);
            onPaid?.();
            dispatch(
                notificationApi.util.invalidateTags(['UnreadCount', 'Notifications'])
            );
        } else {
            setErrorMsg("Chưa xác thực xong. Vui lòng kiểm tra lại giao dịch.");
            setOpenError(true);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <PaymentElement />
                <button
                    type="button"
                    onClick={handlePay}
                    disabled={loading || !stripe || !elements}
                    className="w-full h-12 rounded-xl bg-[#0f2f63] hover:bg-[#0c2550] text-white font-semibold disabled:opacity-50"
                >
                    {loading ? "Đang xử lý..." : "Thanh toán"}
                </button>
                {!!info && <p className="text-sm text-[#d43f3a]">{info}</p>}
            </div>

            {/* Modal: Processing */}
            <Modal open={openProcessing} onClose={() => { }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-[#eef4ff] flex items-center justify-center">
                        🔄
                    </div>
                    <h3 className="text-lg font-semibold text-[#0f2f63]">
                        Đang xử lý thanh toán…
                    </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Vui lòng không đóng cửa sổ cho tới khi hoàn tất xác thực.
                </p>
                <Spinner label="Đang xác thực với ngân hàng…" />
            </Modal>

            {/* Modal: Success */}
            <Modal open={openSuccess} onClose={() => setOpenSuccess(false)}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        ✔
                    </div>
                    <h3 className="text-lg font-semibold text-green-700">
                        Thanh toán thành công
                    </h3>
                </div>
                <div className="text-sm text-gray-700 mb-4">
                    {orderId && (
                        <>Mã đơn: <span className="font-mono">{orderId}</span></>
                    )}
                    {typeof amount === "number" && (
                        <>
                            {orderId ? " • " : ""}
                            Số tiền: <b>{amount.toLocaleString("vi-VN")}₫</b>
                        </>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => navigate(BACK_HREF)}
                        className="px-4 h-10 rounded-lg bg-[#0f2f63] text-white font-medium"
                    >
                        Quay lại trang mua hàng
                    </button>
                </div>
            </Modal>

            {/* Modal: Error */}
            <Modal open={openError} onClose={() => setOpenError(false)}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                        ⚠
                    </div>
                    <h3 className="text-lg font-semibold text-red-700">
                        Thanh toán chưa hoàn tất
                    </h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">{errorMsg}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setOpenError(false)}
                        className="px-4 h-10 rounded-lg border border-gray-300 text-gray-700"
                    >
                        Đóng
                    </button>
                </div>
            </Modal>
        </>
    );
}


/* ---------- Outer: init clientSecret (Linh hoạt) ---------- */

// ⭐️ THAY ĐỔI: Thêm 'clientSecret' vào props (đổi tên thành 'clientSecretProp' để tránh nhầm lẫn)
export default function StripeCheckout({ orderId, amount, onPaid, clientSecret: clientSecretProp }) {
    
    // State này chỉ dùng cho Kịch bản A (Mua Gói)
    const [internalClientSecret, setInternalClientSecret] = useState("");
    const [initMsg, setInitMsg] = useState("");

    // Chặn gọi trùng
    const initLock = useRef(new Set());

    // ⭐️ QUAN TRỌNG: Xác định clientSecret cuối cùng để sử dụng
    // Ưu tiên 1: Lấy từ prop (Kịch bản B - Nạp Tiền)
    // Ưu tiên 2: Lấy từ state nội bộ (Kịch bản A - Mua Gói)
    const effectiveClientSecret = useMemo(
        () => clientSecretProp || internalClientSecret,
        [clientSecretProp, internalClientSecret]
    );

    useEffect(() => {
        // ⭐️ KỊCH BẢN B: Nạp Tiền (đã có clientSecretProp)
        // Nếu component cha đã cung cấp clientSecret, bỏ qua toàn bộ logic fetch
        if (clientSecretProp) {
            setInitMsg(""); // Xóa thông báo loading (nếu có)
            return;
        }

        // ⭐️ KỊCH BẢN A: Mua Gói (chỉ có orderId, phải fetch)
        if (!orderId || internalClientSecret) return; // Không có orderId hoặc đã fetch rồi
        if (initLock.current.has(orderId)) return;
        initLock.current.add(orderId);

        (async () => {
            setInitMsg("Đang khởi tạo thanh toán…");
            try {
                // Vẫn gọi hàm createPaymentIntent như cũ
                const data = await createPaymentIntent(orderId); 
                if (data?.alreadyPaid) {
                    setInitMsg("Đơn hàng đã được thanh toán.");
                    onPaid?.();
                    return;
                }
                if (data?.clientSecret) {
                    // Set vào state nội bộ
                    setInternalClientSecret(data.clientSecret); 
                    setInitMsg("");
                } else {
                    setInitMsg("Thiếu clientSecret từ server.");
                }
            } catch (e) {
                setInitMsg(e.message || "Không tạo được thanh toán");
            }
        })();
    }, [orderId, internalClientSecret, onPaid, clientSecretProp]); // Thêm clientSecretProp vào dependency

    const options = useMemo(
        () =>
            // ⭐️ Dùng clientSecret "hiệu lực"
            effectiveClientSecret 
                ? {
                    clientSecret: effectiveClientSecret,
                    appearance: { theme: "stripe" },
                }
                : null,
        [effectiveClientSecret] // Dùng clientSecret "hiệu lực"
    );

    // ⭐️ Logic render loading/error
    if (!effectiveClientSecret) {
        // Nếu cả 2 đều không có -> lỗi sử dụng component
        if (!orderId && !clientSecretProp) {
            return (
                <div className="text-[#d43f3a]">
                    Lỗi: Thiếu <code>orderId</code> hoặc <code>clientSecret</code>.
                </div>
            );
        }
        // Nếu có 1 trong 2, nhưng chưa sẵn sàng -> hiển thị thông báo
        return <div>{initMsg || "Đang khởi tạo thanh toán…"}</div>;
    }

    // ⭐️ Đã có effectiveClientSecret, render Elements
    return (
        <Elements stripe={stripePromise} options={options}>
            <Inner orderId={orderId} amount={amount} onPaid={onPaid} />
            <div className="mt-3 text-xs text-[#6b7a90]">
                Test card: 4242 4242 4242 4242 — Exp: 12/34 — CVC: 123
            </div>
        </Elements>
    );
}
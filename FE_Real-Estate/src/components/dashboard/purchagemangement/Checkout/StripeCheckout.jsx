// src/components/payments/StripeCheckout.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { createPaymentIntent } from "@/api/paymentApi";

import { useDispatch } from "react-redux";
import { notificationApi } from "@/services/notificationApi";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK);
const BACK_HREF = "/dashboard/purchage"; // đổi nếu route khác

/* ---------- Small UI helpers ---------- */
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

/* ---------- Inner: confirm + modals ---------- */
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
                    Mã đơn: <span className="font-mono">{orderId}</span>
                    {typeof amount === "number" && (
                        <>
                            {" "}
                            • Số tiền: <b>{amount.toLocaleString("vi-VN")}₫</b>
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

/* ---------- Outer: init clientSecret (idempotent, no double-call) ---------- */
export default function StripeCheckout({ orderId, amount, onPaid }) {
    const [clientSecret, setClientSecret] = useState("");
    const [initMsg, setInitMsg] = useState("");

    // Chặn gọi trùng trong dev (React Strict Mode mount/unmount)
    const initLock = useRef(new Set());

    useEffect(() => {
        if (!orderId || clientSecret) return;
        if (initLock.current.has(orderId)) return; // đã gọi rồi
        initLock.current.add(orderId);

        (async () => {
            setInitMsg("Đang khởi tạo thanh toán…");
            try {
                const data = await createPaymentIntent(orderId); // chỉ gọi 1 nơi
                if (data?.alreadyPaid) {
                    setInitMsg("Đơn hàng đã được thanh toán.");
                    onPaid?.();
                    return;
                }
                if (data?.clientSecret) {
                    setClientSecret(data.clientSecret);
                    setInitMsg("");
                } else {
                    setInitMsg("Thiếu clientSecret từ server.");
                }
            } catch (e) {
                // Hàm helper trả message từ BE (409/400/500) => e.message
                setInitMsg(e.message || "Không tạo được thanh toán");
            }
        })();
    }, [orderId, clientSecret, onPaid]);

    const options = useMemo(
        () =>
            clientSecret
                ? {
                    clientSecret,
                    appearance: { theme: "stripe" },
                }
                : null,
        [clientSecret]
    );

    if (!orderId || orderId === "N/A") {
        return (
            <div className="text-[#d43f3a]">
                Thiếu orderId. Ví dụ: <code>?orderId=123&amp;amount=99000</code>
            </div>
        );
    }

    if (!clientSecret) return <div>{initMsg || "Đang khởi tạo thanh toán…"}</div>;

    return (
        <Elements stripe={stripePromise} options={options}>
            <Inner orderId={orderId} amount={amount} onPaid={onPaid} />
            <div className="mt-3 text-xs text-[#6b7a90]">
                Test card: 4242 4242 4242 4242 — Exp: 12/34 — CVC: 123
            </div>
        </Elements>
    );
}

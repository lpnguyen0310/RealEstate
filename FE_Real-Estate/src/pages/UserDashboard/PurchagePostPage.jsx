import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadPricing } from "@/store/pricingSlice";
import { createOrder, clearOrderError, payOrderByBalanceThunk } from "@/store/orderSlice";
import { fetchMyProfile } from "@/store/profileSlice";
import { fmtVND as fmt, calcTotal } from "@/utils/countToToal";
import { SingleCard, ComboCard, PaymentCard } from "@/components/dashboard/purchagemangement";
import { Spin } from "antd";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

export default function PurchagePostPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Pricing
    const { SINGLE, COMBOS, ALL_ITEMS, loading: pricingLoading, error: pricingError } = useSelector(
        (s) => s.pricing
    );

    // Profile
    const { data: profileData, status: profileStatus, error: profileError } = useSelector(
        (s) => s.profile
    );

    // Order
    const {
        loading: isCreatingOrder,
        error: createOrderError,
        payWithBalanceStatus,
        payWithBalanceError,
    } = useSelector((s) => s.orders);

    const [qty, setQty] = useState({});
    const [paymentMethod, setPaymentMethod] = useState("online");
    const setItem = (id, v) => setQty((s) => ({ ...s, [id]: v }));

    // Snackbar
    const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
    const handleCloseAlert = (_, reason) => {
        if (reason === "clickaway") return;
        setAlert((s) => ({ ...s, open: false }));
    };

    // load pricing
    useEffect(() => {
        dispatch(loadPricing());
    }, [dispatch]);

    // load profile if needed
    useEffect(() => {
        if (profileStatus === "idle") {
            dispatch(fetchMyProfile());
        }
    }, [dispatch, profileStatus]);

    // total
    const total = useMemo(() => calcTotal(qty, SINGLE, COMBOS), [qty, SINGLE, COMBOS]);

    // balances
    const { mainBalance, bonusBalance, canPayWithBalance } = useMemo(() => {
        const main = profileData?.mainBalance ?? 0;
        const bonus = profileData?.bonusBalance ?? 0;
        return {
            mainBalance: main,
            bonusBalance: bonus,
            canPayWithBalance: main + bonus >= total && total > 0,
        };
    }, [profileData, total]);

    const isProcessingPayment = isCreatingOrder || payWithBalanceStatus === "loading";

    // pay handler
    const handlePayment = async () => {
        const itemsPayload = Object.keys(qty)
            .filter((itemId) => qty[itemId] > 0)
            .map((itemId) => {
                const itemInfo = ALL_ITEMS.find((item) => item.id.toString() === itemId);
                if (!itemInfo) return null;
                return {
                    code: itemInfo._raw.code, // gửi code (VD: "VIP_1" | "COMBO_FAST")
                    qty: qty[itemId],
                };
            })
            .filter(Boolean);

        if (itemsPayload.length === 0) {
            setAlert({ open: true, message: "Vui lòng chọn gói tin trước khi thanh toán.", severity: "warning" });
            return;
        }

        if (createOrderError || payWithBalanceError) {
            dispatch(clearOrderError());
        }

        // balance
        if (paymentMethod === "balance") {
            if (!canPayWithBalance) {
                setAlert({
                    open: true,
                    message: "Số dư tài khoản không đủ để thực hiện thanh toán này.",
                    severity: "error",
                });
                return;
            }

            const createOrderAction = await dispatch(createOrder(itemsPayload));
            if (createOrder.fulfilled.match(createOrderAction)) {
                const newOrder = createOrderAction.payload;
                const orderIdToPay = newOrder?.orderId;
                if (!orderIdToPay) {
                    setAlert({ open: true, message: "Lỗi: Không nhận được ID đơn hàng sau khi tạo.", severity: "error" });
                    return;
                }

                const payAction = await dispatch(payOrderByBalanceThunk(orderIdToPay));
                if (payOrderByBalanceThunk.fulfilled.match(payAction)) {
                    setAlert({
                        open: true,
                        message: `Thanh toán đơn hàng #${orderIdToPay} bằng số dư thành công!`,
                        severity: "success",
                    });
                    setQty({});
                    dispatch(fetchMyProfile());
                } else if (payOrderByBalanceThunk.rejected.match(payAction)) {
                    setAlert({
                        open: true,
                        message: `Lỗi thanh toán bằng số dư: ${payAction.payload || "Lỗi không xác định"}`,
                        severity: "error",
                    });
                }
            } else if (createOrder.rejected.match(createOrderAction)) {
                setAlert({
                    open: true,
                    message: `Lỗi tạo đơn hàng: ${createOrderAction.payload?.message || createOrderAction.payload || "Lỗi không xác định"
                        }`,
                    severity: "error",
                });
            }
        }
        // online
        else {
            const resultAction = await dispatch(createOrder(itemsPayload));
            if (createOrder.fulfilled.match(resultAction)) {
                const newOrder = resultAction.payload;
                if (!newOrder?.orderId) {
                    setAlert({
                        open: true,
                        message: "Lỗi: Không nhận được ID đơn hàng để chuyển sang thanh toán.",
                        severity: "error",
                    });
                    return;
                }
                setQty({});
                navigate(
                    `/dashboard/pay?orderId=${encodeURIComponent(newOrder.orderId)}&amount=${encodeURIComponent(total)}`
                );
            } else if (createOrder.rejected.match(resultAction)) {
                setAlert({
                    open: true,
                    message: `Lỗi tạo đơn hàng: ${resultAction.payload?.message || resultAction.payload || "Lỗi không xác định"
                        }`,
                    severity: "error",
                });
            }
        }
    };

    // error/loading pricing
    if (pricingError) {
        return (
            <div className="p-4 sm:p-6 text-red-500">
                Lỗi: Không thể tải bảng giá ({pricingError}). Vui lòng thử lại.
            </div>
        );
    }

    if (pricingLoading) {
        return (
            <div className="p-4 sm:p-6 grid place-items-center h-[260px] sm:h-[300px]">
                <Spin tip="Đang tải bảng giá..." size="large" />
            </div>
        );
    }

    const profileIsReady = profileStatus === "succeeded";

    return (
        <>
            {/* Grid responsive: 1 cột trên mobile, 8/4 trên desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* LEFT */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] p-4 sm:p-6">
                        <h2 className="font-semibold text-[#1a3b7c] text-[15px] sm:text-[16px] mb-3 sm:mb-4">
                            Mua tin lẻ
                        </h2>

                        {/* Grid 1-2-3 theo breakpoint */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                            {SINGLE?.map((it) => (
                                <SingleCard key={it.id} item={it} value={qty[it.id] || 0} onChange={(v) => setItem(it.id, v)} />
                            ))}
                        </div>

                        <h2 className="font-semibold text-[#1a3b7c] text-[15px] sm:text-[16px] mb-3 sm:mb-4">
                            Mua theo Combo
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {COMBOS?.map((it) => (
                                <ComboCard key={it.id} item={it} value={qty[it.id] || 0} onChange={(v) => setItem(it.id, v)} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="lg:col-span-4">
                    {profileStatus === "loading" && (
                        <Spin tip="Đang tải số dư..." size="small" className="mb-2 block" />
                    )}
                    {profileStatus === "failed" && (
                        <div className="mb-2 text-xs text-red-500">Lỗi tải số dư: {profileError}</div>
                    )}

                    <PaymentCard
                        className="lg:sticky lg:top-4"          // 🔥 sticky chỉ trên desktop
                        qty={qty}
                        allItems={ALL_ITEMS || []}
                        total={total}
                        fmt={fmt}
                        onPay={handlePayment}
                        disabled={isProcessingPayment}
                        mainBalance={profileIsReady ? profileData?.mainBalance ?? 0 : 0}
                        bonusBalance={profileIsReady ? profileData?.bonusBalance ?? 0 : 0}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                    />

                    {isProcessingPayment && (
                        <div className="mt-3 text-center text-blue-600 font-semibold">Đang xử lý...</div>
                    )}
                    {createOrderError && (
                        <div className="mt-3 text-xs text-red-600">
                            Lỗi tạo đơn hàng:{" "}
                            {typeof createOrderError === "object"
                                ? createOrderError.message || JSON.stringify(createOrderError)
                                : createOrderError}
                        </div>
                    )}
                    {payWithBalanceError && (
                        <div className="mt-3 text-xs text-red-600">
                            Lỗi thanh toán bằng số dư: {payWithBalanceError}
                        </div>
                    )}
                </div>
            </div>

            {/* Snackbar */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <MuiAlert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: "100%" }} variant="filled">
                    {alert.message}
                </MuiAlert>
            </Snackbar>
        </>
    );
}

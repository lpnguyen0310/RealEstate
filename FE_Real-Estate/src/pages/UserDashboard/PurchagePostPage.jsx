// src/pages/PurchagePostPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadPricing } from "@/store/pricingSlice";
import { createOrder, clearOrderError, payOrderByBalanceThunk } from "@/store/orderSlice";
import { fetchMyProfile } from "@/store/profileSlice";
import { fmtVND as fmt, calcTotal } from "@/utils/countToToal";
import { SingleCard, ComboCard, PaymentCard } from "@/components/dashboard/purchagemangement";
import { Spin } from 'antd'; // Chỉ cần Spin từ Antd
// Import MUI components cho Snackbar
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

export default function PurchagePostPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Lấy state giá
    const { SINGLE, COMBOS, ALL_ITEMS, loading: pricingLoading, error: pricingError } = useSelector((s) => s.pricing);
    // Lấy state profile
    const { data: profileData, status: profileStatus, error: profileError } = useSelector((s) => s.profile);
    // Lấy state order
    const {
        loading: isCreatingOrder,
        error: createOrderError,
        payWithBalanceStatus,
        payWithBalanceError
    } = useSelector((s) => s.orders);

    const [qty, setQty] = useState({});
    const [paymentMethod, setPaymentMethod] = useState('online');
    const setItem = (id, v) => setQty((s) => ({ ...s, [id]: v }));

    // State và handler cho MUI Snackbar
    const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
    const handleCloseAlert = (event, reason) => {
        if (reason === "clickaway") return;
        setAlert((s) => ({ ...s, open: false }));
    };

    // Tải danh sách giá
    useEffect(() => {
        dispatch(loadPricing());
    }, [dispatch]);

    // Tải profile nếu chưa có
    useEffect(() => {
        if (profileStatus === 'idle') {
            dispatch(fetchMyProfile());
        }
    }, [dispatch, profileStatus]);

    // Tính tổng tiền
    const total = useMemo(() => calcTotal(qty, SINGLE, COMBOS), [qty, SINGLE, COMBOS]);

    // Tính số dư và khả năng thanh toán
    const { mainBalance, bonusBalance, canPayWithBalance } = useMemo(() => {
        const main = profileData?.mainBalance ?? 0;
        const bonus = profileData?.bonusBalance ?? 0;
        return {
            mainBalance: main,
            bonusBalance: bonus,
            canPayWithBalance: (main + bonus) >= total && total > 0
        };
    }, [profileData, total]);

    // Xác định trạng thái loading tổng hợp
    const isProcessingPayment = isCreatingOrder || payWithBalanceStatus === 'loading';

    // Hàm xử lý thanh toán
    const handlePayment = async () => {
        const itemsPayload = Object.keys(qty)
            .filter(itemId => qty[itemId] > 0)
            .map(itemId => {
                const itemInfo = ALL_ITEMS.find(item => item.id.toString() === itemId);
                if (!itemInfo) return null;
                const codeToSend = itemInfo._raw?.code || itemInfo.id;
                return { 
                    code: itemInfo._raw.code, // Luôn gửi 'code' (VD: "VIP_1" hoặc "COMBO_FAST")
                    qty: qty[itemId] 
                }
            })
            .filter(Boolean);

        if (itemsPayload.length === 0) {
            setAlert({ open: true, message: "Vui lòng chọn gói tin trước khi thanh toán.", severity: "warning" });
            return;
        }

        // Clear lỗi cũ
        if (createOrderError || payWithBalanceError) {
            dispatch(clearOrderError());
        }

        // Xử lý thanh toán bằng số dư
        if (paymentMethod === 'balance') {
            if (!canPayWithBalance) {
                setAlert({ open: true, message: "Số dư tài khoản không đủ để thực hiện thanh toán này.", severity: "error" });
                return;
            }

            // B1: Tạo đơn hàng
            const createOrderAction = await dispatch(createOrder(itemsPayload));
            if (createOrder.fulfilled.match(createOrderAction)) {
                const newOrder = createOrderAction.payload;
                const orderIdToPay = newOrder?.orderId;

                if (!orderIdToPay) {
                    setAlert({ open: true, message: "Lỗi: Không nhận được ID đơn hàng sau khi tạo.", severity: "error" });
                    return;
                }

                // B2: Thanh toán bằng số dư
                const payAction = await dispatch(payOrderByBalanceThunk(orderIdToPay));
                if (payOrderByBalanceThunk.fulfilled.match(payAction)) {
                    setAlert({ open: true, message: `Thanh toán đơn hàng #${orderIdToPay} bằng số dư thành công!`, severity: "success" });
                    setQty({});
                    dispatch(fetchMyProfile()); // Cập nhật lại số dư
                    // navigate("/dashboard/transactions"); // Tùy chọn điều hướng
                } else if (payOrderByBalanceThunk.rejected.match(payAction)) {
                    setAlert({ open: true, message: `Lỗi thanh toán bằng số dư: ${payAction.payload || 'Lỗi không xác định'}`, severity: "error" });
                }
            } else if (createOrder.rejected.match(createOrderAction)){
                 setAlert({ open: true, message: `Lỗi tạo đơn hàng: ${createOrderAction.payload?.message || createOrderAction.payload || 'Lỗi không xác định'}`, severity: "error" });
            }

        }
        // Xử lý thanh toán trực tuyến (Stripe)
        else { // paymentMethod === 'online'
            const resultAction = await dispatch(createOrder(itemsPayload));
            if (createOrder.fulfilled.match(resultAction)) {
                const newOrder = resultAction.payload;
                 if (!newOrder?.orderId) {
                     setAlert({ open: true, message: "Lỗi: Không nhận được ID đơn hàng để chuyển sang thanh toán.", severity: "error" });
                     return;
                 }
                setQty({});
                navigate(`/dashboard/pay?orderId=${encodeURIComponent(newOrder.orderId)}&amount=${encodeURIComponent(total)}`);
            } else if (createOrder.rejected.match(resultAction)){
                 setAlert({ open: true, message: `Lỗi tạo đơn hàng: ${resultAction.payload?.message || resultAction.payload || 'Lỗi không xác định'}`, severity: "error" });
            }
        }
    };

    // --- XỬ LÝ TRẠNG THÁI LOADING / ERROR ---

    // Ưu tiên hiển thị lỗi tải giá
    if (pricingError) {
        return <div className="p-6 text-red-500">Lỗi: Không thể tải bảng giá ({pricingError}). Vui lòng thử lại.</div>;
    }

    // Hiển thị loading nếu đang tải giá
    if (pricingLoading) {
        return <div className="p-6 grid place-items-center h-[300px]"><Spin tip="Đang tải bảng giá..." size="large" /></div>;
    }

    // --- Nếu đã có dữ liệu giá, render UI chính ---
    const profileIsReady = profileStatus === 'succeeded';

    return (
        // Sử dụng Fragment để chứa cả nội dung trang và Snackbar
        <>
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8">
                    {/* Phần chọn gói tin */}
                    <div className="bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] p-6">
                        <h2 className="font-semibold text-[#1a3b7c] text-[16px] mb-4">Mua tin lẻ</h2>
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {SINGLE && SINGLE.map((it) => (
                                <SingleCard key={it.id} item={it} value={qty[it.id] || 0} onChange={(v) => setItem(it.id, v)} />
                            ))}
                        </div>

                        <h2 className="font-semibold text-[#1a3b7c] text-[16px] mb-4">Mua theo Combo</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {COMBOS && COMBOS.map((it) => (
                                <ComboCard key={it.id} item={it} value={qty[it.id] || 0} onChange={(v) => setItem(it.id, v)} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-span-4">
                    {/* Hiển thị loading/error của profile gần PaymentCard */}
                    {profileStatus === 'loading' && <Spin tip="Đang tải số dư..." size="small" className="mb-2"/>}
                    {profileStatus === 'failed' && <div className="mb-2 text-xs text-red-500">Lỗi tải số dư: {profileError}</div>}

                    <PaymentCard
                        qty={qty}
                        allItems={ALL_ITEMS || []}
                        total={total}
                        fmt={fmt}
                        onPay={handlePayment}
                        disabled={isProcessingPayment}
                        mainBalance={profileIsReady ? mainBalance : 0}
                        bonusBalance={profileIsReady ? bonusBalance : 0}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                    />

                    {/* Hiển thị trạng thái/lỗi của quá trình thanh toán dưới dạng text */}
                    {isProcessingPayment && <div className="mt-3 text-center text-blue-600 font-semibold">Đang xử lý...</div>}
                    {createOrderError && <div className="mt-3 text-xs text-red-600">Lỗi tạo đơn hàng: {typeof createOrderError === 'object' ? (createOrderError.message || JSON.stringify(createOrderError)) : createOrderError}</div>}
                    {payWithBalanceError && <div className="mt-3 text-xs text-red-600">Lỗi thanh toán bằng số dư: {payWithBalanceError}</div>}
                </div>
            </div>

            {/* MUI Snackbar để hiển thị thông báo */}
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
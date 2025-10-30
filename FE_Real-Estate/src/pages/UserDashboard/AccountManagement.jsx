// src/pages/AccountManagement.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Tabs, Space, Typography, Affix, Button, Spin, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";

// MUI
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// --- REDUX ---
import { useDispatch, useSelector } from "react-redux";
import {
    fetchMyProfile,
    updateMyProfileThunk,
    clearProfile,
} from "@/store/profileSlice";

// --- CLOUDINARY ---
import { getUploadSignature, uploadToCloudinary } from "@/api/cloudinary";

// --- Components ---
import AccountSummaryCard from "@/components/dashboard/usermanager/AccountSummaryCard";
import EditInfoForm from "@/components/dashboard/usermanager/account/EditInfoForm";
import AccountSettingsPanel from "@/components/dashboard/usermanager/account/AccountSettingsPanel";
import ProBrokerBlank from "@/components/dashboard/usermanager/account/ProBrokerBlank";
import TopUpForm from "@/components/payments/TopUpForm";

// ⭐️ THAY ĐỔI: Import StripeCheckout (giữ nguyên đường dẫn của bạn)
import StripeCheckout from "@/components/dashboard/purchagemangement/Checkout/StripeCheckout";

// ⭐️ THAY ĐỔI: Import API nạp tiền thật
import { createTopUpIntent } from "@/api/paymentApi"; 


const { Title } = Typography;

export default function AccountManagement() {
    const { refetchUser: refetchUserLayout } = useOutletContext() || {};

    const dispatch = useDispatch();
    const { data: profileData, status, error } = useSelector((state) => state.profile);
    const isLoading = status === "loading";
     useEffect(() => {
        console.log("--- Profile Data Update ---");
        console.log("Status:", status);
        console.log("Data:", profileData);
        console.log("Error:", error);
    }, [profileData, status, error]); // Chạy khi profileData, status, hoặc error thay đổi
    // Snackbar MUI
    const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
    const handleCloseAlert = (event, reason) => {
        if (reason === "clickaway") return;
        setAlert((s) => ({ ...s, open: false }));
    };

    // Dialog MUI
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
    const closeSuccessDialog = () => setOpenSuccessDialog(false);

    // useEffect fetch/clear profile
    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchMyProfile());
        }
    }, [dispatch, status]);

    useEffect(() => {
        return () => {
            dispatch(clearProfile());
        };
    }, [dispatch]);


    const [activeTab, setActiveTab] = useState("edit");
    
    // ⭐️ THAY ĐỔI: State panel
    // data sẽ chứa { clientSecret, orderId, amount }
    const [panel, setPanel] = useState({ 
        view: "manage", // "manage" | "topup" | "stripe"
        data: null
    });

    // useMemo summary
    const summary = useMemo(() => {
        const user = profileData;
        if (!user) return {};
        const username =
            user.fullName ||
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
            user.email ||
            "Người dùng";
        const points = user.points ?? 0;
        const postBalance = user.mainBalance ?? 0;   
        const promoBalance = user.bonusBalance ?? 0;
        const identityAccount =
            user.identityCode || `BDS${(user.id ?? "USER").toString().padStart(8, "0")}`;
        const isNewIdentity = !user.identityCode;
        return { username, points, postBalance, promoBalance, identityAccount, isNewIdentity };
    }, [profileData]);

    // Hàm điều hướng
    const openTopUp = () => setPanel({ view: "topup", data: null });
    const backToManage = () => setPanel({ view: "manage", data: null });

    
    // ====== LƯU FORM ======
    const handleSaveSubmit = (payload) => {
        return dispatch(updateMyProfileThunk(payload))
            .unwrap()
            .then(() => {
                setOpenSuccessDialog(true);
            })
            .catch((err) => {
                const errorMessage = err?.message || "Lỗi không xác định khi lưu.";
                setAlert({ open: true, message: `Lưu thất bại: ${errorMessage}`, severity: "error" });
                throw err;
            });
    };

    // ====== UPLOAD AVATAR ======
    const handleAvatarUpload = async (file) => {
        if (!file) return;
        const uploadMessageKey = "avatar-upload";
        message.loading({ content: "Đang tải ảnh lên...", key: uploadMessageKey, duration: 0 });

        try {
            const sig = await getUploadSignature("avatars");
            const cloudinaryResponse = await uploadToCloudinary(file, sig);
            const avatarUrl = cloudinaryResponse?.secure_url;
            if (!avatarUrl) throw new Error("Không nhận được URL ảnh từ Cloudinary.");

            await dispatch(updateMyProfileThunk({ avatar: avatarUrl })).unwrap();

            message.destroy(uploadMessageKey);
            setAlert({ open: true, message: "Cập nhật avatar thành công!", severity: "success" });
        } catch (error) {
            console.error("Lỗi upload avatar:", error);
            message.destroy(uploadMessageKey);
            setAlert({
                open: true,
                message: `Lỗi: ${error.message || "Không thể cập nhật avatar."}`,
                severity: "error",
            });
            throw error;
        }
    };
    
    // useEffect báo lỗi
    useEffect(() => {
        if (status === "failed" && !profileData) {
            setAlert({
                open: true,
                message: `Lỗi tải profile: ${error || "Có lỗi xảy ra"}`,
                severity: "error",
            });
            dispatch(clearProfile());
        }
    }, [status, error, dispatch, profileData]);

    // ⭐️ THAY ĐỔI: Cập nhật handler onContinue
    const handleTopUpContinue = async (amount, method, invoiceValues, options) => {
        if (method === "visa") {
            const topUpMessageKey = "topup-create-order";
            try {
                message.loading({
                    content: "Đang tạo đơn nạp tiền...",
                    key: topUpMessageKey,
                    duration: 0,
                });
                
                // 1. Gọi API nạp tiền thật
                // Chúng ta cần BE trả về { clientSecret, orderId }
                const paymentData = await createTopUpIntent(amount);
                
                if (!paymentData?.clientSecret) {
                    throw new Error("Không thể tạo mã thanh toán từ server.");
                }
                if (!paymentData?.orderId) {
                    // Cảnh báo nếu BE quên trả về orderId
                    console.warn("API nạp tiền không trả về 'orderId'. Modal thành công sẽ không hiển thị mã đơn.");
                }

                message.destroy(topUpMessageKey);

                // 2. Chuyển sang panel Stripe và truyền props mới
                setPanel({
                    view: "stripe",
                    data: {
                        clientSecret: paymentData.clientSecret, // Prop mới cho StripeCheckout
                        orderId: paymentData.orderId, // Prop cho Inner (để poll và hiển thị)
                        amount: amount,
                    },
                });

            } catch (err) {
                message.destroy(topUpMessageKey);
                setAlert({
                    open: true,
                    message: `Lỗi: ${err.message || "Không thể khởi tạo thanh toán."}`,
                    severity: "error",
                });
            }
        } else {
            // Xử lý các PTTT khác (giữ nguyên)
            setAlert({
                open: true,
                message: `Tiếp tục nạp ${amount?.toLocaleString("vi-VN")}đ qua ${method}`,
                severity: "info",
            });
        }
    };

    // Handler khi Stripe báo thanh toán thành công
    const handlePaymentSuccess = () => {
        setAlert({
            open: true,
            message: "Nạp tiền thành công! Số dư sẽ được cập nhật sau vài giây.",
            severity: "success",
        });
        setPanel({ view: "manage", data: null });
        setTimeout(() => {
            dispatch(fetchMyProfile());
            refetchUserLayout?.();
        }, 1000);
    };


    // render loading/error
    if (status === "loading" && !profileData) {
        return (
            <div className="w-full h-[400px] grid place-items-center">
                <Spin size="large" />
            </div>
        );
    }
    if (status === "failed" && !profileData) {
        return (
            <div className="w-full h-[400px] grid place-items-center text-red-500">
                Lỗi: Không thể tải thông tin tài khoản. (Xem thông báo chi tiết dưới góc màn hình)
            </div>
        );
    }

    return (
        <section className="w-full max-w-[1100px] mx-auto px-4 md:px-1">
            <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] gap-6">
                {/* LEFT */}
                <div>
                    <Affix offsetTop={16}>
                        <AccountSummaryCard
                            username={summary.username}
                            points={summary.points}
                            postBalance={summary.postBalance}
                            promoBalance={summary.promoBalance}
                            identityAccount={summary.identityAccount}
                            isNewIdentity={summary.isNewIdentity}
                            onTopUp={openTopUp}
                        />
                    </Affix>
                </div>

                {/* RIGHT */}
                <div>
                    {panel.view === "manage" ? (
                        <>
                            {/* --- Panel Quản lý (Tabs) --- */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
                                <Tabs
                                    activeKey={activeTab}
                                    onChange={setActiveTab}
                                    className="tabs-elevated"
                                    items={[
                                        {
                                            key: "edit",
                                            label: "Chỉnh sửa thông tin",
                                            children: (
                                                <EditInfoForm
                                                    initialData={profileData}
                                                    onSubmit={handleSaveSubmit}
                                                    onUploadAvatar={handleAvatarUpload}
                                                />
                                            ),
                                        },
                                        {
                                            key: "settings",
                                            label: "Cài đặt tài khoản",
                                            children: <AccountSettingsPanel user={profileData} onChanged={refetchUserLayout} />,
                                        },
                                        {
                                            key: "pro",
                                            label: (
                                                <Space>
                                                    Đăng ký Môi giới chuyên nghiệp
                                                    <span className="text-red-500 text-xs ml-1">Mới</span>
                                                </Space>
                                            ),
                                            children: <ProBrokerBlank />,
                                        },
                                    ]}
                                />
                            </div>

                            {/* Nút "Lưu thay đổi" */}
                            {activeTab === "edit" && (
                                <Affix offsetBottom={24}>
                                    <div className="w-full flex justify-end">
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<SaveOutlined />}
                                            loading={isLoading}
                                            onClick={() => document.getElementById("edit-info-submit")?.click()}
                                        >
                                            Lưu thay đổi
                                        </Button>
                                    </div>
                                </Affix>
                            )}
                        </>
                    ) : panel.view === "topup" ? (
                        // --- Panel Nạp tiền (TopUpForm) ---
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Title level={3} className="!m-0">
                                    Nạp tiền vào tài khoản
                                </Title>
                                <Button onClick={backToManage}>Quay lại quản lý</Button>
                            </div>
                            <TopUpForm
                                user={profileData}
                                onContinue={handleTopUpContinue} // Dùng handler đã cập nhật
                            />
                        </div>
                    ) : (
                        // --- Panel Thanh toán (Stripe) ---
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
                            <div className="flex items-center justify-between mb-4">
                                <Title level={3} className="!m-0">
                                    Thanh toán qua Thẻ
                                </Title>
                                <Button onClick={openTopUp}>Đổi phương thức khác</Button>
                            </div>
                            
                            {/* ⭐️ THAY ĐỔI: Truyền props mới vào StripeCheckout */}
                            <StripeCheckout
                                // Kịch bản Nạp tiền: Truyền 'clientSecret'
                                clientSecret={panel.data.clientSecret} 
                                // Props chung cho Inner
                                orderId={panel.data.orderId}
                                amount={panel.data.amount}
                                onPaid={handlePaymentSuccess}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Snackbar và Dialog */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <MuiAlert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: "100%" }}>
                    {alert.message}
                </MuiAlert>
            </Snackbar>

            <Dialog
                open={openSuccessDialog}
                onClose={closeSuccessDialog}
                aria-labelledby="update-success-title"
            >
                <DialogTitle id="update-success-title">Cập nhật thành công</DialogTitle>
                <DialogContent>
                    Thông tin tài khoản của bạn đã được lưu.
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeSuccessDialog} type="primary">
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}
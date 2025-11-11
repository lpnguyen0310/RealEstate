// src/pages/AccountManagement.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Tabs, Space, Typography, Button, Spin, message } from "antd";
import { SaveOutlined, ArrowLeftOutlined, CreditCardOutlined } from "@ant-design/icons";

import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import { useDispatch, useSelector } from "react-redux";
import { fetchMyProfile, updateMyProfileThunk, clearProfile } from "@/store/profileSlice";

import { getUploadSignature, uploadToCloudinary } from "@/api/cloudinary";

import AccountSummaryCard from "@/components/dashboard/usermanager/AccountSummaryCard";
import EditInfoForm from "@/components/dashboard/usermanager/account/EditInfoForm";
import AccountSettingsPanel from "@/components/dashboard/usermanager/account/AccountSettingsPanel";
import ProBrokerBlank from "@/components/dashboard/usermanager/account/ProBrokerBlank";
import TopUpForm from "@/components/payments/TopUpForm";
import StripeCheckout from "@/components/dashboard/purchagemangement/Checkout/StripeCheckout";

import { createTopUpIntent } from "@/api/paymentApi";

const { Title, Text } = Typography;

export default function AccountManagement() {
    const { refetchUser: refetchUserLayout } = useOutletContext() || {};
    const dispatch = useDispatch();
    const { data: profileData, status, error } = useSelector((s) => s.profile);
    const isLoading = status === "loading";

    const [searchParams, setSearchParams] = useSearchParams();

    // Snackbar
    const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
    const handleCloseAlert = (_, reason) => {
        if (reason === "clickaway") return;
        setAlert((s) => ({ ...s, open: false }));
    };

    // Dialog
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
    const closeSuccessDialog = () => setOpenSuccessDialog(false);

    useEffect(() => {
        if (status === "idle") dispatch(fetchMyProfile());
    }, [dispatch, status]);

    useEffect(() => () => dispatch(clearProfile()), [dispatch]);

    const [activeTab, setActiveTab] = useState("edit");
    const [panel, setPanel] = useState({ view: "manage", data: null });

    useEffect(() => {
        const action = searchParams.get("action");
        if (action === "topup") {
        setPanel({ view: "topup", data: null }); // Chuyển sang view nạp tiền

        // Xóa param khỏi URL để tránh bị "kẹt" khi F5 hoặc điều hướng
        searchParams.delete("action");
        setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const summary = useMemo(() => {
        const u = profileData;
        if (!u) return {};
        const username =
            u.fullName || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "Người dùng";
        return {
            username,
            points: u.points ?? 0,
            postBalance: u.mainBalance ?? 0,
            promoBalance: u.bonusBalance ?? 0,
            identityAccount: u.identityCode || `BDS${(u.id ?? "USER").toString().padStart(8, "0")}`,
            isNewIdentity: !u.identityCode,
        };
    }, [profileData]);

    const openTopUp = () => setPanel({ view: "topup", data: null });
    const backToManage = () => setPanel({ view: "manage", data: null });

    const handleSaveSubmit = (payload) =>
        dispatch(updateMyProfileThunk(payload))
            .unwrap()
            .then(() => setOpenSuccessDialog(true))
            .catch((err) => {
                setAlert({
                    open: true,
                    message: `Lưu thất bại: ${err?.message || "Lỗi không xác định."}`,
                    severity: "error",
                });
                throw err;
            });

    const handleAvatarUpload = async (file) => {
        if (!file) return;
        const key = "avatar-upload";
        message.loading({ content: "Đang tải ảnh lên...", key, duration: 0 });
        try {
            const sig = await getUploadSignature("avatars");
            const res = await uploadToCloudinary(file, sig);
            const url = res?.secure_url;
            if (!url) throw new Error("Không nhận được URL ảnh từ Cloudinary.");
            await dispatch(updateMyProfileThunk({ avatar: url })).unwrap();
            message.destroy(key);
            setAlert({ open: true, message: "Cập nhật avatar thành công!", severity: "success" });
        } catch (e) {
            message.destroy(key);
            setAlert({
                open: true,
                message: `Lỗi: ${e.message || "Không thể cập nhật avatar."}`,
                severity: "error",
            });
            throw e;
        }
    };

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

    const handleTopUpContinue = async (amount, method) => {
        if (method === "visa") {
            const key = "topup-create-order";
            try {
                message.loading({ content: "Đang tạo đơn nạp tiền...", key, duration: 0 });
                const paymentData = await createTopUpIntent(amount); // => { clientSecret, orderId }
                if (!paymentData?.clientSecret) throw new Error("Không thể tạo mã thanh toán từ server.");
                message.destroy(key);
                setPanel({
                    view: "stripe",
                    data: { clientSecret: paymentData.clientSecret, orderId: paymentData.orderId, amount },
                });
            } catch (e) {
                message.destroy(key);
                setAlert({
                    open: true,
                    message: `Lỗi: ${e.message || "Không thể khởi tạo thanh toán."}`,
                    severity: "error",
                });
            }
            return;
        }
        setAlert({
            open: true,
            message: `Tiếp tục nạp ${amount?.toLocaleString("vi-VN")}đ qua ${method}`,
            severity: "info",
        });
    };

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

    if (status === "loading" && !profileData) {
        return (
            <div className="w-full h-[420px] grid place-items-center">
                <Spin size="large" />
            </div>
        );
    }
    if (status === "failed" && !profileData) {
        return (
            <div className="w-full h-[420px] grid place-items-center text-red-500">
                Lỗi: Không thể tải thông tin tài khoản.
            </div>
        );
    }

    return (
        <section className="w-full">
            {/* Thêm md:items-start để 2 cột luôn căn đỉnh */}
            <div className="md:flex md:items-start md:gap-6 lg:gap-7">
                {/* LEFT – sticky theo cột trái */}
                <div className="md:w-[360px] md:shrink-0 md:pt-2 md:self-start md:sticky md:top-4">
                    <AccountSummaryCard
                        username={summary.username}
                        points={summary.points}
                        postBalance={summary.postBalance}
                        promoBalance={summary.promoBalance}
                        identityAccount={summary.identityAccount}
                        isNewIdentity={summary.isNewIdentity}
                        onTopUp={openTopUp}
                    />
                </div>

                {/* RIGHT */}
                <div className="md:flex-1 min-w-0">
                    {panel.view === "manage" ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                                <Title level={4} className="!m-0">Quản lý hồ sơ</Title>
                                <Text type="secondary">Cập nhật thông tin, cài đặt tài khoản và nâng cấp PRO</Text>
                            </div>

                            {/* Tắt scroll anchoring NGAY TẠI ĐÂY */}
                            <div className="p-3 md:p-4" style={{ overflowAnchor: "none" }}>
                                <Tabs
                                    destroyInactiveTabPane
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
                                            children: (
                                                <AccountSettingsPanel
                                                    user={profileData}
                                                    onChanged={refetchUserLayout}
                                                />
                                            ),
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

                                {/* Footer lưu thay đổi – sticky trong card, cũng tắt anchoring ở đây */}
                                {activeTab === "edit" && (
                                    <div className="sticky bottom-0 z-30" style={{ overflowAnchor: "none" }}>
                                        <div className="-mx-3 md:-mx-4 px-3 md:px-4 pb-3">
                                            <div className="bg-white/85 backdrop-blur rounded-xl border border-gray-200 shadow-lg p-2 flex justify-end">
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    icon={<SaveOutlined />}
                                                    loading={isLoading}
                                                    className="rounded-lg"
                                                    onClick={() => document.getElementById("edit-info-submit")?.click()}
                                                >
                                                    Lưu thay đổi
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : panel.view === "topup" ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="px-4 pt-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={backToManage}>
                                        Quay lại
                                    </Button>
                                    <Title level={4} className="!m-0">Nạp tiền vào tài khoản</Title>
                                </div>
                            </div>
                            <div className="p-3 md:p-4">
                                <TopUpForm user={profileData} onContinue={handleTopUpContinue} />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="px-4 pt-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={openTopUp}>
                                        Đổi phương thức
                                    </Button>
                                    <Title level={4} className="!m-0">Thanh toán qua Thẻ</Title>
                                </div>
                                <CreditCardOutlined className="text-gray-400" />
                            </div>
                            <div className="p-3 md:p-4">
                                <StripeCheckout
                                    clientSecret={panel.data.clientSecret}
                                    orderId={panel.data.orderId}
                                    amount={panel.data.amount}
                                    onPaid={handlePaymentSuccess}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications */}
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

            {/* Success dialog */}
            <Dialog open={openSuccessDialog} onClose={closeSuccessDialog} aria-labelledby="update-success-title">
                <DialogTitle id="update-success-title">Cập nhật thành công</DialogTitle>
                <DialogContent>Thông tin tài khoản của bạn đã được lưu.</DialogContent>
                <DialogActions>
                    <Button onClick={closeSuccessDialog} type="primary">Đóng</Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}

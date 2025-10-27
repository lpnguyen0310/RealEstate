import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
// Giữ lại các component Ant Design UI
import { Tabs, Space, Typography, Affix, Button, Spin } from "antd"; 
import { SaveOutlined } from "@ant-design/icons";

// 💡 IMPORT COMPONENTS VÀ HÀM CẦN THIẾT CỦA MUI 💡
import Snackbar from '@mui/material/Snackbar';
// Phải dùng Alert function từ MUI để hiển thị nội dung
import MuiAlert from '@mui/material/Alert'; 
// Giữ lại message Ant Design CHỈ cho mục đích quản lý loading key của Cloudinary (message.loading)
import { message } from "antd"; 

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

const { Title } = Typography;

export default function AccountManagement() {
  const { refetchUser: refetchUserLayout } = useOutletContext() || {};

  const dispatch = useDispatch();
  const { data: profileData, status, error } = useSelector((state) => state.profile);
  const isLoading = status === 'loading';

  // 💡 STATE QUẢN LÝ THÔNG BÁO CỦA MUI (Snackbar/Alert) 💡
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  
  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') return;
    setAlert({ ...alert, open: false });
  };

  // Gọi API lấy data khi vào trang
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMyProfile());
    }
  }, [dispatch, status]);

  // Reset status khi rời trang
  useEffect(() => {
    return () => {
      dispatch(clearProfile());
    };
  }, [dispatch]);

  // ... (logic summary giữ nguyên) ...
  const [activeTab, setActiveTab] = useState("edit");
  const [rightPanel, setRightPanel] = useState("manage");
  const summary = useMemo(() => {
     const user = profileData;
     if (!user) return {};
     const username = user.fullName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "Người dùng";
     const points = user.points ?? 0;
     const postBalance = user.wallet?.postBalance ?? 0;
     const promoBalance = user.wallet?.promoBalance ?? 0;
     const identityAccount = user.identityCode || `BDS${(user.id ?? "USER").toString().padStart(8, "0")}`;
     const isNewIdentity = !user.identityCode;
     return { username, points, postBalance, promoBalance, identityAccount, isNewIdentity };
  }, [profileData]);
  const openTopUp = () => setRightPanel("topup");
  const backToManage = () => setRightPanel("manage");


  // Hàm xử lý SUBMIT FORM (text)
  const handleSaveSubmit = (payload) => {
    // BẮT BUỘC return Promise của dispatch
    return dispatch(updateMyProfileThunk(payload))
      .unwrap()
      .then(() => {
        // ✅ CHỈ DÙNG setAlert MUI
        setAlert({ open: true, message: "Cập nhật thông tin thành công!", severity: 'success' });
      })
      .catch((err) => {
        // ✅ CHỈ DÙNG setAlert MUI
        const errorMessage = err?.message || 'Lỗi không xác định khi lưu.';
        setAlert({ open: true, message: `Lưu thất bại: ${errorMessage}`, severity: 'error' });
        
        throw err; 
      });
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;

    const uploadMessageKey = 'avatar-upload';
    message.loading({ content: 'Đang tải ảnh lên...', key: uploadMessageKey, duration: 0 }); 

    try {
      // 1 & 2. Lấy chữ ký & Upload Cloudinary
      const sig = await getUploadSignature("avatars");
      const cloudinaryResponse = await uploadToCloudinary(file, sig);
      const avatarUrl = cloudinaryResponse?.secure_url;

      if (!avatarUrl) {
        throw new Error("Không nhận được URL ảnh từ Cloudinary.");
      }

      await dispatch(updateMyProfileThunk({ avatar: avatarUrl })).unwrap();

      message.destroy(uploadMessageKey); 
      setAlert({ open: true, message: "Cập nhật avatar thành công!", severity: 'success' });

    } catch (error) {
      console.error("Lỗi upload avatar:", error);
      message.destroy(uploadMessageKey);
      setAlert({ 
        open: true, 
        message: `Lỗi: ${error.message || 'Không thể cập nhật avatar.'}`, 
        severity: 'error' 
      });
      throw error;
    }
  };

  // Lắng nghe kết quả từ Redux (chủ yếu để báo lỗi GET)
  useEffect(() => {
    if (status === 'failed' && !profileData) {
      setAlert({ // ✅ Dùng setAlert MUI
        open: true, 
        message: `Lỗi tải profile: ${error || 'Có lỗi xảy ra'}`, 
        severity: 'error' 
      });
      dispatch(clearProfile()); 
    }
  }, [status, error, dispatch, profileData]);

  if (status === 'loading' && !profileData) {
    return (
      <div className="w-full h-[400px] grid place-items-center">
        <Spin size="large" />
      </div>
    );
  }
  if (status === 'failed' && !profileData) {
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
          {rightPanel === "manage" ? (
            <>
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
                    } 
                  ]}
                />
              </div>

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
          ) : (
             // TOPUP MODE
             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
               <div className="flex items-center justify-between mb-2">
                 <Title level={3} className="!m-0">Nạp tiền vào tài khoản</Title>
                 <Button onClick={backToManage}>Quay lại quản lý</Button>
               </div>
               <TopUpForm
                 user={profileData}
                 onContinue={(amount, method) => {
                   // ✅ CHỈ DÙNG setAlert MUI 
                   setAlert({ 
                         open: true, 
                         message: `Tiếp tục nạp ${amount?.toLocaleString("vi-VN")}đ qua ${method}`, 
                         severity: 'info' 
                    });
                 }}
               />
             </div>
          )}
        </div>
      </div>
      {/* 💡 SNACKBAR/ALERT CỦA MUI 💡 */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          sx={{ width: '100%' }}
        >
          {alert.message}
        </MuiAlert>
      </Snackbar>
    </section>
  );
}
// src/services/profileService.js
import api from "../api/axios"; // Import file axios đã cấu hình của bạn

export const getMyProfile = async () => {
    try {
        // Bạn đã có interceptor tự động đính kèm token
        const response = await api.get("/v1/profile/me"); 
        
        // Trả về data (phần body của response)
        return response.data; 
    } catch (error) {
        console.error("Lỗi khi lấy profile:", error);
        throw error; 
    }
};

export const updateMyProfile = async (profileData) => {
    try {
        const response = await api.put("/v1/profile/me", profileData);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật profile:", error);
        throw error;
    }
};

import apiClient from '@/api/axios'; // Import instance axios đã cấu hình

export const fetchMyInventory = async () => {
  try {
    const response = await apiClient.get('/inventory/me');
    return response.data; // API sẽ trả về một mảng, ví dụ: [{ itemType: 'VIP', quantity: 5 }]
  } catch (error) {
    console.error("Lỗi khi tải kho đồ của người dùng:", error);
    throw error; // Ném lỗi ra để component có thể xử lý
  }
};
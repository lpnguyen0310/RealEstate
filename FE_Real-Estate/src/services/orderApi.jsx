// 1. Import 'api' từ file cấu hình axios của bạn, thay vì import 'axios'
import api from '@/api/axios';

export const createOrderApi = async (itemsPayload) => {
  
  const API_URL = '/orders/create';
  const response = await api.post(API_URL, { items: itemsPayload });

  return response.data.data;
};

export const getMyOrdersApi = async () => {
  const API_URL = '/orders/my-orders';
  try {
    const response = await api.get(API_URL);
    // API của bạn trả về dữ liệu trong response.data
    console.log("My Orders API Response:", response.data.data);
    return response.data; 
  } catch (error) {
    // Ném lỗi ra để component có thể bắt và xử lý
    throw error;
  }
};

export const getTransactionsForOrderApi = async (orderId) => {
  if (!orderId) return [];
  
  const API_URL = `/orders/${orderId}/transactions`;
  
  try {
    const response = await api.get(API_URL);
    return response.data.data || [];
  } catch (error) {
    console.error(`Failed to fetch transactions for order ${orderId}`, error);
    throw error;
  }
};

export const payOrderWithBalanceApi = async (orderId) => {
    if (!orderId) throw new Error("Thiếu orderId");
    const API_URL = `/orders/${orderId}/pay-with-balance`;

    try {
        // Gọi endpoint mới bằng api.post (tự động đính kèm token)
        // Backend trả về ApiResponse<OrderDTO>
        const response = await api.post(API_URL);

        // Kiểm tra cấu trúc ApiResponse và trả về data nếu thành công (code 200)
        if (response.data && response.data.code === 200 && response.data.data) {
            console.log(`[API] Pay with balance for order ${orderId} SUCCESS:`, response.data.data);
            return response.data.data; // Trả về OrderDTO
        } else {
            // Ném lỗi nếu cấu trúc ApiResponse không đúng hoặc code không phải 200
            console.error(`[API] Pay with balance for order ${orderId} FAILED (API Error):`, response.data);
            throw new Error(response.data?.message || `Lỗi không xác định khi thanh toán đơn hàng #${orderId}`);
        }
    } catch (err) {
        // Xử lý lỗi chuẩn của axios (bao gồm lỗi mạng, lỗi 4xx, 5xx từ ApiResponse.fail)
        const errorMessage = err.response?.data?.message || err.message || `Không thể thanh toán đơn hàng #${orderId} bằng số dư`;
        console.error(`[API] Pay with balance for order ${orderId} FAILED (Network/Server Error):`, err);
        throw new Error(errorMessage);
    }
}
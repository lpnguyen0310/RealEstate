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
// 1. Import 'api' từ file cấu hình axios của bạn, thay vì import 'axios'
import api from '@/api/axios';

export const createOrderApi = async (itemsPayload) => {
  
  const API_URL = '/orders/create';
  const response = await api.post(API_URL, { items: itemsPayload });

  return response.data.data;
};
// src/store/api/notificationApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import api from '@/api/axios'; // Import axios instance có sẵn của bạn

// ----------------------------------------------------
// (Mẹo) Tạo một hàm baseQuery "giả"
// để RTK Query dùng chung axios instance có sẵn của bạn
// (Giúp giữ lại logic refresh token của bạn)
// ----------------------------------------------------
const axiosBaseQuery = ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params }) => {
    try {
      const result = await api({
        url: baseUrl + url,
        method,
        data,
        params,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

// ----------------------------------------------------
// Tạo API service
// ----------------------------------------------------
export const notificationApi = createApi({
  reducerPath: 'notificationApi', // Tên reducer trong store
  baseQuery: axiosBaseQuery({
    baseUrl: '/notifications', // Base URL cho các endpoint dưới
  }),
  
  // ⭐️ Đây là phần "magic" để auto-refresh
  tagTypes: ['Notifications', 'UnreadCount'], 

  endpoints: (builder) => ({
    // 1. Query: Lấy danh sách thông báo
    getNotifications: builder.query({
      query: () => ({
        url: '', // Sẽ gọi GET /api/notifications
        method: 'GET',
      }),
      providesTags: (result = []) => [
...result.map(({ id }) => ({ type: 'Notifications', id })),
{ type: 'Notifications', id: 'LIST' },
],
    }),

    // 2. Query: Lấy số lượng chưa đọc
    getUnreadCount: builder.query({
      query: () => ({
        url: '/unread-count', // Sẽ gọi GET /api/notifications/unread-count
        method: 'GET',
      }),
      providesTags: ['UnreadCount'], // Đánh dấu: "Data này tên là UnreadCount"
    }),

    // 3. Mutation: Đánh dấu 1 cái đã đọc
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/mark-read/${id}`, // Sẽ gọi POST /api/notifications/mark-read/{id}
        method: 'POST',
      }),
      // ⭐️ Tự động refresh:
      // "Khi chạy xong, làm mới (refresh) data của 2 tag này"
      invalidatesTags: (result, error, id) => [
{ type: 'Notifications', id },
'UnreadCount',
],
    }),

    // 4. Mutation: Đánh dấu tất cả đã đọc
    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/mark-all-read', // Sẽ gọi POST /api/notifications/mark-all-read
        method: 'POST',
      }),
      // ⭐️ Tự động refresh:
      // "Khi chạy xong, làm mới (refresh) data của 2 tag này"
      invalidatesTags: [
{ type: 'Notifications', id: 'LIST' },
'UnreadCount',
],
    }),
  }),
});

// Export các hooks để dùng trong component (React sẽ dùng cái này)
export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;
import { createApi } from "@reduxjs/toolkit/query/react";
import { isAxiosError } from "axios";
import api from "@/api/axios"; // Import file api.js CỦA BẠN

// ======================================================
// PHẦN 1: BỘ CHUYỂN ĐỔI (AXIOS BASE QUERY)
// (Định nghĩa hàm helper này ngay tại đây)
// ======================================================
const axiosBaseQuery =
  ({ axiosInstance }) =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await axiosInstance({
        url: url, // baseURL đã có trong instance
        method,
        data,
        params,
        headers,
      });
      return { data: result.data }; // Trả về theo format của RTK Query
    } catch (axiosError) {
      if (!isAxiosError(axiosError)) {
        // Lỗi không xác định
        return {
          error: { status: 500, data: axiosError.message },
        };
      }
      
      // Lỗi từ axios (BE trả về)
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data || axiosError.message,
        },
      };
    }
  };

// ======================================================
// PHẦN 2: API SLICE CỦA BẠN (Định nghĩa API)
// ======================================================
export const reportApi = createApi({
  // Tên của slice
  reducerPath: "reportApi",

  // Sử dụng hàm 'axiosBaseQuery' và file 'api' của bạn
  baseQuery: axiosBaseQuery({
    axiosInstance: api,
  }),

  // Định nghĩa các endpoints
  endpoints: (builder) => ({
    
    /**
     * Tạo một báo cáo mới (Mutation)
     */
    createReport: builder.mutation({
      // 'body' là payload từ component ReportModal
      query: (body) => ({
        url: "/reports", // Sẽ gọi /api/reports (do baseURL của bạn)
        method: "POST",
        data: body,
      }),
      
      // (Tùy chọn: Sau này dùng để tự động refresh danh sách của Admin)
      // invalidatesTags: ['AdminReports'], 
    }),
    getReportsForPost: builder.query({
      // `postId` là ID của bài đăng
      query: (postId) => ({
        url: `/reports/post/${postId}`, // GET /api/reports/post/{postId}
        method: "GET",
      }),
      // Cung cấp tag "AdminReports"
      providesTags: (result, error, postId) => [{ type: "AdminReports", id: postId }],
    }),

    sendWarning: builder.mutation({
      // `arg` sẽ là { postId, message }
      query: ({ postId, message }) => ({
        url: `/reports/warn/post/${postId}`, // POST /api/reports/warn/post/{postId}
        method: "POST",
        data: { message }, // Gửi { "message": "..." } làm body
      }),
    }),

    dismissReports: builder.mutation({
      // `postId` là ID của bài đăng
      query: (postId) => ({
        url: `/reports/dismiss/post/${postId}`, // POST /api/reports/dismiss/post/{postId}
        method: "POST",
      }),
    }),

    deleteSelectedReports: builder.mutation({
      // arg là object: { postId: Long, reportIds: List<Long> }
      query: ({ postId, reportIds }) => ({
        // SỬ DỤNG METHOD: "DELETE"
        url: `/reports/delete-selected/post/${postId}`, 
        method: "DELETE",
        data: reportIds, // Gửi danh sách ID làm Body
      }),
      // Khi xóa report thành công, invalidate tag để tự động reload danh sách reports
      invalidatesTags: (result, error, { postId }) => [
        { type: "AdminReports", id: postId }
      ],
    }),

  }),
});

// Tự động tạo và export hook: useCreateReportMutation
export const { 
  useCreateReportMutation,
  useGetReportsForPostQuery,
  useLazyGetReportsForPostQuery,
  useDismissReportsMutation,
  useSendWarningMutation,
  useDeleteSelectedReportsMutation,
} = reportApi;
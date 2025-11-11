// Dùng để kết nối RTK Query với instance axios có sẵn của bạn
export const axiosBaseQuery =
  ({ axiosInstance }) =>
  async ({ url, method, data, params, headers }) => {
    console.log(">>> axiosBaseQuery ĐANG CHẠY VỚI:", { url, method });
    try {
      const result = await axiosInstance({
        url: url, // URL đã được axiosInstance cấu hình (baseURL)
        method,
        data,
        params,
        headers,
      });
      // RTK Query mong đợi { data: ... } khi thành công
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      // RTK Query mong đợi { error: ... } khi thất bại
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
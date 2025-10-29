import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createOrderApi, getMyOrdersApi, payOrderWithBalanceApi } from "@/services/orderApi";

import { notificationApi } from "@/services/notificationApi";

// AsyncThunk để xử lý việc gọi API tạo đơn hàng một cách bất đồng bộ
export const createOrder = createAsyncThunk(
  "orders/create",
  async (itemsPayload, { rejectWithValue, dispatch }) => {
    try {
      const newOrderData = await createOrderApi(itemsPayload);

      dispatch(
        notificationApi.util.invalidateTags(['UnreadCount', 'Notifications'])
      );

      return newOrderData; // Dữ liệu này sẽ là `action.payload` khi thành công
    } catch (error) {
      // Trả về lỗi để xử lý trong `rejected`
      // Ưu tiên lỗi từ server, nếu không có thì trả về message lỗi chung
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMy", // Đặt tên action type khác
  async (_, { rejectWithValue }) => { // Không cần payload nên dùng dấu "_"
    try {
      const response = await getMyOrdersApi();
      // API trả về { code, message, data, errors }, chúng ta cần mảng `data`
      console.log('Payload being sent to Reducer:', response.data);
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const payOrderByBalanceThunk = createAsyncThunk(
    'orders/payWithBalance', // Tên action type
    async (orderId, { rejectWithValue }) => {
        try {
            // Gọi hàm API đã tạo trong orderApi.js
            const paidOrderData = await payOrderWithBalanceApi(orderId);
            return paidOrderData; // Dữ liệu trả về khi thành công (OrderDTO)
        } catch (error) {
            // Trả về message lỗi khi thất bại
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
  myOrders: [],
  currentOrder: null, // Lưu thông tin đơn hàng vừa tạo thành công
  loading: false,
  error: null,

  payWithBalanceStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  payWithBalanceError: null,    // Lỗi riêng cho payWithBalance
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    // Reducer để xóa thông báo lỗi khi người dùng muốn thử lại
    clearOrderError: (state) => {
      state.error = null;
      state.payWithBalanceError = null;
    },
    // Reducer để reset toàn bộ state của order, ví dụ khi người dùng rời khỏi trang
    resetOrderState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentOrder = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload; // Lưu đơn hàng thành công vào state
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Tạo đơn hàng thất bại. Vui lòng thử lại.";
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders = action.payload; // Cập nhật danh sách đơn hàng vào state
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Tải lịch sử đơn hàng thất bại.";
      })
      .addCase(payOrderByBalanceThunk.pending, (state) => {
          state.payWithBalanceStatus = 'loading';
          state.payWithBalanceError = null;
          // Tùy chọn: Bạn có thể set loading = true nếu muốn nút bị disable
          // state.loading = true;
      })
      .addCase(payOrderByBalanceThunk.fulfilled, (state, action) => {
          state.payWithBalanceStatus = 'succeeded';
          // state.loading = false; // Tắt loading nếu đã bật ở pending
          console.log("Thanh toán bằng số dư thành công (Reducer):", action.payload);
          // Cập nhật lại đơn hàng trong myOrders nếu cần thiết
          const updatedOrder = action.payload;
          const index = state.myOrders.findIndex(order => order.id === updatedOrder.id); // Giả sử DTO có id
          if (index !== -1) {
              state.myOrders[index] = updatedOrder;
          }
          // Có thể cập nhật currentOrder nếu đang xem chi tiết đơn hàng đó
          if (state.currentOrder?.id === updatedOrder.id) {
              state.currentOrder = updatedOrder;
          }
      })
      .addCase(payOrderByBalanceThunk.rejected, (state, action) => {
          state.payWithBalanceStatus = 'failed';
          state.payWithBalanceError = action.payload; // Lưu message lỗi
          // state.loading = false; // Tắt loading nếu đã bật ở pending
      });
  },
});

export const { clearOrderError, resetOrderState } = orderSlice.actions;
export default orderSlice.reducer;
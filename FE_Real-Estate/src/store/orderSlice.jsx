import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createOrderApi, getMyOrdersApi } from "@/services/orderApi";

// AsyncThunk để xử lý việc gọi API tạo đơn hàng một cách bất đồng bộ
export const createOrder = createAsyncThunk(
  "orders/create",
  async (itemsPayload, { rejectWithValue }) => {
    try {
      const newOrderData = await createOrderApi(itemsPayload);
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
const initialState = {
  myOrders: [],
  currentOrder: null, // Lưu thông tin đơn hàng vừa tạo thành công
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    // Reducer để xóa thông báo lỗi khi người dùng muốn thử lại
    clearOrderError: (state) => {
      state.error = null;
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
      });
  },
});

export const { clearOrderError, resetOrderState } = orderSlice.actions;
export default orderSlice.reducer;
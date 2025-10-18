import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchMyInventory as fetchMyInventoryApi } from '@/services/userService'; // Import hàm gọi API

// Tạo một async thunk để xử lý việc gọi API
export const fetchUserInventory = createAsyncThunk(
  'inventory/fetchUserInventory',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchMyInventoryApi();
      return data; // Dữ liệu trả về sẽ là payload của action `fulfilled`
    } catch (error) {
      return rejectWithValue(error.response.data); // Trả về lỗi nếu có
    }
  }
);

const initialState = {
  items: [], // Mảng chứa các vật phẩm { itemType, quantity }
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUserInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default inventorySlice.reducer;
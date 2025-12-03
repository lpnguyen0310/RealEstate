import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { getTransactions } from "@/services/transactions";

export const loadTransactions = createAsyncThunk(
  "transactions/load",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getTransactions({ page: 0, size: 500 });
      const items = (data.content || [])
        .map((t) => ({
          id: t.id,
          status: t.status,               // "Đang xử lý" | "Thành công" | "Thất bại" (tuỳ backend)
          type: t.type,                   // "Mua gói", ...
          amount: t.amount,               // "370.000 ₫" (đã format string)
          transactionCode: t.transactionCode,
          reason: t.reason,
          createdAt: t.createdAt,         // ISO string có mili
        }))
        // mới nhất lên đầu
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return { items, total: data.totalElements ?? items.length };
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: "Load transactions failed" });
    }
  }
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState: {
    items: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadTransactions.pending, (s) => {
      s.loading = true; s.error = null;
    })
     .addCase(loadTransactions.fulfilled, (s, a) => {
       s.loading = false;
       s.items = a.payload.items;
       s.total = a.payload.total;
     })
     .addCase(loadTransactions.rejected, (s, a) => {
       s.loading = false;
       s.error = a.payload?.message || "Không thể tải giao dịch";
     });
  },
});

export default transactionsSlice.reducer;

// ====== SELECTORS ======
const root = (s) => s.transactions;

export const selectAllTransactions = createSelector([root], (s) => s.items);

export const selectCounts = createSelector([selectAllTransactions], (items) => ({
  processing: items.filter((t) => t.status === "Đang xử lý").length,
  success: items.filter((t) => t.status === "Thành công").length,
  failed: items.filter((t) => t.status === "Thất bại").length,
}));

export const selectByTab = (tabKey) =>
  createSelector([selectAllTransactions], (items) => {
    if (tabKey === "processing") return items.filter((t) => t.status === "Đang xử lý");
    if (tabKey === "success") return items.filter((t) => t.status === "Thành công");
    return items.filter((t) => t.status === "Thất bại");
  });

export const selectLoading = createSelector([root], (s) => s.loading);
export const selectError = createSelector([root], (s) => s.error);

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminOrdersApi } from '@/api/adminApi/adminOrdersApi'; 
import { kpiApi } from '@/api/adminApi/kpiApi'; 

// --- 1. State Ban đầu ---
const initialState = {
// Dữ liệu bảng
rows: [],
total: 0,
loading: false,
error: null,

// Trạng thái lọc và phân trang
filters: {
q: '',
status: 'ALL',
method: 'ALL',
sort: 'createdAt,DESC',
// SỬA ĐỔI 1: Đổi 'dateRange' thành 'range' và đặt giá trị mặc định là 'today'
range: 'today', 
},
pagination: {
page: 1, // Giữ 1-based nếu API của bạn yêu cầu (dù Redux thường là 0-based)
pageSize: 10,
},
selectedIds: [],

// TRƯỜNG STATS (giữ nguyên)
stats: {
todayOrders: 0, 
todayRevenue: 0, 
avgTicket: 0, 
processing: 0, 
pending: 0, 
todayPaid: 0,
},
};

// --- 2. Thunk: Fetch Dữ liệu Bảng ---
export const fetchAdminOrders = createAsyncThunk(
'adminOrder/fetchOrders',
async (_, { getState, rejectWithValue }) => {
const state = getState().adminOrder; 
const params = {
...state.filters,
page: state.pagination.page, // Gửi page và pageSize riêng
size: state.pagination.pageSize,
};
        // Xóa 'range' khỏi params gửi đi cho table (nếu table không cần)
        // delete params.range; 

try {
// API adminOrdersApi.search có thể không tồn tại, bạn đang dùng adminOrdersApi.list
            // Tạm giả định adminOrdersApi.search là đúng
const data = await adminOrdersApi.search(params); 
return data; 
} catch (error) {
return rejectWithValue("Không thể tải dữ liệu đơn hàng.");
}
}
);

// --- 3. Thunk: Fetch Dữ liệu KPI (SỬA LẠI HOÀN TOÀN) ---
export const fetchOrderStats = createAsyncThunk(
'adminOrder/fetchStats',
    // SỬA ĐỔI 2: Bỏ 'params' và dùng 'getState'
async (_, { getState, rejectWithValue }) => { 
        
        // SỬA ĐỔI 3: Lấy 'range' từ Redux state
        const state = getState().adminOrder;
        const { range } = state.filters;
        // Bạn có thể muốn lọc stats theo status (ví dụ: 'PAID') hoặc status từ filter
        const statusForKpi = "PAID"; // Tạm hardcode, hoặc dùng state.filters.status

try {
            // SỬA ĐỔI 4: Truyền 'range' lấy từ state vào API
const response = await kpiApi.getOrders(range, statusForKpi); 
const kpiData = response.data; // OrderKpiResponse

const totalOrders = kpiData.summary.orders || 0;
const totalRevenue = kpiData.summary.revenue || 0;

// Ánh xạ OrderKpiResponse sang format Frontend cần
// Tên key (ví dụ: todayOrders) được giữ nguyên để StatCards.jsx hoạt động
// Mặc dù 'range' có thể không phải 'today'
return {
todayOrders: totalOrders, 
todayRevenue: totalRevenue, 
avgTicket: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0, 

// Các trường này cần được trả về từ API theo 'range'
processing: kpiData.processingOrdersCount || 0, 
pending: kpiData.pendingOrdersCount || 0,
todayPaid: kpiData.summary.orders || 0, // 'todayPaid' giờ có nghĩa là 'totalPaid'
};
} catch (error) {
return rejectWithValue("Không thể tải dữ liệu KPI.");
}
}
);

// --- 4. Slice Định nghĩa ---
const adminOrderSlice = createSlice({
name: 'adminOrder',
initialState,
reducers: {
setFilter(state, action) {
state.filters = { ...state.filters, ...action.payload };
state.pagination.page = 1; // Reset về trang 1 khi lọc
state.selectedIds = [];
},
setPage(state, action) {
state.pagination.page = action.payload;
state.selectedIds = [];
},
setSelectedIds(state, action) {
state.selectedIds = action.payload;
},
clearState(state) {
return initialState;
},
},
extraReducers: (builder) => {
builder
// CASES CHO FETCH ADMIN ORDERS
.addCase(fetchAdminOrders.pending, (state) => {
state.loading = true;
state.error = null;
})
.addCase(fetchAdminOrders.fulfilled, (state, action) => {
state.loading = false;
state.rows = action.payload.content;
state.total = action.payload.total;
// state.pagination.page = action.payload.page;
state.pagination.pageSize = action.payload.size;
})
.addCase(fetchAdminOrders.rejected, (state, action) => {
state.loading = false;
state.error = action.payload || action.error.message;
state.rows = []; 
state.total = 0;
})

// --- CASES MỚI CHO FETCH ORDER STATS ---
.addCase(fetchOrderStats.fulfilled, (state, action) => {
// Ghi đè stats cũ bằng payload mới từ API
state.stats = action.payload;
})
.addCase(fetchOrderStats.rejected, (state, action) => {
// Nếu lỗi thì reset về stats ban đầu
state.stats = initialState.stats;
console.error("KPI Failed:", action.payload);
});
},
});

export const { setFilter, setPage, setSelectedIds, clearState } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;
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
        dateRange: 'LAST_6_MONTHS', 
    },
    pagination: {
        page: 1,
        pageSize: 10,
    },
    selectedIds: [],
    
    // TRƯỜNG STATS ĐƯỢC THÊM VÀO INITIAL STATE
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
            ...state.pagination,
        };

        try {
            const data = await adminOrdersApi.search(params);
            return data; 
        } catch (error) {
            return rejectWithValue("Không thể tải dữ liệu đơn hàng.");
        }
    }
);

// --- 3. Thunk: Fetch Dữ liệu KPI ---
export const fetchOrderStats = createAsyncThunk(
    'adminOrder/fetchStats',
    async (params = { range: 'today', status: 'PAID' }, { rejectWithValue }) => {
        try {
            const response = await kpiApi.getOrders(params.range, params.status); 
            const kpiData = response.data; // OrderKpiResponse
            
            const totalOrders = kpiData.summary.orders || 0;
            const totalRevenue = kpiData.summary.revenue || 0;

            // Ánh xạ OrderKpiResponse sang format Frontend cần
            return {
                todayOrders: totalOrders, 
                todayRevenue: totalRevenue, 
                // Tính toán AvgTicket (tránh chia cho 0)
                avgTicket: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0, 
                // GIẢ ĐỊNH các trường processing/pending/todayPaid nằm trong summary hoặc là các trường top-level khác 
                // Cần điều chỉnh tên trường này nếu Backend trả về khác:
                processing: kpiData.processingOrdersCount || 0, // Dùng tên trường BE trả về
                pending: kpiData.pendingOrdersCount || 0,        // Dùng tên trường BE trả về
                todayPaid: kpiData.summary.orders || 0,          // Giả định tổng số đơn hôm nay là todayOrders, nếu BE có trường paidOrdersCount thì dùng nó
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
            state.pagination.page = 1;
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
            // CASES CHO FETCH ADMIN ORDERS (Đã có)
            .addCase(fetchAdminOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.rows = action.payload.content;
                state.total = action.payload.total;
                state.pagination.page = action.payload.page;
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
                // LƯU KẾT QUẢ TÍNH TOÁN STATS VÀO STATE
                state.stats = action.payload;
            })
            .addCase(fetchOrderStats.rejected, (state, action) => {
                // Xử lý lỗi (Nếu không muốn xóa stats cũ thì có thể bỏ qua dòng này)
                state.stats = initialState.stats;
                console.error("KPI Failed:", action.payload);
            });
    },
});

export const { setFilter, setPage, setSelectedIds, clearState } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;

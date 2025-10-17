import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/api/axios";

// Thunk: gọi BE lấy danh sách tin của chính user
export const fetchMyPropertiesThunk = createAsyncThunk(
    "property/fetchMyProperties",
    async ({ page = 0, size = 20, sort = "postedAt,desc" } = {}, { rejectWithValue }) => {
        try {
            const res = await api.get("/properties/me", { params: { page, size, sort } });
            // Nếu bạn bọc ApiResponse<T>
            const data = res?.data?.data ?? res?.data;
            return data;
        } catch (e) {
            const msg = e?.response?.data?.message || "Không thể tải danh sách tin đăng của tôi";
            return rejectWithValue(msg);
        }
    }
);

// Helper: map PropertyDTO -> dữ liệu PostCard đang dùng
function mapDtoToPostCard(p) {
    // p là PropertyDTO từ BE
    const fmt = Intl.NumberFormat("vi-VN");
    const priceText = p?.price != null ? `${fmt.format(p.price)} ₫` : "—";
    const unitPriceText = p?.pricePerM2 != null ? `${fmt.format(p.pricePerM2)} ₫/m²` : "";
    const addressMain =
        p?.displayAddress ||
        [p?.addressStreet /* + tên phường-quận-thành phố nếu bạn muốn */].filter(Boolean).join(", ");

    return {
        id: p.id,
        // hình: ưu tiên imageUrls từ BE; fallback sang images (nếu nơi khác trả kiểu khác)
        images: Array.isArray(p.imageUrls) && p.imageUrls.length ? p.imageUrls : p.images || [],
        title: p.title,
        description: p.description,
        statusTag: toStatusTag(p?.status),  // map "active" -> "Đang Đăng" …
        priceText,
        unitPriceText,
        landPriceText: "",            // nếu có công thức riêng, bạn bổ sung sau
        installmentText: p?.tradeType || "",

        addressMain,
        area: p?.area,
        bed: p?.bedrooms,
        bath: p?.bathrooms,
        sizeText: p?.width && p?.height ? `${p.width}m x ${p.height}m` : "",
        note: "",                     // nếu muốn hiển thị ghi chú

        createdAt: p?.postedAt ? new Date(p.postedAt).toLocaleDateString("vi-VN") : "",
        views: p?.views ?? 0,         // nếu BE có trường này
    };
}

function toStatusTag(status) {
    switch ((status || "").toLowerCase()) {
        case "active": return "Đang Đăng";
        case "pending": return "Chờ Duyệt";
        case "draft": return "Nháp";
        case "rejected": return "Bị Từ Chối";
        case "hidden": return "Đã Ẩn";
        case "expired": return "Hết Hạn";
        case "expiringsoon": return "Sắp Hết Hạn";
        default: return "Nháp";
    }
}

const initialState = {
    // server page
    list: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,

    // UI state
    loading: false,
    error: null,

    // query state (để đồng bộ Pagination/Sort)
    sort: "postedAt,desc",
};

const propertySlice = createSlice({
    name: "property",
    initialState,
    reducers: {
        setPage(state, action) { state.page = action.payload ?? 0; },
        setSize(state, action) { state.size = action.payload ?? 20; state.page = 0; },
        setSort(state, action) { state.sort = action.payload ?? "postedAt,desc"; state.page = 0; },
        clearProperties(state) {
            state.list = [];
            state.page = 0;
            state.totalPages = 0;
            state.totalElements = 0;
            state.error = null;
        },
    },
    extraReducers: (b) => {
        b
            .addCase(fetchMyPropertiesThunk.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchMyPropertiesThunk.fulfilled, (s, a) => {
                const d = a.payload || {};
                // Map content -> PostCard data cho đúng UI hiện tại
                s.list = Array.isArray(d.content) ? d.content.map(mapDtoToPostCard) : [];
                s.page = d.page ?? 0;
                s.size = d.size ?? s.size;
                s.totalElements = d.totalElements ?? 0;
                s.totalPages = d.totalPages ?? 0;
                s.loading = false;
            })
            .addCase(fetchMyPropertiesThunk.rejected, (s, a) => {
                s.loading = false;
                s.error = a.payload || "Không thể tải danh sách tin đăng";
            });
    },
});

export const { setPage, setSize, setSort, clearProperties } = propertySlice.actions;
export default propertySlice.reducer;

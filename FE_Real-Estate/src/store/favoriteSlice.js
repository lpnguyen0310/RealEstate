import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { favoriteApi } from "@/api/favoriteApi";

const STORAGE_KEY = "bds_favorites_v1";

/* ============ Helpers ============ */
function loadLS() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { list: [], ids: [] };
        const list = JSON.parse(raw) || [];
        return { list, ids: list.map(x => x.id) };
    } catch {
        return { list: [], ids: [] };
    }
}
function saveLS(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { }
}
function timeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - Number(ts);
    const m = Math.floor(diff / 60000);
    if (m <= 0) return "Vừa lưu";
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `${d} ngày trước`;
}

/* ============ Thunks ============ */
// Lấy danh sách id đã lưu từ server → hợp nhất với local
export const hydrateFavorites = createAsyncThunk(
"favorite/hydrate",
async (_, { getState, rejectWithValue }) => { // Thêm getState
try {
            // Lấy IDs từ local (đã tải khi khởi tạo slice)
            const localIds = selectIds(getState()); 
            
const serverIds = await favoriteApi.getIds(); // [1, 2, 3]
            
            // Hợp nhất IDs từ server và local
            const mergedIds = Array.from(new Set([...localIds, ...(serverIds || [])]));

            // Gọi API mới để lấy chi tiết đầy đủ cho tất cả IDs
            if (mergedIds.length === 0) {
                 return { details: [] };
            }
            
            const details = await favoriteApi.getDetails(mergedIds); // Trả về [{id, title, ...}]

return { details }; // Trả về chi tiết thay vì chỉ IDs

} catch (e) {
// Nếu lỗi (chưa đăng nhập/mất mạng), trả về null details để không ảnh hưởng list local
            console.error("Hydration failed (network error or not logged in):", e);
return { details: null }; 
}
}
);

// Toggle có gọi API (optimistic + rollback)
export const toggleFavorite = createAsyncThunk(
    "favorite/toggleFavorite",
    async ({ id, payload }, { dispatch, getState, rejectWithValue }) => {
        // Optimistic
        dispatch(toggleLocal(payload?.id ? payload : { id }));
        try {
            await favoriteApi.toggle(id);
            return { ok: true, id };
        } catch (e) {
            // rollback
            dispatch(toggleLocal({ id }));
            return rejectWithValue({ id, message: "toggle failed" });
        }
    }
);

/* ============ Slice ============ */
const initial = loadLS();

const favoriteSlice = createSlice({
    name: "favorite",
    initialState: {
        list: initial.list, // [{id,...,savedAt}]
        ids: initial.ids,   // [1,2,3]
    },
    reducers: {
        // Toggle local (không gọi API) – dùng cho optimistic/rollback
        toggleLocal(state, { payload }) {
            const id = payload?.id;
            if (!id) return;
            const i = state.ids.indexOf(id);

            if (i >= 0) {
                state.ids.splice(i, 1);
                state.list = state.list.filter(x => x.id !== id);
            } else {

                const thumbUrl = (
                    (payload.imageUrls && payload.imageUrls.length > 0) 
                    ? payload.imageUrls[0] 
                    : (payload.thumb ?? payload.image ?? "")
                );

                const entry = {
                    id,
                    title: payload.title ?? "",
                    // SỬA: Dùng logic lấy ảnh đã cải tiến
                    thumb: thumbUrl, 
                    // thumb: payload.thumb ?? payload.image ?? "", // Dòng cũ
                    href: payload.href ?? `/real-estate/${id}`,
                    price: payload.price ?? null,
                    priceDisplay: payload.priceDisplay ?? "",
                    displayAddress: payload.displayAddress ?? payload.address ?? "",
                    pricePerM2: payload.pricePerM2 ?? "",
                    area: payload.area ?? null,
                    bed: payload.bed ?? null,
                    bath: payload.bath ?? null,
                    photos: payload.photos ?? 0,
                    postedAt: payload.postedAt ?? "",
                    listingType: payload.listingType ?? "",
                    savedAt: Date.now(),
                };
                state.ids.unshift(id);
                state.list.unshift(entry);
            }
            saveLS(state.list);
        },
        clearAll(state) {
            state.ids = [];
            state.list = [];
            saveLS([]);
        },
        // (tuỳ chọn) setList khi bạn fetch chi tiết hàng loạt
        setList(state, { payload }) {
            const list = Array.isArray(payload) ? payload : [];
            state.list = list;
            state.ids = list.map(x => x.id);
            saveLS(list);
        },
    },
    extraReducers: (b) => {
b.addCase(hydrateFavorites.fulfilled, (state, { payload }) => {
const details = payload?.details;
if (Array.isArray(details)) {
const existingMap = new Map(state.list.map(x => [x.id, x]));
const mergedList = details.map(d => ({
                    ...d,
                    thumb: (d.imageUrls && d.imageUrls.length > 0) ? d.imageUrls[0] : (existingMap.get(d.id)?.thumb ?? ""),
                    href: `/real-estate/${d.id}`, 
savedAt: existingMap.get(d.id)?.savedAt ?? Date.now(),
                }));
state.list = mergedList.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
state.ids = state.list.map(x => x.id);
saveLS(state.list);
}
});
    }
});

export const { toggleLocal, clearAll, setList } = favoriteSlice.actions;

/* ============ Selectors ============ */
const self = (s) => s.favorite;

export const selectIds = createSelector(self, s => s.ids);

export const selectList = createSelector(self, s =>
    (s.list || []).map(x => ({ ...x, savedAgo: timeAgo(x.savedAt) }))
);

// Factory selector cho từng id (tránh rerender thừa)
export const makeSelectIsSaved = (id) =>
    createSelector(selectIds, (ids) => ids.includes(id));

export default favoriteSlice.reducer;
// src/store/propertySlice.js
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import api from "@/api/axios";
import { uploadMany } from "@/api/cloudinary";

/* ===================== THUNKS ===================== */

// Lấy danh sách public (trang chủ / tìm kiếm)
export const fetchPropertiesThunk = createAsyncThunk(
    "property/fetchAll",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await api.get("/properties", { params });
            return res?.data?.data ?? res?.data;
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Không thể tải danh sách tin đăng");
        }
    }
);

// Lấy chi tiết 1 tin
export const fetchPropertyByIdThunk = createAsyncThunk(
    "property/fetchById",
    async (propertyId, { rejectWithValue }) => {
        try {
            const res = await api.get(`/properties/${propertyId}`);
            return res?.data?.data ?? res?.data;
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Không thể tải chi tiết tin đăng");
        }
    }
);

export const fetchPropertyFavoritesThunk = createAsyncThunk(
    "property/fetchFavorites",
    /**
     * @param {number | string} propertyId ID của tin đăng
     */
    async (propertyId, { rejectWithValue }) => {
        try {
            // API bạn vừa tạo: GET /api/properties/{id}/favorites
            const res = await api.get(`/properties/${propertyId}/favorites`);
            // API trả về List<UserFavoriteDTO>
            return res.data; 
        } catch (e) {
            const msg = e?.response?.data?.message || "Không thể tải danh sách người yêu thích";
            return rejectWithValue(msg);
        }
    }
);

// Tạo tin
export const createPropertyThunk = createAsyncThunk(
    "property/create",
    /**
     * @param {{ formData: any, listingTypePolicyId: number|null }} arg
     */
    async ({ formData, listingTypePolicyId }, { rejectWithValue }) => {
        try {
            // 1) Ảnh: tách file & URL
            const imgs = formData.images || [];
            const files = imgs.filter((x) => x instanceof File || x instanceof Blob);
            const existedUrls = imgs.filter((x) => typeof x === "string" && x.startsWith("http"));

            // 2) Upload file lên Cloudinary
            const uploaded = files.length ? await uploadMany(files, "properties") : [];
            const uploadedUrls = uploaded.map((x) => x.secure_url);
            const imageUrls = [...existedUrls, ...uploadedUrls];

            // 3) Build payload
            const payload = {
                title: formData.title,
                price: Number(formData.price) || 0,
                area: Number(formData.usableArea || formData.landArea) || 0,
                bedrooms: formData.bedrooms ?? 0,
                bathrooms: formData.bathrooms ?? 0,
                addressStreet: formData.streetName || "",
                propertyType: formData.propertyType || "sell",
                priceType: formData.priceType || "SELL_PRICE",
                status: "PENDING_REVIEW",

                legalStatus: formData.legalDocument || "",
                direction: formData.houseDirection || "",
                description: formData.description || "",

                floors: Number(formData.floors) || null,
                position: formData.position || "",
                displayAddress: formData.displayAddress || formData.suggestedAddress || "",

                landArea: Number(formData.landArea) || null,
                width: Number(formData.width) || null,
                height: Number(formData.length) || null,

                categoryId: formData.categoryId || null,
                wardId: formData.wardId || null,
                districtId: formData.districtId || null,
                cityId: formData.provinceId || null,

                listingTypePolicyId: listingTypePolicyId ?? formData.listingTypePolicyId,
                imageUrls,
                amenityIds: formData.amenityIds || [],
            };

            const res = await api.post("/properties/create", payload);
            return res?.data?.data ?? res?.data;
        } catch (e) {
            const msg = e?.response?.data?.message || "Đăng tin thất bại";
            return rejectWithValue(msg);
        }
    }
);

// Lấy danh sách tin của chính user (dashboard)
export const fetchMyPropertiesThunk = createAsyncThunk(
    "property/fetchMyProperties",
    async ({ page = 0, size = 20, sort = "postedAt,desc", status } = {}, { rejectWithValue }) => {
        try {
            const params = { page, size, sort };
            if (status) params.status = status;
            const res = await api.get("/properties/me", { params });
            return res.data;
        } catch (e) {
            const msg = e?.response?.data?.message || "Không thể tải danh sách tin đăng của tôi";
            return rejectWithValue(msg);
        }
    }
);

// +++ THUNK MỚI: LẤY SỐ ĐẾM +++
export const fetchMyPropertyCountsThunk = createAsyncThunk(
    "property/fetchMyCounts",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/properties/my-counts");
            return res.data; // API trả về Map<String, Long> { active: 1, pending: 9, ... }
        } catch {
            return rejectWithValue("Không thể tải số đếm tin đăng");
        }
    }
);

/* ===================== DATE UTILS ===================== */

const MS_DAY = 24 * 60 * 60 * 1000;

function parseToDate(x) {
    if (!x) return null;
    try {
        if (typeof x === "number") return new Date(x);
        if (typeof x === "string") {
            let s = x.replace(" ", "T");
            if (!/Z|[+-]\d{2}:\d{2}$/.test(s)) s += "Z";
            const t = Date.parse(s);
            return Number.isNaN(t) ? null : new Date(t);
        }
        if (typeof x === "object" && "year" in x && "month" in x && "day" in x) {
            const { year, month, day, hour = 0, minute = 0, second = 0, nano = 0 } = x;
            return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1e6));
        }
        return null;
    } catch {
        return null;
    }
}

// Quy ước: "Sắp hết hạn" nếu còn ≤ 3 ngày
const EXP_SOON_DAYS = 3;
function isExpiringSoon(post) {
    const now = Date.now();
    let exp = parseToDate(post?.expiresAt)?.getTime() ?? null;
    if (!exp && post?.postedAt && post?.durationDays) {
        const start = parseToDate(post.postedAt)?.getTime();
        if (start && post.durationDays) exp = start + post.durationDays * MS_DAY;
    }
    if (!exp) return false;
    const diff = exp - now;
    return diff > 0 && diff <= EXP_SOON_DAYS * MS_DAY;
}

/* ===================== MAPPERS ===================== */

// Map DTO (BE -> UI Card) cho MY LIST (dashboard)
function toStatusTag(status) {
    const s = (status ?? "").toString().trim().toUpperCase();
    switch (s) {
        case "PUBLISHED": return "Đang Đăng";
        case "PENDING_REVIEW": return "Chờ Duyệt";
        case "DRAFT": return "Nháp";
        case "REJECTED": return "Bị Từ Chối";
        case "HIDDEN": return "Đã Ẩn";
        case "EXPIRED": return "Hết Hạn";
        case "EXPIRINGSOON": return "Sắp Hết Hạn";
        case "ARCHIVED": return "Đã Lưu Trữ";
        default: return "Nháp";
    }
}
function statusEnumToKey(status) {
    const s = (status ?? "").toString().trim().toUpperCase();
    switch (s) {
        case "PUBLISHED": return "active";
        case "PENDING_REVIEW": return "pending";
        case "DRAFT": return "draft";
        case "REJECTED": return "rejected";
        case "HIDDEN": return "hidden";
        case "EXPIRED": return "expired";
        case "EXPIRINGSOON": return "expiringSoon";
        case "ARCHIVED": return "hidden";
        default: return "draft";
    }
}

function mapDtoToPostCard(p) {
    const fmt = Intl.NumberFormat("vi-VN");
    const priceText = p?.price != null ? `${fmt.format(p.price)} ₫` : "—";
    const unitPriceText = p?.pricePerM2 != null ? `${fmt.format(p.pricePerM2)} ₫/m²` : "";
    const addressMain = p?.displayAddress || [p?.addressStreet].filter(Boolean).join(", ");

    return {
        id: p.id,
        images: Array.isArray(p.imageUrls) && p.imageUrls.length ? p.imageUrls : p.images || [],
        title: p.title,
        description: p.description,
        statusTag: toStatusTag(p?.status),
        priceText,
        unitPriceText,
        landPriceText: "",
        installmentText: p?.propertyType === "sell" ? "Mua bán" : p?.propertyType === "rent" ? "Cho thuê" : "",
        statusKey: statusEnumToKey(p?.status),

        addressMain,
        area: p?.area,
        bed: p?.bedrooms,
        bath: p?.bathrooms,
        sizeText: p?.width && p?.height ? `${p.width}m x ${p.height}m` : "",
        note: "",

        createdAt: p?.postedAt ? new Date(p.postedAt).toLocaleDateString("vi-VN") : "",
        views: p?.viewCount ?? 0, 
        favoriteCount: p?.favoriteCount ?? 0,

        // raw fields cho thống kê
        listingType: p?.listingType,           // "PREMIUM" | "VIP" | "NORMAL" | ...
        postedAt: p?.postedAt ?? null,
        expiresAt: p?.expiresAt ?? null,
        durationDays: p?.durationDays ?? null,
        actualDurationDays: p?.actualDurationDays ?? null,
    };
}

// Map cho PUBLIC LIST (trang public)
function mapPublicPropertyToCard(p) {
    if (!p) return {};
    return {
        id: p.id,
        image: p.image,
        images: Array.isArray(p.images) ? p.images : [],
        title: p.title,
        description: p.description,

        price: p.price,
        pricePerM2: p.pricePerM2,
        postedAt: p.postedAt,
        photos: p.photos,

        addressMain: p.addressFull || p.addressShort || "",
        addressShort: p.addressShort || "",
        addressFull: p.addressFull || "",

        area: p.area,
        bed: p.bed,
        bath: p.bath,

        agent: p.agent,
        type: p.type,
        category: p.category,

        listingType: p.listing_type, // chú ý tên field public
    };
}

/* ===================== SLICE ===================== */

const initialState = {
    // Public page
    list: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,

    // My dashboard list
    myList: [],
    myPage: 0,
    mySize: 20,
    myTotalElements: 0,
    myTotalPages: 0,

    // UI state
    loading: false,
    error: null,

    currentProperty: null,
    loadingDetail: false,
    errorDetail: null,

    counts: {            // <<— chỉ còn 1 lần
        active: 0,
        pending: 0,
        draft: 0,
        rejected: 0,
        hidden: 0,
        expired: 0,
        expiringSoon: 0,
    },
    loadingCounts: false,

    // query state
    sort: "postedAt,desc",
    creating: false,
    createError: null,
    lastCreated: null,

    //STATE CHO MODAL FAVORITES
    loadingFavorites: false,
    errorFavorites: null,
    currentFavoriteUsers: [],
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
            state.lastCreated = null;
            state.createError = null;
            state.creating = false;

            state.myList = [];
            state.myPage = 0;
            state.mySize = 20;
            state.myTotalElements = 0;
            state.myTotalPages = 0;
        },
        clearCurrentProperty(state) {
            state.currentProperty = null;
            state.errorDetail = null;
        },
        clearFavorites(state) {
            state.currentFavoriteUsers = [];
            state.errorFavorites = null;
            state.loadingFavorites = false;
        },
    },
    extraReducers: (b) => {
        b
            // ===== tạo tin =====
            .addCase(createPropertyThunk.pending, (s) => {
                s.creating = true;
                s.createError = null;
            })
            .addCase(createPropertyThunk.fulfilled, (s, a) => {
                s.creating = false;
                s.lastCreated = a.payload || null;
            })
            .addCase(createPropertyThunk.rejected, (s, a) => {
                s.creating = false;
                s.createError = a.payload || "Đăng tin thất bại";
            })

            // ===== MY LIST (dashboard) =====
            .addCase(fetchMyPropertiesThunk.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchMyPropertiesThunk.fulfilled, (s, a) => {
                const d = a.payload || {};
                s.myList = Array.isArray(d.content) ? d.content.map(mapDtoToPostCard) : [];
                s.myPage = d.page ?? d.number ?? 0;
                s.mySize = d.size ?? s.mySize;
                s.myTotalElements = d.totalElements ?? 0;
                s.myTotalPages = d.totalPages ?? 0;
                s.loading = false;
            })
            .addCase(fetchMyPropertiesThunk.rejected, (s, a) => {
                s.loading = false;
                s.error = a.payload || "Không thể tải danh sách tin đăng của tôi";
            })

            // ===== PUBLIC LIST =====
            .addCase(fetchPropertiesThunk.pending, (s) => {
                s.loading = true;
                s.error = null;
            })
            .addCase(fetchPropertiesThunk.fulfilled, (s, a) => {
                const pageData = a.payload || {};
                const propertiesArray = pageData.content || [];
                const sortOrder = { PREMIUM: 1, VIP: 2, NORMAL: 3 };
                const DEFAULT_SORT_VALUE = 99;

                const mappedAndSortedList = (Array.isArray(propertiesArray) ? propertiesArray.map(mapPublicPropertyToCard) : [])
                    .sort((itemA, itemB) => {
                        const valueA = sortOrder[itemA.listingType?.toUpperCase()] || DEFAULT_SORT_VALUE;
                        const valueB = sortOrder[itemB.listingType?.toUpperCase()] || DEFAULT_SORT_VALUE;
                        return valueA - valueB;
                    });

                s.list = mappedAndSortedList;
                s.page = pageData.number ?? 0;
                s.size = pageData.size ?? 20;
                s.totalElements = pageData.totalElements ?? 0;
                s.totalPages = pageData.totalPages ?? 0;

                s.loading = false;
                s.error = null;
            })
            .addCase(fetchPropertiesThunk.rejected, (s, a) => {
                s.loading = false;
                s.error = a.payload || "Không thể tải danh sách tin đăng";
            })

            // ===== DETAIL =====
            .addCase(fetchPropertyByIdThunk.pending, (state) => {
                state.loadingDetail = true;
                state.errorDetail = null;
                state.currentProperty = null;
            })
            .addCase(fetchPropertyByIdThunk.fulfilled, (state, action) => {
                state.loadingDetail = false;
                state.currentProperty = action.payload;
            })
            .addCase(fetchPropertyByIdThunk.rejected, (state, action) => {
                state.loadingDetail = false;
                state.errorDetail = action.payload;
            })

            // ===== COUNTS =====
            .addCase(fetchMyPropertyCountsThunk.pending, (state) => {
                state.loadingCounts = true;
            })
            .addCase(fetchMyPropertyCountsThunk.fulfilled, (state, action) => {
                state.loadingCounts = false;
                state.counts = { ...initialState.counts, ...(action.payload || {}) };
            })
            .addCase(fetchMyPropertyCountsThunk.rejected, (state) => {
                state.loadingCounts = false;
                state.counts = { ...initialState.counts };
            })
            // ===== FAVORITES =====
            .addCase(fetchPropertyFavoritesThunk.pending, (state) => {
                state.loadingFavorites = true;
                state.errorFavorites = null;
                state.currentFavoriteUsers = [];
            })
            .addCase(fetchPropertyFavoritesThunk.fulfilled, (state, action) => {
                state.loadingFavorites = false;
                state.currentFavoriteUsers = action.payload; // Gán List<UserFavoriteDTO>
            })
            .addCase(fetchPropertyFavoritesThunk.rejected, (state, action) => {
                state.loadingFavorites = false;
                state.errorFavorites = action.payload;
            });
    },
});

/* ===================== SELECTORS ===================== */

const selectPropertyState = (s) => s.property;

// Dùng cho Dashboard (my list)
export const selectMyPosts = createSelector(
    selectPropertyState,
    (st) => st.myList || []
);

// Tính thống kê cho PostsReportCard
export const selectPostsReport = createSelector(selectMyPosts, (posts) => {
    let active = 0, pending = 0, expiring = 0;
    let autoTotal = 0, premium = 0, vip = 0, normal = 0;

    for (const p of posts) {
        const status = (p?.statusKey || "").toLowerCase();
        if (status === "active" || status === "published") active++;
        else if (status === "pending") pending++;
        if (isExpiringSoon(p)) expiring++;

        const lt = (p?.listingType || "").toUpperCase();
        if (lt) {
            autoTotal++;
            if (lt === "PREMIUM") premium++;
            else if (lt === "VIP") vip++;
            else if (lt === "NORMAL") normal++;
        }
    }

    return {
        active,
        pending,
        expiring,
        auto: { total: autoTotal, premium, vip, normal },
    };
});

/* ===================== EXPORTS ===================== */

export const { setPage, setSize, setSort, clearProperties, clearCurrentProperty, clearFavorites } = propertySlice.actions;
export default propertySlice.reducer;
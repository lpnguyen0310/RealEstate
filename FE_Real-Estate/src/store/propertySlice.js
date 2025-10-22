import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/api/axios";
import { uploadMany } from "@/api/cloudinary";


export const fetchPropertiesThunk = createAsyncThunk(
    "property/fetchAll",
    // 1. Nhận vào một object `params` chứa tất cả bộ lọc, không giới hạn
    async (params = {}, { rejectWithValue }) => {
        try {
            // 2. Truyền thẳng object `params` vào request. 
            // Axios sẽ tự động chuyển nó thành query string (ví dụ: ?keyword=abc&sort=price,asc)
            const res = await api.get("/properties", { params });
            return res?.data?.data ?? res?.data;
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Không thể tải danh sách tin đăng");
        }
    }
);

// === THUNK LẤY CHI TIẾT ===
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

export const createPropertyThunk = createAsyncThunk(
    "property/create",
    /**
     * @param {{ formData: any, listingTypePolicyId: number|null }} arg
     */
    async ({ formData, listingTypePolicyId }, { rejectWithValue }) => {
        try {
            // 1) Ảnh: tách file & URL sẵn có
            const imgs = formData.images || [];
            const files = imgs.filter((x) => x instanceof File || x instanceof Blob);
            const existedUrls = imgs.filter((x) => typeof x === "string" && x.startsWith("http"));

            // 2) Upload các file lên Cloudinary
            const uploaded = files.length ? await uploadMany(files, "properties") : [];
            const uploadedUrls = uploaded.map((x) => x.secure_url);
            const imageUrls = [...existedUrls, ...uploadedUrls];

            // 3) Build payload theo BE đang nhận
            const payload = {
                title: formData.title,
                price: Number(formData.price) || 0,
                area: Number(formData.usableArea || formData.landArea) || 0,
                bedrooms: formData.bedrooms ?? 0,
                bathrooms: formData.bathrooms ?? 0,
                addressStreet: formData.streetName || "",
                propertyType: formData.propertyType || "sell",
                priceType: formData.priceType || "SELL_PRICE",
                status: "PENDING_REVIEW", // nếu BE set default thì có thể bỏ

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
            return res?.data?.data ?? res?.data; // tuỳ API wrapper
        } catch (e) {
            const msg = e?.response?.data?.message || "Đăng tin thất bại";
            return rejectWithValue(msg);
        }
    }
);

// Thunk: gọi BE lấy danh sách tin của chính user
export const fetchMyPropertiesThunk = createAsyncThunk(
    "property/fetchMyProperties",
    // 1. Thêm 'status' vào danh sách tham số
    async ({ page = 0, size = 20, sort = "postedAt,desc", status } = {}, { rejectWithValue }) => {
        try {
            // 2. Build object params một cách linh hoạt
            const params = { page, size, sort };

            // 3. Thêm 'status' vào params CHỈ KHI nó tồn tại
            if (status) {
                params.status = status;
            }

            // 4. Truyền object params đã build vào request
            // Axios sẽ tự động tạo URL, ví dụ: /properties/me?page=0&size=20&status=pending
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
        } catch (e) {
            return rejectWithValue("Không thể tải số đếm tin đăng");
        }
    }
);

function parseBackendDate(d) {
    if (!d) return null;
    if (typeof d === "number") return new Date(d);

    if (typeof d === "string") {
        let s = d.replace(" ", "T");
        if (!/Z|[+-]\d{2}:\d{2}$/.test(s)) s += "Z";
        const t = Date.parse(s);
        return Number.isNaN(t) ? null : new Date(t);
    }

    // trường hợp Jackson trả object kiểu {year, month, day, hour,...}
    if (d && typeof d === "object" && "year" in d && "month" in d && "day" in d) {
        const { year, month, day, hour = 0, minute = 0, second = 0, nano = 0 } = d;
        return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1e6));
    }

    return null;
}

function formatViDate(d) {
    const dt = parseBackendDate(d);
    return dt ? dt.toLocaleDateString("vi-VN") : "";
}
// Helper: map PropertyDTO -> dữ liệu PostCard đang dùng
function mapDtoToPostCard(p) {
    // p là PropertyDTO từ BE
    const fmt = Intl.NumberFormat("vi-VN");
    const priceText = p?.price != null ? `${fmt.format(p.price)} ₫` : "—";
    const unitPriceText = p?.pricePerM2 != null ? `${fmt.format(p.pricePerM2)} ₫/m²` : "";
    const addressMain =
        p?.displayAddress ||
        [p?.addressStreet /* + tên phường-quận-thành phố nếu bạn muốn */].filter(Boolean).join(", ");
    const postat = p?.postedAt;
    console.log("Postat:", postat);
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
        installmentText: p?.propertyType === "sell" ? "Mua bán" :
            p?.propertyType === "rent" ? "Cho thuê" : "",
        statusKey: statusEnumToKey(p?.status),

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
        case "ARCHIVED": return "hidden"; // hoặc làm tab riêng nếu muốn
        default: return "draft";
    }
}

function mapPublicPropertyToCard(p) {
    if (!p) return {}; // Trả về object rỗng nếu không có dữ liệu để tránh lỗi

    return {
        id: p.id,
        image: p.image,
        images: Array.isArray(p.images) ? p.images : [],
        title: p.title,
        description: p.description,

        // Lấy trực tiếp các trường đã được Backend định dạng sẵn
        price: p.price,
        pricePerM2: p.pricePerM2,
        postedAt: p.postedAt,
        photos: p.photos,

        // Gộp địa chỉ vào một trường `addressMain` mà PropertyCard đang dùng
        addressMain: p.addressFull || p.addressShort || "",
        addressShort: p.addressShort || "",
        addressFull: p.addressFull || "",

        area: p.area,
        // Dùng đúng tên thuộc tính mà API trả về
        bed: p.bed,
        bath: p.bath,

        // Giữ lại các thông tin khác nếu cần
        agent: p.agent,
        type: p.type,
        category: p.category,

        listingType: p.listing_type,
    };
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

    currentProperty: null,
    loadingDetail: false,
    errorDetail: null,

    counts: { // Initialize counts
        active: 0,
        pending: 0,
        draft: 0,
        rejected: 0,
        hidden: 0,
        expired: 0,
        expiringSoon: 0,
    },
    loadingCounts: false,

    // query state (để đồng bộ Pagination/Sort)
    sort: "postedAt,desc",
    creating: false,
    createError: null,
    lastCreated: null,
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
        },
        // === PHẦN THÊM MỚI ===
        // Reducer để dọn dẹp state của trang chi tiết khi người dùng rời đi
        clearCurrentProperty(state) {
            state.currentProperty = null;
            state.errorDetail = null;
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

            // ===== lấy tin của tôi =====
            .addCase(fetchMyPropertiesThunk.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchMyPropertiesThunk.fulfilled, (s, a) => {
                const d = a.payload || {};
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
            })

            // === PHẦN THÊM MỚI ===
            // ===== lấy danh sách public =====
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
                        // Chú ý: Dữ liệu JSON trả về là `listingType`
                        const valueA = sortOrder[itemA.listingType?.toUpperCase()] || DEFAULT_SORT_VALUE;
                        const valueB = sortOrder[itemB.listingType?.toUpperCase()] || DEFAULT_SORT_VALUE;
                        return valueA - valueB;
                    });

                // 3. Cập nhật state với danh sách ĐÃ ĐƯỢC MAP VÀ SẮP XẾP
                s.list = mappedAndSortedList;

                // 4. LẤY THÔNG TIN PHÂN TRANG TRỰC TIẾP TỪ PAYLOAD CỦA API
                s.page = pageData.number ?? 0; // Spring Page bắt đầu từ 0
                s.size = pageData.size ?? 20;
                s.totalElements = pageData.totalElements ?? 0;
                s.totalPages = pageData.totalPages ?? 0;

                // 5. Cập nhật trạng thái loading
                s.loading = false;
                s.error = null;
            })
            .addCase(fetchPropertiesThunk.rejected, (s, a) => {
                s.loading = false;
                s.error = a.payload || "Không thể tải danh sách tin đăng";
            })

            // ===== lấy chi tiết 1 tin =====
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
            // +++ BỔ SUNG LOGIC REDUCER CHO COUNTS +++
            .addCase(fetchMyPropertyCountsThunk.pending, (state) => {
                state.loadingCounts = true; // Bật loading
            })
            .addCase(fetchMyPropertyCountsThunk.fulfilled, (state, action) => {
                state.loadingCounts = false; // Tắt loading
                // Gộp kết quả counts từ API vào state, giữ nguyên key nếu API không trả về
                state.counts = { ...initialState.counts, ...(action.payload || {}) };
            })
            .addCase(fetchMyPropertyCountsThunk.rejected, (state, action) => {
                state.loadingCounts = false; // Tắt loading
                console.error("Failed to fetch property counts:", action.payload);
                // Reset về 0 nếu lỗi
                state.counts = { ...initialState.counts };
            });
    },
});

export const { setPage, setSize, setSort, clearProperties } = propertySlice.actions;
export default propertySlice.reducer;

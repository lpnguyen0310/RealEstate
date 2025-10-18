import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/api/axios";
import { uploadMany } from "@/api/cloudinary";
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
    const createdAt = formatViDate(p?.postedAt);
    console.log("createdAt", createdAt);
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

        addressMain,
        area: p?.area,
        bed: p?.bedrooms,
        bath: p?.bathrooms,
        sizeText: p?.width && p?.height ? `${p.width}m x ${p.height}m` : "",
        note: "",                     // nếu muốn hiển thị ghi chú

        createdAt,
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
                // (tuỳ chọn) Optimistic update ngay đầu danh sách:
                // if (a.payload) s.list.unshift(mapDtoToPostCard(a.payload));
            })
            .addCase(createPropertyThunk.rejected, (s, a) => {
                s.creating = false;
                s.createError = a.payload || "Đăng tin thất bại";
            })
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

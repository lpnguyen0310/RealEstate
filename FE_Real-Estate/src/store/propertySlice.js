// src/store/propertySlice.js
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import api from "@/api/axios";
import { uploadMany } from "@/api/cloudinary";
import { performPropertyAction } from "@/api/property";

/* ===================== THUNKS ===================== */

// Lấy danh sách public (trang chủ / tìm kiếm) + For You
export const fetchPropertiesThunk = createAsyncThunk(
    "property/fetchAll",
    async (params = {}, thunkApi) => {
        const { rejectWithValue, getState } = thunkApi;
        try {
            if (params?.type === "forYou") {
                const state = getState();
                const userId =
                    state?.auth?.user?.id ||
                    state?.auth?.user?.userId ||
                    params?.userId;

                const limit = params?.limit ?? params?.size ?? 8;

                // Lấy cityId & range từ params (nếu có)
                const cityId =
                    params?.cityId || state?.location?.selectedProvinceId || undefined;
                const minPrice = params?.minPrice;
                const maxPrice = params?.maxPrice;
                const minArea = params?.minArea;
                const maxArea = params?.maxArea;

                // Cho phép FE truyền nearCityIds (khi bấm "Tìm tiếp lân cận")
                const nearCityIds = params?.nearCityIds;

                if (!userId)
                    return { content: [], _source: "popular", _forYou: true };

                // ✅ Gộp params gọn gàng; BE xử lý personalized + nearby fallback + range
                const query = { userId, limit };
                if (cityId != null) query.cityId = cityId;
                if (minPrice != null) query.minPrice = minPrice;
                if (maxPrice != null) query.maxPrice = maxPrice;
                if (minArea != null) query.minArea = minArea;
                if (maxArea != null) query.maxArea = maxArea;
                if (Array.isArray(nearCityIds) && nearCityIds.length > 0) {
                    // axios mặc định serialize array dưới dạng nearCityIds[]=x
                    // BE có thể đọc List<Long> nearCityIds
                    query.nearCityIds = nearCityIds;
                }

                const recoRes = await api.get("/properties/recommendations", { params: query });

                // Back-compat: BE cũ trả List; BE mới trả object {items, source, nearCityIds, anchorCityId}
                const body = recoRes?.data;
                const isArray = Array.isArray(body) || Array.isArray(body?.data);
                const content = isArray ? (body?.data ?? body ?? []) : (body?.items ?? []);
                const sourceFromHeader = recoRes?.headers?.["x-reco-source"];
                const sourceFromBody = isArray ? undefined : body?.source;
                const recoSource = sourceFromBody || sourceFromHeader || "personalized";
                const nearIdsMeta = isArray ? [] : (body?.nearCityIds ?? []);
                const anchorCityIdMeta = isArray ? undefined : (body?.anchorCityId ?? null);

                return {
                    content,
                    _source: recoSource,
                    _nearCityIds: nearIdsMeta,
                    _anchorCityId: anchorCityIdMeta,
                    _forYou: true,
                };
            }

            // === Mặc định: list public / search ===
            const res = await api.get("/properties", { params });
            return res?.data?.data ?? res?.data;
        } catch (e) {
            return rejectWithValue(
                e?.response?.data?.message || "Không thể tải danh sách tin đăng"
            );
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
            return rejectWithValue(
                e?.response?.data?.message || "Không thể tải chi tiết tin đăng"
            );
        }
    }
);

// Lấy chi tiết tin để EDIT (yêu cầu login)
export const fetchPropertyEditByIdThunk = createAsyncThunk(
    "property/fetchEditById",
    async (propertyId, { rejectWithValue }) => {
        try {
            const res = await api.get(`/properties/edit/${propertyId}`);
            return res?.data?.data ?? res?.data; // PropertyDTO
        } catch (e) {
            return rejectWithValue(
                e?.response?.data?.message || "Không thể tải chi tiết tin đăng (edit)"
            );
        }
    }
);

// Danh sách người yêu thích 1 tin
export const fetchPropertyFavoritesThunk = createAsyncThunk(
    "property/fetchFavorites",
    async (propertyId, { rejectWithValue }) => {
        try {
            const res = await api.get(`/properties/${propertyId}/favorites`);
            return res.data; // List<UserFavoriteDTO>
        } catch (e) {
            const msg =
                e?.response?.data?.message || "Không thể tải danh sách người yêu thích";
            return rejectWithValue(msg);
        }
    }
);

// Tạo tin
export const createPropertyThunk = createAsyncThunk(
    "property/create",
    /**
     * @param {{ formData: any, listingTypePolicyId: number|null, submitMode?: "publish"|"draft" }} arg
     */
    async ({ formData, listingTypePolicyId, submitMode = "publish" }, { rejectWithValue }) => {
        try {
            // 1) Ảnh: tách file & URL
            const imgs = formData.images || [];
            const files = imgs.filter((x) => x instanceof File || x instanceof Blob);
            const existedUrls = imgs.filter((x) => typeof x === "string" && x.startsWith("http"));

            // 2) Upload Cloudinary
            const uploaded = files.length ? await uploadMany(files, "properties") : [];
            const uploadedUrls = uploaded.map((x) => x.secure_url);
            const imageUrls = [...existedUrls, ...uploadedUrls];
            const isOwner = !!formData?.ownerAuth?.isOwner;

            // 3) Payload
            const payload = {
                title: formData.title,
                price: Number(formData.price) || 0,
                area: Number(formData.usableArea || formData.landArea) || 0,
                bedrooms: formData.bedrooms ?? 0,
                bathrooms: formData.bathrooms ?? 0,
                addressStreet: formData.streetName || "",
                propertyType: formData.propertyType || "sell",
                priceType: formData.priceType || "SELL_PRICE",

                legalStatus: formData.legalDocument || "",
                direction: formData.direction || "",
                description: formData.description || "",

                floors: Number(formData.floors) || null,
                position: formData.position || "",
                displayAddress:
                    formData.displayAddress || formData.suggestedAddress || "",

                landArea: Number(formData.landArea) || null,
                width: Number(formData.width) || null,
                height: Number(formData.length) || null,

                categoryId: formData.categoryId || null,
                wardId: formData.wardId || null,
                districtId: formData.districtId || null,
                cityId: formData.provinceId || null,

                listingTypePolicyId:
                    listingTypePolicyId ?? formData.listingTypePolicyId,
                imageUrls,
                amenityIds: formData.amenityIds || [],
                constructionImages: formData.constructionImages || [], // CONSTRUCTION
                isOwner,
                contactName: !isOwner ? (formData.ownerAuth?.ownerName || formData.contact?.name || "").trim() : undefined,
                contactPhone: !isOwner ? (formData.ownerAuth?.phoneNumber || formData.contact?.phone || "").trim() : undefined,
                contactEmail: !isOwner ? (formData.ownerAuth?.ownerEmail || formData.contact?.email || "").trim() : undefined,
                contactRelationship: !isOwner ? (formData.ownerAuth?.relationship || "").trim() : undefined,
            };

            const mode = submitMode?.toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISH";
            const res = await api.post("/properties/create", payload, {
                params: { mode },
            });
            return res?.data?.data ?? res?.data;
        } catch (e) {
            const msg = e?.response?.data?.message || "Đăng tin thất bại";
            return rejectWithValue(msg);
        }
    }
);

// Danh sách tin của tôi (dashboard)
export const fetchMyPropertiesThunk = createAsyncThunk(
    "property/fetchMine",
    async (params = {}, thunkApi) => {
        try {
            const {
                page = 0,
                size = 10,
                sort = "postedAt,desc",
                status,
                ...restFilters
            } = params;

            const filters = Object.fromEntries(
                Object.entries(restFilters).filter(
                    ([, v]) => v !== undefined && v !== null && v !== ""
                )
            );

            const query = {
                page,
                size,
                sort,
                ...(status ? { status } : {}),
                ...filters,
            };

            const res = await api.get("/properties/me", { params: query });
            return res.data;
        } catch (err) {
            return thunkApi.rejectWithValue(
                err?.response?.data?.message || err.message
            );
        }
    }
);

// Cập nhật tin đăng
export const updatePropertyThunk = createAsyncThunk(
    "property/update",
    /**
     * @param {{ id: number|string, formData: any, listingTypePolicyId?: number|null, submitMode?: "publish"|"draft"|undefined }} arg
     */
    async ({ id, formData, listingTypePolicyId, submitMode }, { rejectWithValue }) => {
        try {
            // 1) Ảnh
            const imgs = formData.images || [];
            const files = imgs.filter((x) => x instanceof File || x instanceof Blob);
            const existedUrls = imgs.filter((x) => typeof x === "string" && x.startsWith("http"));

            const uploaded = files.length ? await uploadMany(files, "properties") : [];
            const uploadedUrls = uploaded.map((x) => x.secure_url);
            const imageUrls = [...existedUrls, ...uploadedUrls];
            const isOwner = !!formData?.ownerAuth?.isOwner;

            // 2) Payload (same as create)
            const payload = {
                title: formData.title,
                price: Number(formData.price) || 0,
                area: Number(formData.usableArea || formData.landArea) || 0,
                bedrooms: formData.bedrooms ?? 0,
                bathrooms: formData.bathrooms ?? 0,
                addressStreet: formData.streetName || "",
                propertyType: formData.propertyType || "sell",
                priceType: formData.priceType || "SELL_PRICE",

                legalStatus: formData.legalDocument || "",
                direction: formData.direction || "",
                description: formData.description || "",

                floors: Number(formData.floors) || null,
                position: formData.position || "",
                displayAddress:
                    formData.displayAddress || formData.suggestedAddress || "",

                landArea: Number(formData.landArea) || null,
                width: Number(formData.width) || null,
                height: Number(formData.length) || null,

                categoryId: formData.categoryId || null,
                wardId: formData.wardId || null,
                districtId: formData.districtId || null,
                cityId: formData.provinceId || null,

                listingTypePolicyId:
                    listingTypePolicyId ?? formData.listingTypePolicyId,
                imageUrls,
                amenityIds: formData.amenityIds || [],
                constructionImages: formData.constructionImages || [], // CONSTRUCTION
                isOwner,
                contactName: !isOwner ? (formData.ownerAuth?.ownerName || formData.contact?.name || "").trim() : undefined,
                contactPhone: !isOwner ? (formData.ownerAuth?.phoneNumber || formData.contact?.phone || "").trim() : undefined,
                contactEmail: !isOwner ? (formData.ownerAuth?.ownerEmail || formData.contact?.email || "").trim() : undefined,
                contactRelationship: !isOwner ? (formData.ownerAuth?.relationship || "").trim() : undefined,
            };

            const mode = submitMode ? submitMode.toUpperCase() : undefined;
            const res = await api.put(`/properties/${id}`, payload, {
                params: mode ? { mode } : {},
            });
            return res?.data?.data ?? res?.data;
        } catch (e) {
            const msg = e?.response?.data?.message || "Cập nhật tin thất bại";
            return rejectWithValue(msg);
        }
    }
);

// Số đếm dashboard
export const fetchMyPropertyCountsThunk = createAsyncThunk(
    "property/fetchMyCounts",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/properties/my-counts");
            return res.data;
        } catch {
            return rejectWithValue("Không thể tải số đếm tin đăng");
        }
    }
);

export const fetchBannerListingsThunk = createAsyncThunk(
    "property/fetchBannerListings",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/properties/banner-listings");
            const data = res?.data?.data ?? res?.data ?? [];
            if (Array.isArray(data)) {
                // Tái sử dụng mapper có sẵn của bạn cho card public
                return data.map(mapPublicPropertyToCard);
            }
            return [];
        } catch (e) {
            return rejectWithValue(
                e?.response?.data?.message || "Không thể tải tin nổi bật"
            );
        }
    }
);

// Thực hiện hành động trên tin đăng (HIDE, UNHIDE, MARK_SOLD, UNMARK_SOLD)
export const performPropertyActionThunk = createAsyncThunk(
    "property/performAction",
    async ({ id, action, note }, { rejectWithValue }) => {
        try {
            console.log("[performPropertyActionThunk] ->", { id, action, note });
            const res = await performPropertyAction(id, action, note);
            console.log("[performPropertyActionThunk] OK <-", res);
            return res;
        } catch (e) {
            console.error("[performPropertyActionThunk] ERR <-", e?.response || e);
            const msg = e?.response?.data?.message || "Thao tác thất bại";
            return rejectWithValue(msg);
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
            const { year, month, day, hour = 0, minute = 0, second = 0, nano = 0 } =
                x;
            return new Date(
                year,
                month - 1,
                day,
                hour,
                minute,
                second,
                Math.floor(nano / 1e6)
            );
        }
        return null;
    } catch {
        return null;
    }
}

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

function toStatusTag(status) {
    const s = (status ?? "").toString().trim().toUpperCase();
    switch (s) {
        case "PUBLISHED":
            return "Đang Đăng";
        case "PENDING_REVIEW":
            return "Chờ Duyệt";
        case "DRAFT":
            return "Nháp";
        case "REJECTED":
            return "Bị Từ Chối";
        case "HIDDEN":
            return "Đã Ẩn";
        case "EXPIRED":
            return "Hết Hạn";
        case "EXPIRINGSOON":
            return "Sắp Hết Hạn";
        case "ARCHIVED":
            return "Đã Lưu Trữ";
        case "WARNED":
            return "Cần Chỉnh Sửa";
        default:
            return "Nháp";
    }
}
function statusEnumToKey(status) {
    const s = (status ?? "").toString().trim().toUpperCase();
    switch (s) {
        case "PUBLISHED":
            return "active";
        case "PENDING_REVIEW":
            return "pending";
        case "DRAFT":
            return "draft";
        case "REJECTED":
            return "rejected";
        case "HIDDEN":
            return "hidden";
        case "EXPIRED":
            return "expired";
        case "EXPIRINGSOON":
            return "expiringSoon";
        case "ARCHIVED":
            return "archived";
        case "WARNED":
            return "warned";
        default:
            return "draft";
    }
}

function mapDtoToPostCard(p) {
    const fmt = Intl.NumberFormat("vi-VN");

    const pricePerM2 =
        p?.pricePerM2 != null
            ? p.pricePerM2
            : p?.price != null && p?.area > 0
                ? p.price / p.area
                : null;

    const priceText = p?.price != null ? `${fmt.format(p.price)} ₫` : "—";
    const unitPriceText =
        pricePerM2 != null ? `${fmt.format(pricePerM2)} ₫/m²` : "";

    const addressMain =
        p?.displayAddress || [p?.addressStreet].filter(Boolean).join(", ");

    return {
        id: p.id,
        images:
            Array.isArray(p.imageUrls) && p.imageUrls.length
                ? p.imageUrls
                : p.images || [],
        title: p.title,
        description: p.description,

        statusTag: toStatusTag(p?.status),
        statusKey: statusEnumToKey(p?.status),

        priceText,
        unitPriceText,
        landPriceText: "",

        installmentText:
            p?.propertyType === "sell"
                ? "Mua bán"
                : p?.propertyType === "rent"
                    ? "Cho thuê"
                    : "",

        addressMain,
        area: p?.area,
        bed: p?.bedrooms,
        bath: p?.bathrooms,
        sizeText: p?.width && p?.height ? `${p.width}m x ${p.height}m` : "",
        note: "",

        createdAt: p?.postedAt
            ? new Date(p.postedAt).toLocaleDateString("vi-VN")
            : "",
        views: p?.viewCount ?? 0,
        favoriteCount: p?.favoriteCount ?? 0,

        propertyType: p?.propertyType,
        interactionCount: p?.interactionCount ?? 0,
        potentialCustomerCount: p?.potentialCustomerCount ?? 0,

        listingType: p?.listingType, // NORMAL | VIP | PREMIUM

        postedAt: p?.postedAt ?? null,
        expiresAt: p?.expiresAt ?? null,
        durationDays: p?.durationDays ?? null,
        actualDurationDays: p?.actualDurationDays ?? null,

        rejectReason: p?.rejectReason || null,
        audits: Array.isArray(p?.audit) ? p.audit : [],

        latestWarningMessage: p?.latestWarningMessage || null,
    };
}

// Map cho PUBLIC LIST / RECOMMEND payload
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

        addressMain: p.addressFull || p.addressShort || p.displayAddress || "",
        addressShort: p.addressShort || "",
        addressFull: p.addressFull || "",

        area: p.area,
        bed: p.bed,
        bath: p.bath,

        agent: p.agent,
        type: p.type,
        category: p.category,
        cityId: p.cityId ?? p.city_id ?? p.city?.id,
        cityName: p.cityName ?? p.city_name ?? p.city?.name,
        listingType: p.listing_type || p.listingType,
    };
}

/* ===================== SLOT MAPPER ===================== */

// Map tên slot → các key trong state
const slotKey = (slot = "list") =>
({
    // Trang search (mặc định)
    list: { list: "list", loading: "loading", error: "error" },

    // Slots cho Home
    homeFeatured: {
        list: "homeFeaturedList",
        loading: "homeFeaturedLoading",
        error: "homeFeaturedError",
    },
    similarNews: {
        list: "similarNewsList",
        loading: "similarNewsLoading",
        error: "similarNewsError",
    },

    // Slot logic cho For You
    forYou: {
        list: "forYouList",
        loading: "forYouLoading",
        error: "forYouError",
    },
}[slot] || { list: "list", loading: "loading", error: "error" });

/* ===================== SLICE ===================== */

const initialState = {
    // Public (trang search)
    list: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,

    // ===== Buckets theo slot cho Home =====
    homeFeaturedList: [],
    homeFeaturedLoading: false,
    homeFeaturedError: null,

    similarNewsList: [],
    similarNewsLoading: false,
    similarNewsError: null,

    // For You (recommend)
    forYouList: [],
    forYouLoading: false,
    forYouError: null,
    forYouSource: null, // 'personalized' | 'nearby' | 'popular' | 'empty' | null
    forYouNearCityIds: [],       // ⭐️ NEW
    forYouAnchorCity: null,      // ⭐️ NEW

    bannerListings: [],
    bannerListingsLoading: false,
    bannerListingsError: null,

    // Dashboard list của tôi
    myList: [],
    myPage: 0,
    mySize: 20,
    myTotalElements: 0,
    myTotalPages: 0,

    // UI state chung
    loading: false,
    error: null,

    currentProperty: null,
    loadingDetail: false,
    errorDetail: null,

    counts: {
        active: 0,
        pending: 0,
        draft: 0,
        rejected: 0,
        hidden: 0,
        expired: 0,
        expiringSoon: 0,
        archived: 0,
    },
    loadingCounts: false,

    // query state
    sort: "postedAt,desc",
    creating: false,
    createError: null,
    lastCreated: null,

    // STATE CHO MODAL FAVORITES
    loadingFavorites: false,
    errorFavorites: null,
    currentFavoriteUsers: [],
    pendingAction: null,
};

const propertySlice = createSlice({
    name: "property",
    initialState,
    reducers: {
        setPage(state, action) {
            state.page = action.payload ?? 0;
        },
        setSize(state, action) {
            state.size = action.payload ?? 20;
            state.page = 0;
        },
        setSort(state, action) {
            state.sort = action.payload ?? "postedAt,desc";
            state.page = 0;
        },
        clearProperties(state) {
            state.list = [];
            state.page = 0;
            state.totalPages = 0;
            state.totalElements = 0;
            state.error = null;
            state.lastCreated = null;
            state.createError = null;
            state.creating = false;

            // Clear slots Home
            state.homeFeaturedList = [];
            state.homeFeaturedLoading = false;
            state.homeFeaturedError = null;
            state.similarNewsList = [];
            state.similarNewsLoading = false;
            state.similarNewsError = null;

            // Clear For You
            state.forYouList = [];
            state.forYouLoading = false;
            state.forYouError = null;
            state.forYouSource = null;
            state.forYouNearCityIds = [];
            state.forYouAnchorCity = null;

            // Clear my list
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
        clearForYou(state) {
            state.forYouList = [];
            state.forYouLoading = false;
            state.forYouError = null;
            state.forYouSource = null;
            state.forYouNearCityIds = [];
            state.forYouAnchorCity = null;
        },
        clearHomeSlots(state) {
            state.homeFeaturedList = [];
            state.homeFeaturedLoading = false;
            state.homeFeaturedError = null;
            state.similarNewsList = [];
            state.similarNewsLoading = false;
            state.similarNewsError = null;
        },
        setPendingAction: (state, action) => {
            state.pendingAction = action.payload; // payload: { type, postId }
        },
        clearPendingAction: (state) => {
            state.pendingAction = null;
        },
    },
    extraReducers: (b) => {
        b
            // ===== CREATE =====
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
            .addCase(fetchMyPropertiesThunk.pending, (s) => {
                s.loading = true;
                s.error = null;
            })
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

            // ===== PUBLIC LIST + FOR YOU (slot-aware) =====
            .addCase(fetchPropertiesThunk.pending, (s, a) => {
                const { type, slot } = a.meta?.arg || {};
                if (type === "forYou") {
                    s.forYouLoading = true;
                    s.forYouError = null;
                    return;
                }
                const k = slotKey(slot);
                s[k.loading] = true;
                s[k.error] = null;
            })
            .addCase(fetchPropertiesThunk.fulfilled, (s, a) => {
                const pageData = a.payload || {};
                const arr = pageData.content || [];
                let mapped = Array.isArray(arr) ? arr.map(mapPublicPropertyToCard) : [];

                // Ưu tiên PREMIUM > VIP > NORMAL
                const sortOrder = { PREMIUM: 1, VIP: 2, NORMAL: 3 };
                const sorted = mapped.sort((A, B) => {
                    const aT = (A.listingType || "").toUpperCase();
                    const bT = (B.listingType || "").toUpperCase();
                    return (sortOrder[aT] || 99) - (sortOrder[bT] || 99);
                });

                if (a.meta?.arg?.type === "forYou" || pageData._forYou) {
                    s.forYouList = sorted;
                    s.forYouLoading = false;
                    if (pageData._source) s.forYouSource = pageData._source; // 'personalized' | 'nearby' | 'empty' | ...
                    s.forYouNearCityIds = Array.isArray(pageData._nearCityIds) ? pageData._nearCityIds : [];
                    s.forYouAnchorCity = pageData._anchorCityId ?? null;
                    return;
                }

                const { slot } = a.meta?.arg || {};
                const k = slotKey(slot);

                if (k.list === "list") {
                    s.list = sorted;
                    s.page = pageData.number ?? 0;
                    s.size = pageData.size ?? 20;
                    s.totalElements = pageData.totalElements ?? 0;
                    s.totalPages = pageData.totalPages ?? 0;
                    s[k.loading] = false;
                    s[k.error] = null;
                } else {
                    s[k.list] = sorted;
                    s[k.loading] = false;
                    s[k.error] = null;
                }
            })
            .addCase(fetchPropertiesThunk.rejected, (s, a) => {
                const { type, slot } = a.meta?.arg || {};
                if (type === "forYou") {
                    s.forYouLoading = false;
                    s.forYouError = a.payload || "Không thể tải gợi ý";
                    return;
                }
                const k = slotKey(slot);
                s[k.loading] = false;
                s[k.error] = a.payload || "Không thể tải danh sách tin đăng";
            })

            // ===== DETAIL (view) =====
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
                state.currentFavoriteUsers = action.payload;
            })
            .addCase(fetchPropertyFavoritesThunk.rejected, (state, action) => {
                state.loadingFavorites = false;
                state.errorFavorites = action.payload;
            })

            // ===== DETAIL (EDIT) =====
            .addCase(fetchPropertyEditByIdThunk.pending, (state) => {
                state.loadingDetail = true;
                state.errorDetail = null;
                state.currentProperty = null;
            })
            .addCase(fetchPropertyEditByIdThunk.fulfilled, (state, action) => {
                state.loadingDetail = false;
                state.currentProperty = action.payload;
            })
            .addCase(fetchPropertyEditByIdThunk.rejected, (state, action) => {
                state.loadingDetail = false;
                state.errorDetail = action.payload;
            })

            // ===== UPDATE =====
            .addCase(updatePropertyThunk.pending, (s) => {
                s.creating = true;
                s.createError = null;
            })
            .addCase(updatePropertyThunk.fulfilled, (s, a) => {
                s.creating = false;
                s.lastCreated = a.payload || null;
            })
            .addCase(updatePropertyThunk.rejected, (s, a) => {
                s.creating = false;
                s.createError = a.payload || "Cập nhật tin thất bại";
            })

            // ===== BANNER LISTINGS =====
            .addCase(fetchBannerListingsThunk.pending, (s) => {
                s.bannerListingsLoading = true;
                s.bannerListingsError = null;
            })
            .addCase(fetchBannerListingsThunk.fulfilled, (s, a) => {
                s.bannerListingsLoading = false;
                s.bannerListings = a.payload;
            })
            .addCase(fetchBannerListingsThunk.rejected, (s, a) => {
                s.bannerListingsLoading = false;
                s.bannerListingsError = a.payload;
            })

            // ===== PERFORM ACTION (HIDE/UNHIDE/SOLD/UNSOLD) =====
            .addCase(performPropertyActionThunk.pending, (s) => {
                // optional: set cờ pending
            })
            .addCase(performPropertyActionThunk.fulfilled, (s, a) => {
                const { id, newStatus } = a.payload || {};
                if (!id || !newStatus) return;
                const nextKey = statusEnumToKey(newStatus);

                const idx = s.myList.findIndex((x) => String(x.id) === String(id));
                if (idx >= 0) {
                    const prevKey = s.myList[idx].statusKey || null;
                    s.myList[idx].statusTag = toStatusTag(newStatus);
                    s.myList[idx].statusKey = nextKey;
                    if (prevKey && prevKey !== nextKey) {
                        if (s.counts[prevKey] != null) {
                            s.counts[prevKey] = Math.max(0, (s.counts[prevKey] || 0) - 1);
                        }
                        if (s.counts[nextKey] != null) {
                            s.counts[nextKey] = (s.counts[nextKey] || 0) + 1;
                        }
                    }
                }

                const pIdx = s.list.findIndex((x) => String(x.id) === String(id));
                if (pIdx >= 0) {
                    s.list[pIdx].statusTag = toStatusTag(newStatus);
                    s.list[pIdx].statusKey = nextKey;
                }
            })
            .addCase(performPropertyActionThunk.rejected, (s) => {
                // optional: giữ nguyên
            });
    },
});

/* ===================== SELECTORS ===================== */

const selectPropertyState = (s) => s.property;

// Dashboard (my list)
export const selectMyPosts = createSelector(
    selectPropertyState,
    (st) => st.myList || []
);

// Báo cáo nhanh cho dashboard
export const selectPostsReport = createSelector(selectMyPosts, (posts) => {
    let active = 0,
        pending = 0,
        expiring = 0;
    let autoTotal = 0,
        premium = 0,
        vip = 0,
        normal = 0;

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

export const selectPostStatsByType = createSelector(
    (state) => state.property.myList,
    (myList) => {
        const sellSummary = { views: 0, interactions: 0, potential: 0 };
        const rentSummary = { views: 0, interactions: 0, potential: 0 };

        for (const post of myList) {
            const stats = {
                views: post.views ?? 0,
                interactions: post.interactionCount ?? 0,
                potential: post.potentialCustomerCount ?? 0,
            };

            if (post.propertyType === 'sell') {
                sellSummary.views += stats.views;
                sellSummary.interactions += stats.interactions;
                sellSummary.potential += stats.potential;
            } else if (post.propertyType === 'rent') {
                rentSummary.views += stats.views;
                rentSummary.interactions += stats.interactions;
                rentSummary.potential += stats.potential;
            }
        }

        return { sellSummary, rentSummary };
    }
);

/* ===================== EXPORTS ===================== */

export const {
    setPage,
    setSize,
    setSort,
    clearProperties,
    clearCurrentProperty,
    clearFavorites,
    clearForYou, setPendingAction, clearPendingAction,
    clearHomeSlots,
} = propertySlice.actions;

export default propertySlice.reducer;

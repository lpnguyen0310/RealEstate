// src/store/adminPostsSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import dayjs from "dayjs";
import { adminPropertyApi } from "@/api/adminApi/adminPropertyApi";
import { normalizeStatuses, countByStatus } from "@/utils/validators";

// Cho phép xác định có endpoint counts hay không
const hasCountsApi = typeof adminPropertyApi?.counts === "function";

const initialState = {
    // data
    posts: [],
    counts: {},
    totalItems: 0,
    totalPages: 1,

    // loading flags
    loadingList: false,
    loadingCounts: false,
    actioningId: null,

    // filters
    q: "",
    category: "",
    listingType: "",
    selectedTab: "ALL",
    page: 1,
    pageSize: 10,

    // drawer
    open: false,
    detail: null,
    decision: {
        durationDays: 30,
        note: "",
        reason: "",
        listingType: "NORMAL",
    },
    pendingAction: null,
};

// ================== THUNKS ==================
export const fetchPostsThunk = createAsyncThunk(
    "adminPosts/fetchPosts",
    async (_, { getState, rejectWithValue }) => {
        const s = getState().adminPosts;
        try {
            const res = await adminPropertyApi.list({
                page: s.page - 1,
                size: s.pageSize,
                q: s.q || undefined,
                categoryId: s.category || undefined,
                listingType: s.listingType || undefined,
                status: s.selectedTab === "ALL" ? undefined : s.selectedTab,
                sort: "postedAt,desc",
            });

            // Chuẩn hóa như trong component
            const content = Array.isArray(res?.content) ? res.content : [];
            // ... bên trong fetchPostsThunk, đoạn map normalizedRows:
            const normalizedRows = content.map((p) => {
                const posted = p.postedAt ? dayjs(p.postedAt) : null;
                const expires = p.expiresAt ? dayjs(p.expiresAt) : null;
                const actualDurationDays =
                    p.actualDurationDays ?? (posted && expires ? expires.diff(posted, "day") : null);

                return {
                    id: p.id,
                    title: p.title,
                    category: p.categoryName,
                    listingType: p.listingType,
                    displayAddress: p.displayAddress,
                    description: p.description,
                    price: p.price,
                    status: p.status,
                    createdAt: p.postedAt,
                    expiresAt: p.expiresAt,
                    reportCount: p.reportCount,

                    // BẢNG dùng số ngày THỰC TẾ:
                    durationDays: actualDurationDays,

                    // Drawer dùng số ngày theo gói:
                    policyDurationDays: p.policyDurationDays ?? p.durationDays ?? null,

                    author: { name: p.authorName, email: p.authorEmail },
                    images: p.imageUrls || [],

                    // >>> THÊM 2 DÒNG NÀY <<<
                    audit: Array.isArray(p.audit) ? p.audit : [],           // lấy lịch sử từ API
                    rejectReason:
                        p.rejectReason ??
                        p.rejectionReason ??
                        p.reject_note ??
                        p.rejectNote ??
                        p.reason ??
                        null,
                };
            });


            const normalized = normalizeStatuses(normalizedRows);

            return {
                rows: normalized,
                totalItems: res?.totalElements ?? content.length,
                totalPages: res?.totalPages ?? 1,
            };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Load posts thất bại");
        }
    }
);

export const fetchCountsThunk = createAsyncThunk(
    "adminPosts/fetchCounts",
    async (_, { getState, rejectWithValue }) => {
        if (!hasCountsApi) return {};
        // const s = getState().adminPosts; // <-- KHÔNG LẤY STATE NỮA

        try {
            // Gọi API mà KHÔNG có bất kỳ tham số filter nào
            const res = await adminPropertyApi.counts({}); 
            return res || {};
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Load counts thất bại");
        }
    }
);

export const approvePostThunk = createAsyncThunk(
    "adminPosts/approve",
    async (id, { getState, rejectWithValue }) => {
        const s = getState().adminPosts;
        try {
            const res = await adminPropertyApi.approve(id, {
                durationDays: Number(s.decision.durationDays) || null,
                note: s.decision.note || "",
            });
            return { id, res };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Duyệt tin thất bại");
        }
    }
);

export const rejectPostThunk = createAsyncThunk(
    "adminPosts/reject",
    async (id, { getState, rejectWithValue }) => {
        const s = getState().adminPosts;
        try {
            await adminPropertyApi.reject(id, s.decision.reason ?? "");
            return { id };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Từ chối tin thất bại");
        }
    }
);

export const hidePostThunk = createAsyncThunk(
    "adminPosts/hide",
    async (id, { rejectWithValue }) => {
        try {
            await adminPropertyApi.hide(id);
            return { id };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Ẩn tin thất bại");
        }
    }
);

export const unhidePostThunk = createAsyncThunk(
    "adminPosts/unhide",
    async (id, { rejectWithValue }) => {
        try {
            await adminPropertyApi.unhide(id);
            return { id };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Bỏ ẩn tin thất bại");
        }
    }
);

export const hardDeletePostThunk = createAsyncThunk(
    "adminPosts/hardDelete",
    async (id, { rejectWithValue }) => {
        try {
            await adminPropertyApi.hardDelete(id);
            return { id };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Xóa tin thất bại");
        }
    }
);

// ================== SLICE ==================
const adminPostsSlice = createSlice({
    name: "adminPosts",
    initialState,
    reducers: {
        // filters
        setQ: (s, a) => void (s.q = a.payload),
        setCategory: (s, a) => void (s.category = a.payload),
        setListingType: (s, a) => void (s.listingType = a.payload),
        setSelectedTab: (s, a) => {
            s.selectedTab = a.payload;
            s.page = 1;
        },
        setPage: (s, a) => void (s.page = a.payload),
        setPageSize: (s, a) => void (s.pageSize = a.payload),

        resetFilters: (s) => {
            s.q = "";
            s.category = "";
            s.listingType = "";
            s.page = 1;
        },

        // drawer
        openDetail: (s, a) => {
            const r = a.payload;
            const effectiveDuration = r.policyDurationDays ?? 30;
            s.detail = { ...r };
            s.decision = {
                listingType: r.listingType || "NORMAL",
                durationDays: effectiveDuration,
                note: "",
                reason: "",
            };
            s.open = true;
        },
        closeDetail: (s) => {
            s.open = false;
            s.detail = null;
        },
        setDecision: (s, a) => {
            s.decision = { ...s.decision, ...a.payload };
        },

        setPendingAction: (s, a) => {
            s.pendingAction = a.payload;
        },
        clearPendingAction: (s) => {
            s.pendingAction = null;
        },

        // internal helper giống bumpCounts
        bumpCounts: (s, { payload }) => {
            const { from, to, removed = false } = payload || {};
            const next = { ...s.counts };
            if (from && next[from] != null) next[from] = Math.max(0, (next[from] || 0) - 1);
            if (!removed && to) next[to] = (next[to] || 0) + 1;
            s.counts = next;
        },
    },
    extraReducers: (builder) => {
        // fetch list
        builder
            .addCase(fetchPostsThunk.pending, (s) => {
                s.loadingList = true;
            })
            .addCase(fetchPostsThunk.fulfilled, (s, { payload }) => {
                s.loadingList = false;
                s.posts = payload.rows;
                s.totalItems = payload.totalItems;
                s.totalPages = payload.totalPages;

                if (!hasCountsApi) {
                    if (s.selectedTab === "ALL") {
                        s.counts = countByStatus(payload.rows);
                    }
                }
            })
            .addCase(fetchPostsThunk.rejected, (s) => {
                s.loadingList = false;
            });

        // fetch counts
        builder
            .addCase(fetchCountsThunk.pending, (s) => {
                s.loadingCounts = true;
            })
            .addCase(fetchCountsThunk.fulfilled, (s, { payload }) => {
                s.loadingCounts = false;
                if (payload && typeof payload === "object") {
                    s.counts = payload;
                }
            })
            .addCase(fetchCountsThunk.rejected, (s) => {
                s.loadingCounts = false;
            });

        // approve
        builder
            .addCase(approvePostThunk.pending, (s, { meta }) => {
                s.actioningId = meta.arg;
            })
            .addCase(approvePostThunk.fulfilled, (s, { payload }) => {
                const { id, res } = payload;
                s.actioningId = null;
                s.posts = s.posts.map((x) =>
                    x.id === id
                        ? {
                            ...x,
                            status: res?.status ?? "PUBLISHED",
                            createdAt: res?.postedAt ?? x.createdAt,
                            expiresAt: res?.expiresAt ?? x.expiresAt,
                            durationDays: res?.durationDays ?? x.durationDays,
                        }
                        : x
                );
                // bump counts
                const from = "PENDING_REVIEW";
                s.counts = {
                    ...s.counts,
                    [from]: Math.max(0, (s.counts[from] || 0) - 1),
                    PUBLISHED: (s.counts.PUBLISHED || 0) + 1,
                };
            })
            .addCase(approvePostThunk.rejected, (s) => {
                s.actioningId = null;
            });

        // reject
        builder
            .addCase(rejectPostThunk.pending, (s, { meta }) => {
                s.actioningId = meta.arg;
            })
            .addCase(rejectPostThunk.fulfilled, (s, { payload }) => {
                const { id } = payload;
                s.actioningId = null;

                // NEW: lấy lý do hiện tại trong state.decision
                const reason = (s.decision?.reason ?? "").toString();

                let from = null;
                s.posts = s.posts.map((x) => {
                    if (x.id === id) {
                        from = x.status;
                        return { ...x, status: "REJECTED", rejectReason: reason };
                    }
                    return x;
                });

                const _from = from || "PENDING_REVIEW";
                s.counts = {
                    ...s.counts,
                    [_from]: Math.max(0, (s.counts[_from] || 0) - 1),
                    REJECTED: (s.counts.REJECTED || 0) + 1,
                };

                // NEW: nếu đang mở Drawer đúng tin này thì đồng bộ luôn detail
                if (s.open && s.detail && s.detail.id === id) {
                    s.detail = { ...s.detail, status: "REJECTED", rejectReason: reason };
                }
            })
            .addCase(rejectPostThunk.rejected, (s) => {
                s.actioningId = null;
            });

        // hide
        builder
            .addCase(hidePostThunk.pending, (s, { meta }) => {
                s.actioningId = meta.arg;
            })
            .addCase(hidePostThunk.fulfilled, (s, { payload }) => {
                const { id } = payload;
                s.actioningId = null;
                let from = null;
                s.posts = s.posts.map((x) => {
                    if (x.id === id) {
                        from = x.status;
                        return { ...x, status: "HIDDEN" };
                    }
                    return x;
                });
                const _from = from || "PUBLISHED";
                s.counts = {
                    ...s.counts,
                    [_from]: Math.max(0, (s.counts[_from] || 0) - 1),
                    HIDDEN: (s.counts.HIDDEN || 0) + 1,
                };
            })
            .addCase(hidePostThunk.rejected, (s) => {
                s.actioningId = null;
            });

        // unhide
        builder
            .addCase(unhidePostThunk.pending, (s, { meta }) => {
                s.actioningId = meta.arg;
            })
            .addCase(unhidePostThunk.fulfilled, (s, { payload }) => {
                const { id } = payload;
                s.actioningId = null;
                s.posts = s.posts.map((x) =>
                    x.id === id ? { ...x, status: "PUBLISHED" } : x
                );
                s.counts = {
                    ...s.counts,
                    HIDDEN: Math.max(0, (s.counts.HIDDEN || 0) - 1),
                    PUBLISHED: (s.counts.PUBLISHED || 0) + 1,
                };
            })
            .addCase(unhidePostThunk.rejected, (s) => {
                s.actioningId = null;
            });

        // hard delete
        builder
            .addCase(hardDeletePostThunk.pending, (s, { meta }) => {
                s.actioningId = meta.arg;
            })
            .addCase(hardDeletePostThunk.fulfilled, (s, { payload }) => {
                const { id } = payload;
                s.actioningId = null;

                let from = s.posts.find((x) => x.id === id)?.status || null;
                s.posts = s.posts.filter((x) => x.id !== id);

                if (from) {
                    s.counts = {
                        ...s.counts,
                        [from]: Math.max(0, (s.counts[from] || 0) - 1),
                    };
                }
                // totalItems giảm đi 1
                s.totalItems = Math.max(0, s.totalItems - 1);

                // Nếu đang xem chi tiết chính tin này thì đóng detail
                if (s.open && s.detail && s.detail.id === id) {
                    s.open = false;
                    s.detail = null;
                }
            })
            .addCase(hardDeletePostThunk.rejected, (s) => {
                s.actioningId = null;
            });
    },
});

export const {
    setQ,
    setCategory,
    setListingType,
    setSelectedTab,
    setPage,
    setPageSize,
    resetFilters,
    openDetail,
    closeDetail,
    setDecision,
    setPendingAction,
    clearPendingAction,
    bumpCounts,
} = adminPostsSlice.actions;

export default adminPostsSlice.reducer;
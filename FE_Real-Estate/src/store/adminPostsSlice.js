// src/store/adminPostsSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import dayjs from "dayjs";
import { adminPropertyApi } from "@/api/adminApi/adminPropertyApi";
import { normalizeStatuses, countByStatus } from "@/utils/validators";

// Cho phép xác định có endpoint counts hay không
const hasCountsApi = typeof adminPropertyApi?.counts === "function";
const TAB_TO_API_STATUS = {
    PENDING_REVIEW: "PENDING_REVIEW",
    PUBLISHED: "PUBLISHED",
    EXPIRING_SOON: "EXPIRINGSOON", // <-- quan trọng
    EXPIRED: "EXPIRED",
    HIDDEN: "HIDDEN",
    REJECTED: "REJECTED",
    ARCHIVED: "ARCHIVED",
};

/* ========= Chuẩn hoá contact từ nhiều cấu trúc khác nhau ========= */
function normalizeContact(d = {}) {
    const direct = {
        name: d.contactName ?? d.ownerName ?? d.authorName ?? d.posterName ?? d.fullName ?? d.userFullName,
        phone: d.contactPhone ?? d.ownerPhone ?? d.authorPhone ?? d.posterPhone ?? d.phone ?? d.phoneNumber,
        email: d.contactEmail ?? d.ownerEmail ?? d.authorEmail ?? d.posterEmail ?? d.email,
        relationship: d.contactRelationship ?? d.relationship ?? d.agentRelationship,
        isOwner: typeof d.isOwner === "boolean" ? d.isOwner : undefined,
    };
    const u = d.user || d.owner || d.author || d.poster || {};
    return {
        name: direct.name ?? u.fullName ?? u.name ?? "-",
        phone: direct.phone ?? u.phone ?? u.phoneNumber ?? "-",
        email: direct.email ?? u.email ?? "-",
        relationship: direct.relationship ?? "-",
        isOwner:
            typeof direct.isOwner === "boolean"
                ? direct.isOwner
                : (typeof u.isOwner === "boolean" ? u.isOwner : false),
    };
}

const initialState = {
    // data
    posts: [],
    counts: {},
    totalItems: 0,
    totalPages: 1,

    // loading flags
    loadingList: false,
    loadingCounts: false,
    loadingDetail: false,
    actioningId: null,

    selectedIds: [],

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
            const feStatus = s.selectedTab;
            const apiStatus =
                feStatus === "ALL"
                    ? undefined
                    : TAB_TO_API_STATUS[feStatus] || feStatus;

            const res = await adminPropertyApi.list({
                page: s.page - 1,
                size: s.pageSize,
                q: s.q || undefined,
                categoryId: s.category || undefined,
                listingType: s.listingType || undefined,
                status: apiStatus,
                sort: "postedAt,desc",
            });

            const content = Array.isArray(res?.content) ? res.content : [];

            const normalizedRows = content.map((p) => {
                const posted = p.postedAt ? dayjs(p.postedAt) : null;
                const expires = p.expiresAt ? dayjs(p.expiresAt) : null;
                const actualDurationDays =
                    p.actualDurationDays ?? (posted && expires ? expires.diff(posted, "day") : null);

                // PREVIEW contact nếu API list có trả (không bắt buộc)
                const contactPreview = normalizeContact(p);

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
                    contactName: p.contactName,
                    contactPhone: p.contactPhone,
                    contactEmail: p.contactEmail,
                    contactRelationship: p.contactRelationship,
                    isOwner: p.isOwner,
                    audit: Array.isArray(p.audit) ? p.audit : [],
                    rejectReason:
                        p.rejectReason ??
                        p.rejectionReason ??
                        p.reject_note ??
                        p.rejectNote ??
                        p.reason ??
                        null,

                    // preview contact (không dùng cũng không sao)
                    contactPreview,
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
        if (!hasCountsApi) return null;
        // const s = getState().adminPosts; // <-- KHÔNG LẤY STATE NỮA

        try {
            const res = await adminPropertyApi.counts({});
            console.log("Fetched counts:", res);
            return res ?? null;
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Load counts thất bại");
        }
    }
);

/* ========== NEW: lấy FULL chi tiết theo id để mở Drawer ========== */
export const fetchPostDetailThunk = createAsyncThunk(
    "adminPosts/fetchDetail",
    async (id, { rejectWithValue }) => {
        try {
            const full = await adminPropertyApi.getById(id);
            // chuẩn hoá contact + một số field đồng nhất với list
            const posted = full.postedAt ? dayjs(full.postedAt) : null;
            const expires = full.expiresAt ? dayjs(full.expiresAt) : null;
            const actualDurationDays =
                full.actualDurationDays ?? (posted && expires ? expires.diff(posted, "day") : null);

            const contact = normalizeContact(full);

            return {
                ...full,
                id: full.id,
                title: full.title,
                listingType: full.listingType,
                displayAddress: full.displayAddress,
                description: full.description,
                price: full.price,
                status: full.status,
                createdAt: full.postedAt,
                expiresAt: full.expiresAt,
                durationDays: actualDurationDays,
                policyDurationDays: full.policyDurationDays ?? full.durationDays ?? null,
                images: full.imageUrls || full.images || [],
                audit: Array.isArray(full.audit) ? full.audit : [],
                rejectReason:
                    full.rejectReason ??
                    full.rejectionReason ??
                    full.reject_note ??
                    full.rejectNote ??
                    full.reason ??
                    null,

                // <- phần Drawer cần
                contactName: contact.name,
                contactPhone: contact.phone,
                contactEmail: contact.email,
                contactRelationship: contact.relationship,
                isOwner: contact.isOwner,
            };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Load chi tiết thất bại");
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
export const bulkApproveThunk = createAsyncThunk(
    "adminPosts/bulkApprove",
    async (reqBody, { getState, rejectWithValue }) => {
        const s = getState().adminPosts;
        try {
            // reqBody = { ids: [1, 2, ...], listingType: "VIP", durationDays: 30, note: "..." }
            const res = await adminPropertyApi.bulkApprove(reqBody);
            // Payload trả về list các PropertyShortResponse đã duyệt thành công
            return { approvedIds: reqBody.ids, results: res?.data || [] };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Duyệt hàng loạt thất bại");
        }
    }
);

export const bulkRejectThunk = createAsyncThunk(
    "adminPosts/bulkReject",
    async (reqBody, { getState, rejectWithValue }) => {
        const s = getState().adminPosts;
        try {
            // reqBody = { ids: [1, 2, ...], reason: "Lý do chung" }
            await adminPropertyApi.bulkReject(reqBody);
            return { rejectedIds: reqBody.ids, reason: reqBody.reason };
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Từ chối hàng loạt thất bại");
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

        // drawer (giữ để mở bằng row nếu muốn – nhưng khuyến nghị dùng fetchPostDetailThunk)
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

        bumpCounts: (s, { payload }) => {
            const { from, to, removed = false } = payload || {};
            const next = { ...s.counts };
            if (from && next[from] != null) next[from] = Math.max(0, (next[from] || 0) - 1);
            if (!removed && to) next[to] = (next[to] || 0) + 1;
            s.counts = next;
        },
        setAllSelected: (s, a) => {
            // a.payload là array of IDs trên trang hiện tại
            s.selectedIds = a.payload;
        },
        toggleSelected: (s, a) => {
            const id = a.payload;
            const index = s.selectedIds.indexOf(id);
            if (index === -1) {
                s.selectedIds.push(id);
            } else {
                s.selectedIds.splice(index, 1);
            }
        },
        clearSelection: (s) => {
            s.selectedIds = [];
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
                if (payload && typeof payload === "object" && Object.keys(payload).length > 0) {
                    const normalized = Object.entries(payload).reduce((acc, [k, v]) => {
                        if (typeof k === "string") {
                            acc[k.toUpperCase()] = v ?? 0;
                        }
                        return acc;
                    }, {});

                    s.counts = normalized;
                }
            })
            .addCase(fetchCountsThunk.rejected, (s) => {
                s.loadingCounts = false;
            });

        /* ========== NEW: fetch detail by id ========== */
        builder
            .addCase(fetchPostDetailThunk.pending, (s) => {
                s.loadingDetail = true;
            })
            .addCase(fetchPostDetailThunk.fulfilled, (s, { payload }) => {
                s.loadingDetail = false;
                // mở Drawer với detail đầy đủ (có contact/isOwner)
                const effectiveDuration = payload.policyDurationDays ?? 30;
                s.detail = { ...payload };
                s.decision = {
                    listingType: payload.listingType || "NORMAL",
                    durationDays: effectiveDuration,
                    note: "",
                    reason: "",
                };
                s.open = true;
            })
            .addCase(fetchPostDetailThunk.rejected, (s) => {
                s.loadingDetail = false;
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
                s.totalItems = Math.max(0, s.totalItems - 1);

                if (s.open && s.detail && s.detail.id === id) {
                    s.open = false;
                    s.detail = null;
                }
            })
            .addCase(hardDeletePostThunk.rejected, (s) => {
                s.actioningId = null;
            });

        builder
            .addCase(bulkApproveThunk.pending, (s) => {
                s.actioningId = "BULK"; // Đánh dấu đang thực hiện Bulk Action
            })
            .addCase(bulkApproveThunk.fulfilled, (s, { payload }) => {
                const { approvedIds } = payload;
                s.actioningId = null;
                s.selectedIds = []; // Xóa selection

                // Lọc bỏ các posts đã được duyệt thành công (nếu tab hiện tại là PENDING_REVIEW)
                const fromStatus = "PENDING_REVIEW";
                const isProcessingPending = s.selectedTab === fromStatus;
                
                if (isProcessingPending) {
                    s.posts = s.posts.filter(p => !approvedIds.includes(p.id));
                    s.totalItems = Math.max(0, s.totalItems - approvedIds.length);
                } else {
                    // Nếu không phải tab Pending, cập nhật status (dù ít xảy ra)
                    s.posts = s.posts.map(p => approvedIds.includes(p.id) ? {...p, status: "PUBLISHED"} : p);
                }

                // Cập nhật Counts
                s.counts = {
                    ...s.counts,
                    [fromStatus]: Math.max(0, (s.counts[fromStatus] || 0) - approvedIds.length),
                    PUBLISHED: (s.counts.PUBLISHED || 0) + approvedIds.length,
                };
            })
            .addCase(bulkApproveThunk.rejected, (s) => {
                s.actioningId = null;
            });


        // ================== bulkReject ==================
        builder
            .addCase(bulkRejectThunk.pending, (s) => {
                s.actioningId = "BULK";
            })
            .addCase(bulkRejectThunk.fulfilled, (s, { payload }) => {
                const { rejectedIds, reason } = payload;
                s.actioningId = null;
                s.selectedIds = []; // Xóa selection
                
                // Lọc bỏ các posts đã bị từ chối
                const fromStatus = s.selectedTab; // Có thể từ PENDING, PUBLISHED, ...
                s.posts = s.posts.filter(p => !rejectedIds.includes(p.id));
                s.totalItems = Math.max(0, s.totalItems - rejectedIds.length);
                
                // Cập nhật Counts
                s.counts = {
                    ...s.counts,
                    [fromStatus]: Math.max(0, (s.counts[fromStatus] || 0) - rejectedIds.length),
                    REJECTED: (s.counts.REJECTED || 0) + rejectedIds.length,
                };

                // Lưu ý: Sau Bulk action, cần fetchCountsThunk để đảm bảo counts chính xác
            })
            .addCase(bulkRejectThunk.rejected, (s) => {
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
    setAllSelected,   
    toggleSelected,   
    clearSelection,
} = adminPostsSlice.actions;

export default adminPostsSlice.reducer;

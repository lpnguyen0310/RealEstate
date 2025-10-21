// src/store/favoriteSlice.js
import { createSlice, createSelector } from "@reduxjs/toolkit";

const STORAGE_KEY = "bds_favorites_v1";

/* ------------ Helpers ------------ */
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

function moneyVND(v) {
    if (v === null || v === undefined || v === "") return "Liên hệ";
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) return "Liên hệ";
    return n.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    });
}

/**
 * Không load nếu chưa login (không có token)
 */
const load = () => {
    try {
        const token = localStorage.getItem("access_token");
        if (!token) return { byId: {}, allIds: [] };

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { byId: {}, allIds: [] };

        const s = JSON.parse(raw);
        const byId = s.byId || {};
        const allIds = Array.isArray(s.allIds) ? s.allIds : [];

        // Backward-compat: đảm bảo đủ trường cho bản cũ
        Object.keys(byId).forEach((id) => {
            const it = byId[id] || {};
            byId[id] = {
                id: it.id,
                title: it.title ?? "",
                thumb: it.thumb ?? "",
                href: it.href ?? "",
                savedAt: it.savedAt ?? Date.now(),
                price: it.price ?? null,
                priceDisplay: it.priceDisplay ?? null,
                displayAddress: it.displayAddress ?? it.address ?? "",
                address: it.address ?? "",
                // fields mới
                pricePerM2: it.pricePerM2 ?? null,
                area: it.area ?? null,
                bed: it.bed ?? null,
                bath: it.bath ?? null,
                photos: it.photos ?? null,
                postedAt: it.postedAt ?? "",
                listingType: it.listingType ?? "",
            };
        });

        return { byId, allIds };
    } catch {
        return { byId: {}, allIds: [] };
    }
};

const initialState = load();

const slice = createSlice({
    name: "favorites",
    initialState,
    reducers: {
        toggleSaved(state, { payload }) {
            const id = payload?.id;
            if (!id) return;

            if (state.byId[id]) {
                // remove
                delete state.byId[id];
                state.allIds = state.allIds.filter((x) => x !== id);
            } else {
                // add / upsert
                const prev = state.byId[id] || {};
                const address =
                    payload?.displayAddress ||
                    payload?.address ||
                    prev.displayAddress ||
                    prev.address ||
                    "";

                state.byId[id] = {
                    id,
                    title: payload?.title ?? prev.title ?? "",
                    thumb: payload?.thumb ?? prev.thumb ?? "",
                    href: payload?.href ?? prev.href ?? "",
                    savedAt: Date.now(),
                    price: payload?.price ?? prev.price ?? null,
                    priceDisplay: payload?.priceDisplay ?? prev.priceDisplay ?? null,
                    displayAddress: payload?.displayAddress ?? prev.displayAddress ?? address,
                    address: payload?.address ?? prev.address ?? address,
                    // meta thêm để SavedPosts render đủ
                    pricePerM2: payload?.pricePerM2 ?? prev.pricePerM2 ?? null,
                    area: payload?.area ?? prev.area ?? null,
                    bed: payload?.bed ?? prev.bed ?? null,
                    bath: payload?.bath ?? prev.bath ?? null,
                    photos: payload?.photos ?? prev.photos ?? null,
                    postedAt: payload?.postedAt ?? prev.postedAt ?? "",
                    listingType: payload?.listingType ?? prev.listingType ?? "",
                };

                state.allIds = [id, ...state.allIds.filter((x) => x !== id)];
            }
        },

        removeSaved(state, { payload: id }) {
            if (!id) return;
            if (state.byId[id]) {
                delete state.byId[id];
                state.allIds = state.allIds.filter((x) => x !== id);
            }
        },

        clearAll(state) {
            state.byId = {};
            state.allIds = [];
        },

        hydrateFavorites(state, { payload: ids }) {
            if (!Array.isArray(ids)) return;
            ids.forEach((id) => {
                if (!state.byId[id]) {
                    state.byId[id] = {
                        id,
                        title: "",
                        thumb: "",
                        href: "",
                        savedAt: Date.now(),
                        price: null,
                        priceDisplay: null,
                        displayAddress: "",
                        address: "",
                        pricePerM2: null,
                        area: null,
                        bed: null,
                        bath: null,
                        photos: null,
                        postedAt: "",
                        listingType: "",
                    };
                }
            });
            state.allIds = ids.slice();
        },

        setItemMeta(state, { payload }) {
            const {
                id,
                title,
                thumb,
                href,
                price,
                priceDisplay, // ✅ trước đây bị thiếu => ReferenceError
                displayAddress,
                address,
                pricePerM2,
                area,
                bed,
                bath,
                photos,
                postedAt,
                listingType,
            } = payload || {};
            if (!id) return;

            if (!state.byId[id]) {
                state.byId[id] = {
                    id,
                    title: "",
                    thumb: "",
                    href: "",
                    savedAt: Date.now(),
                    price: null,
                    priceDisplay: null,
                    displayAddress: "",
                    address: "",
                    pricePerM2: null,
                    area: null,
                    bed: null,
                    bath: null,
                    photos: null,
                    postedAt: "",
                    listingType: "",
                };
            }

            if (title !== undefined) state.byId[id].title = title;
            if (thumb !== undefined) state.byId[id].thumb = thumb;
            if (href !== undefined) state.byId[id].href = href;
            if (price !== undefined) state.byId[id].price = price;
            if (priceDisplay !== undefined) state.byId[id].priceDisplay = priceDisplay;
            if (displayAddress !== undefined) state.byId[id].displayAddress = displayAddress;
            if (address !== undefined) state.byId[id].address = address;

            if (pricePerM2 !== undefined) state.byId[id].pricePerM2 = pricePerM2;
            if (area !== undefined) state.byId[id].area = area;
            if (bed !== undefined) state.byId[id].bed = bed;
            if (bath !== undefined) state.byId[id].bath = bath;
            if (photos !== undefined) state.byId[id].photos = photos;
            if (postedAt !== undefined) state.byId[id].postedAt = postedAt;
            if (listingType !== undefined) state.byId[id].listingType = listingType;
        },
    },
});

export const {
    toggleSaved,
    removeSaved,
    clearAll,
    hydrateFavorites,
    setItemMeta,
} = slice.actions;

export default slice.reducer;

/* ------------ Selectors ------------ */
const root = (s) => s.favorites;
export const selectSavedIds = createSelector(root, (s) => s.allIds);
export const selectSavedMap = createSelector(root, (s) => s.byId);

export const selectSavedList = createSelector(
    [selectSavedIds, selectSavedMap],
    (ids, map) => ids.map((id) => map[id]).filter(Boolean)
);

// Bản “giàu thông tin” dùng thẳng cho UI dropdown/lists
export const selectSavedListEnhanced = createSelector(
    selectSavedList,
    (list) =>
        list.map((it) => {
            const addr = it.displayAddress || it.address || "";
            const priceText = it.priceDisplay || moneyVND(it.price);
            return {
                ...it,
                address: addr,
                priceText,
                savedAgo: timeAgo(it.savedAt),
            };
        })
);

export const makeSelectIsSaved = (id) =>
    createSelector(selectSavedMap, (map) => Boolean(map[id]));

export const selectSavedCount = createSelector(
    selectSavedIds,
    (ids) => ids.length
);

/**
 * Lưu favorites xuống localStorage — chỉ khi đã login
 * Nếu chưa login: KHÔNG lưu.
 */
export const persistFavorites = (store) => {
    let prev;
    return store.subscribe(() => {
        const state = store.getState();
        const fav = state?.favorites;
        const hasToken = !!localStorage.getItem("access_token");

        if (hasToken && fav !== prev) {
            prev = fav;
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fav));
            } catch { }
        }
    });
};

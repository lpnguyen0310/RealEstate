// src/store/favoriteSlice.js
import { createSlice, createSelector } from "@reduxjs/toolkit";

const STORAGE_KEY = "bds_favorites_v1";

/**
 * Không load nếu chưa login (không có token)
 */
const load = () => {
    try {
        const token = localStorage.getItem("access_token"); // hoặc key bạn lưu token
        if (!token) {
            return { byId: {}, allIds: [] };
        }

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { byId: {}, allIds: [] };

        const s = JSON.parse(raw);
        return {
            byId: s.byId || {},
            allIds: Array.isArray(s.allIds) ? s.allIds : [],
        };
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
                delete state.byId[id];
                state.allIds = state.allIds.filter((x) => x !== id);
            } else {
                const prev = state.byId[id] || {};
                state.byId[id] = {
                    id,
                    title: payload?.title ?? prev.title ?? "",
                    thumb: payload?.thumb ?? prev.thumb ?? "",
                    href: payload?.href ?? prev.href ?? "",
                    savedAt: Date.now(),
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
                    };
                }
            });
            state.allIds = ids.slice();
        },

        setItemMeta(state, { payload }) {
            const { id, title, thumb, href } = payload || {};
            if (!id) return;
            if (!state.byId[id])
                state.byId[id] = {
                    id,
                    title: "",
                    thumb: "",
                    href: "",
                    savedAt: Date.now(),
                };
            if (title !== undefined) state.byId[id].title = title;
            if (thumb !== undefined) state.byId[id].thumb = thumb;
            if (href !== undefined) state.byId[id].href = href;
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

// === Selectors ===
const root = (s) => s.favorites;
export const selectSavedIds = createSelector(root, (s) => s.allIds);
export const selectSavedMap = createSelector(root, (s) => s.byId);
export const selectSavedList = createSelector(
    [selectSavedIds, selectSavedMap],
    (ids, map) => ids.map((id) => map[id]).filter(Boolean)
);
export const makeSelectIsSaved = (id) =>
    createSelector(selectSavedMap, (map) => Boolean(map[id]));
export const selectSavedCount = createSelector(
    selectSavedIds,
    (ids) => ids.length
);

/**
 * Lưu favorites xuống localStorage — chỉ khi đã login
 * Nếu chưa login: xóa STORAGE_KEY
 */
export const persistFavorites = (store) => {
    let prev;
    return store.subscribe(() => {
        const state = store.getState();
        const fav = state?.favorites;
        const user = state?.auth?.user;

        // Nếu chưa login thì xoá key favorites và không lưu
        if (!user) {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch { }
            return;
        }

        if (fav !== prev) {
            prev = fav;
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fav));
            } catch { }
        }
    });
};

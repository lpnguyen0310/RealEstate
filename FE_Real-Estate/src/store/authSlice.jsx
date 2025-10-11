import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/api/axios";
import { setAccessToken, clearAccessToken } from "@/utils/auth";

// ---- Thunks ----
export const loginThunk = createAsyncThunk(
    "auth/login",
    async ({ username, password }, { rejectWithValue }) => {
        try {
            const res = await api.post("/auth/login", { identifier: username, password });
            const access = res?.data?.data?.access || res?.data?.data?.accessToken;
            if (!access) throw new Error("No access token");
            setAccessToken(access);
            const me = await api.get("user/me").catch(() => ({ data: null }));
            const profile = me?.data?.data ?? me?.data ?? null;
            if (profile) sessionStorage.setItem("profile", JSON.stringify(profile));
            return { access, profile };
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Đăng nhập thất bại";
            return rejectWithValue(msg);
        }
    }
);

export const getProfileThunk = createAsyncThunk(
    "auth/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            const me = await api.get("user/me");
            const profile = me?.data?.data ?? me?.data ?? null;
            if (profile) sessionStorage.setItem("profile", JSON.stringify(profile));
            return profile;
        } catch (e) {
            return rejectWithValue(e?.response?.data?.message || "Lấy hồ sơ thất bại");
        }
    }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
    try { await api.post("/auth/logout"); } catch { }
    clearAccessToken();
    sessionStorage.removeItem("profile");
});

const initialState = {
    user: null,
    status: "idle", // idle | loading | succeeded | failed
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        hydrateFromSession(state) {
            try {
                const p = sessionStorage.getItem("profile");
                if (p) state.user = JSON.parse(p);
            } catch { }
        },
        clearAuth(state) {
            state.user = null; state.status = "idle"; state.error = null;
        },
    },
    extraReducers: (b) => {
        b
            .addCase(loginThunk.pending, (s) => { s.status = "loading"; s.error = null; })
            .addCase(loginThunk.fulfilled, (s, a) => { s.status = "succeeded"; s.user = a.payload?.profile || null; })
            .addCase(loginThunk.rejected, (s, a) => { s.status = "failed"; s.error = a.payload || "Đăng nhập thất bại"; })

            .addCase(getProfileThunk.pending, (s) => { s.status = "loading"; })
            .addCase(getProfileThunk.fulfilled, (s, a) => { s.status = "succeeded"; s.user = a.payload || null; })
            .addCase(getProfileThunk.rejected, (s, a) => { s.status = "failed"; s.error = a.payload || "Lấy hồ sơ thất bại"; })

            .addCase(logoutThunk.fulfilled, (s) => { s.user = null; s.status = "idle"; s.error = null; });
    },
});

export const { hydrateFromSession, clearAuth } = authSlice.actions;
export default authSlice.reducer;

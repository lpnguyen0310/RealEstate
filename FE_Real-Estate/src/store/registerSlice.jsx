import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authApi from "@/api/register";
import { normalizeApiError } from "../utils/normalizeApiError";

// --- Thunks ---
export const requestOtpThunk = createAsyncThunk(
    "register/requestOtp",
    async (email, { rejectWithValue }) => {
        try {
            const res = await authApi.requestOtp(email);
            return { email, server: res?.data?.data ?? null };
        } catch (e) {
            return rejectWithValue(normalizeApiError(e));
        }
    }
);

export const verifyOtpThunk = createAsyncThunk(
    "register/verifyOtp",
    async ({ email, otp }, { rejectWithValue }) => {
        try {
            const res = await authApi.verifyOtp({ email, otp });
            const ticket = res?.data?.data?.ticket || res?.data?.data?.verifyToken;
            return { email, ticket };
        } catch (e) {
            return rejectWithValue(normalizeApiError(e));
        }
    }
);

export const setPasswordThunk = createAsyncThunk(
    "register/setPassword",
    async ({ email, ticket, password, confirmPassword }, { rejectWithValue }) => {
        try {
            const res = await authApi.setPassword({ email, ticket, password, confirmPassword });
            const user = res?.data?.data?.user ?? null; // nếu BE trả user
            return { user };
        } catch (e) {
            return rejectWithValue(normalizeApiError(e));
        }
    }
);

const initialState = {
    email: "",
    ticket: "",
    status: "idle",  // idle | loading | succeeded | failed
    error: null,
};

const registerSlice = createSlice({
    name: "register",
    initialState,
    reducers: {
        clearRegister(state) {
            state.email = "";
            state.ticket = "";
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (b) => {
        b
            // requestOtp
            .addCase(requestOtpThunk.pending, (s) => { s.status = "loading"; s.error = null; })
            .addCase(requestOtpThunk.fulfilled, (s, a) => {
                s.status = "succeeded";
                s.email = a.payload.email;
            })
            .addCase(requestOtpThunk.rejected, (s, a) => {
                s.status = "failed"; s.error = a.payload || a.error;
            })
            // verifyOtp
            .addCase(verifyOtpThunk.pending, (s) => { s.status = "loading"; s.error = null; })
            .addCase(verifyOtpThunk.fulfilled, (s, a) => {
                s.status = "succeeded";
                s.email = a.payload.email;
                s.ticket = a.payload.ticket;
            })
            .addCase(verifyOtpThunk.rejected, (s, a) => {
                s.status = "failed"; s.error = a.payload || a.error;
            })
            // setPassword
            .addCase(setPasswordThunk.pending, (s) => { s.status = "loading"; s.error = null; })
            .addCase(setPasswordThunk.fulfilled, (s) => {
                s.status = "succeeded";
            })
            .addCase(setPasswordThunk.rejected, (s, a) => {
                s.status = "failed"; s.error = a.payload || a.error;
            });
    },
});

export const { clearRegister } = registerSlice.actions;
export default registerSlice.reducer;

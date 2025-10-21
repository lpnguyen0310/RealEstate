// src/store/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    loginModalOpen: false,
    registerModalOpen: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        openLoginModal(state) {
            state.loginModalOpen = true;
        },
        closeLoginModal(state) {
            state.loginModalOpen = false;
        },
        openRegisterModal(state) {
            state.registerModalOpen = true;
        },
        closeRegisterModal(state) {
            state.registerModalOpen = false;
        },
        // Cho phép chuyển qua lại login <-> register
        switchToRegister(state) {
            state.loginModalOpen = false;
            state.registerModalOpen = true;
        },
        switchToLogin(state) {
            state.registerModalOpen = false;
            state.loginModalOpen = true;
        },
    },
});

export const {
    openLoginModal,
    closeLoginModal,
    openRegisterModal,
    closeRegisterModal,
    switchToRegister,
    switchToLogin,
} = uiSlice.actions;

export default uiSlice.reducer;

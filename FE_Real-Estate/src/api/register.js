// src/api/register.js
import api from "./axios";

const FE_CALLBACK = `${window.location.origin}/oauth2/callback`;

const authApi = {
    requestOtp: (email) => api.post("/auth/request-otp", { email }),
    verifyOtp: ({ email, otp }) => api.post("/auth/verify", { email, otp }),
    setPassword: ({ email, ticket, password, confirmPassword }) =>
        api.post("/auth/set-password", { email, ticket, password, confirmPassword }),

    loginWithGoogle: () => {
        // nhớ trang sẽ quay lại
        sessionStorage.setItem("post_login_redirect", window.location.pathname);

        // Nếu BE cho phép redirect_uri động (khuyến nghị):
        window.location.href =
            `http://localhost:8080/oauth2/authorization/google?redirect_uri=${encodeURIComponent(FE_CALLBACK)}`;

        // Nếu BE đã cố định redirect uri trong config, thay bằng:
        // window.location.href = "http://localhost:8080/oauth2/authorization/google";
    },
};

export default authApi;

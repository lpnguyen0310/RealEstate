import api from "./axios";

const authApi = {
    requestOtp: (email) => api.post("/auth/request-otp", { email }),
    verifyOtp: ({ email, otp }) => api.post("/auth/verify", { email, otp }),
    setPassword: ({ email, ticket, password, confirmPassword }) =>
        api.post("/auth/set-password", { email, ticket, password, confirmPassword }),
};

export default authApi;
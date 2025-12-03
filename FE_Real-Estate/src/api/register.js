import api from "./axios";

const FE_CALLBACK = `${window.location.origin}/oauth2/callback`;

const authApi = {
  // Register
  requestOtp: (email) => api.post("/auth/request-otp", { email }),
  verifyOtp: ({ email, otp }) => api.post("/auth/verify", { email, otp }),
  setPassword: ({ email, ticket, password, confirmPassword }) =>
    api.post("/auth/set-password", { email, ticket, password, confirmPassword }),

  // Forgot Password
  forgotRequestOtp: (email) =>
    api.post("/auth/forgot-password/request-otp", { email }),

  forgotVerifyOtp: ({ email, otp }) =>
    api.post("/auth/forgot-password/verify-otp", { email, otp }),

  forgotResetPassword: ({ ticket, password, confirmPassword }) =>
    api.post("/auth/forgot-password/reset", {
      ticket,
      password,
      confirmPassword,
    }),

  // Login with Google
  loginWithGoogle: () => {
    sessionStorage.setItem("post_login_redirect", window.location.pathname);

    window.location.href = `http://localhost:8080/oauth2/authorization/google?redirect_uri=${encodeURIComponent(
      FE_CALLBACK
    )}`;
  },
};

export default authApi;

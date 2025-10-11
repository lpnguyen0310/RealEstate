import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice";
import register from "./registerSlice";

export const store = configureStore({
  reducer: { auth,register }
});

import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice";
import register from "./registerSlice";
import pricing from "./pricingSlice";

export const store = configureStore({
  reducer: { auth, register, pricing }
});

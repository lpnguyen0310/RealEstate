import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice";
import register from "./registerSlice";
import pricing from "./pricingSlice";
import orders from "./orderSlice";
import inventoryReducer from './inventorySlice';
import property from "./propertySlice";
import adminPostsReducer from "./adminPostsSlice";
import favorite from "./favoriteSlice";
import uiReducer from "./uiSlice";
import transactionsSlice from "./transactionsSlice";
import profileReducer from "./profileSlice";
import adminOrderReducer from "./adminOrderSlice";
import supportReducer from "./supportSlice"; // 👈 thêm
// Import file API của bạn (đã đúng)
import { notificationApi } from "@/services/notificationApi";
import {reportApi} from "@/services/reportApiSlice";
import { listenerMiddleware } from "./listenerMiddleware";
import { adminListingPackageApiSlice } from "@/services/adminListingPackageApiSlice";
import { trackingApi } from "@/services/trackingApi";

export const store = configureStore({
  reducer: {
    auth,
    register,
    pricing,
    property,
    orders,
    inventory: inventoryReducer,
    adminPosts: adminPostsReducer,
    favorite: favorite,
    ui: uiReducer,
    transactions: transactionsSlice,
    profile: profileReducer,
    adminOrder: adminOrderReducer,
    support: supportReducer,
    // 1. THÊM DÒNG NÀY (Reducer):
    // Để Redux biết cách lưu trữ data của notificationApi (cache, loading, error)
    [notificationApi.reducerPath]: notificationApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    [adminListingPackageApiSlice.reducerPath]: adminListingPackageApiSlice.reducer,
    [trackingApi.reducerPath]: trackingApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(notificationApi.middleware)
      .concat(reportApi.middleware)
      .concat(adminListingPackageApiSlice.middleware)
      .concat(trackingApi.middleware)
      .prepend(listenerMiddleware.middleware),
});
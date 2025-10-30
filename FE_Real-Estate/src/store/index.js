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

// Import file API của bạn (đã đúng)
import { notificationApi } from "@/services/notificationApi";
import { listenerMiddleware } from "./listenerMiddleware";

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
    
    // 1. THÊM DÒNG NÀY (Reducer):
    // Để Redux biết cách lưu trữ data của notificationApi (cache, loading, error)
    [notificationApi.reducerPath]: notificationApi.reducer
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(notificationApi.middleware)
      .prepend(listenerMiddleware.middleware),
});
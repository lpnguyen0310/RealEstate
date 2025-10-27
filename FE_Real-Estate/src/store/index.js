import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice";
import register from "./registerSlice";
import pricing from "./pricingSlice";
import orders from "./orderSlice";
import inventoryReducer from './inventorySlice';
import property from "./propertySlice";
import adminPostsReducer from "./adminPostsSlice";
import favoritesReducer, { persistFavorites } from "./favoriteSlice";
import uiReducer from "./uiSlice";
import transactionsSlice from "./transactionsSlice";

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
    favorites: favoritesReducer,
    ui: uiReducer, 
    transactions: transactionsSlice,
    
    // 1. THÊM DÒNG NÀY (Reducer):
    // Để Redux biết cách lưu trữ data của notificationApi (cache, loading, error)
    [notificationApi.reducerPath]: notificationApi.reducer
  },
  
  // 2. THÊM KHỐI NÀY (Middleware):
  // Để RTK Query có thể xử lý việc gọi API, cache, và tự động refresh
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(notificationApi.middleware)
      .prepend(listenerMiddleware.middleware),
});
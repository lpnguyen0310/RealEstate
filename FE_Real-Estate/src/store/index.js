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
export const store = configureStore({
  reducer: { auth, register, pricing, property, orders, inventory: inventoryReducer, adminPosts: adminPostsReducer ,    favorites: favoritesReducer,  ui: uiReducer
},
});
persistFavorites(store);
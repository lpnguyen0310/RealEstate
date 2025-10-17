import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice";
import register from "./registerSlice";
import pricing from "./pricingSlice";
import orders from "./orderSlice";
import inventoryReducer from './inventorySlice';

export const store = configureStore({
  reducer: { auth, register, pricing, orders, inventory: inventoryReducer },
});

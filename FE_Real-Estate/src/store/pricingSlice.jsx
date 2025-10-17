// src/store/pricingSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchPricingCatalog } from "@/services/pricing";            // ✅ đúng alias
import { normalizeAndMerge } from "@/utils/pricingTransform";        // ✅ đúng alias
import { SINGLE as MOCK_SINGLE, COMBOS as MOCK_COMBOS } from "@/data/PurchagePostData/PurchageData";

export const loadPricing = createAsyncThunk("pricing/load", async (_, { rejectWithValue }) => {
  try {
    const apiData = await fetchPricingCatalog();
    const merged = normalizeAndMerge(apiData, MOCK_SINGLE, MOCK_COMBOS);
    return merged; // { SINGLE, COMBOS, ALL_ITEMS }
  } catch (e) {
    const merged = normalizeAndMerge([], MOCK_SINGLE, MOCK_COMBOS); // fallback mock
    return rejectWithValue({ error: (e && e.message) ? e.message : "load failed", merged });
  }
});

const initialState = {
  SINGLE: [],
  COMBOS: [],
  ALL_ITEMS: [],
  loading: false,
  error: null,
};

const pricingSlice = createSlice({
  name: "pricing",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadPricing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPricing.fulfilled, (state, action) => {
        state.loading = false;
        state.SINGLE = action.payload.SINGLE;
        state.COMBOS = action.payload.COMBOS;
        state.ALL_ITEMS = action.payload.ALL_ITEMS;
      })
      .addCase(loadPricing.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload && action.payload.error) ? action.payload.error : "Lỗi tải bảng giá";
        if (action.payload && action.payload.merged) {
          state.SINGLE = action.payload.merged.SINGLE;
          state.COMBOS = action.payload.merged.COMBOS;
          state.ALL_ITEMS = action.payload.merged.ALL_ITEMS;
        }
      });
  },
});

export default pricingSlice.reducer;

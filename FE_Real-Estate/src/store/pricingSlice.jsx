import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchPricingCatalog } from "@/services/pricing";

// ==========================================================
// BỘ CHUYỂN ĐỔI (ADAPTER) - Tương tự như API Slice của Admin
// Chúng ta sẽ "dịch" DTO của Backend sang định dạng UI cần
// ==========================================================

const fmtVND = (n) => (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// (Backend) ListingPackageDTO -> (React) State cho SingleCard
// (Backend) ListingPackageDTO -> (React) State cho SingleCard
const transformSingle = (pkg) => {
    return {
        id: pkg.id,
        title: pkg.name, // "Gói VIP Mới"
        
        // ===== SỬA Ở ĐÂY =====
        // "Dịch" trường backend sang trường UI
        desc: pkg.description, // 'desc' (UI) = 'description' (BE)
        tag: pkg.highlightTag, // 'tag' (UI) = 'highlightTag' (BE)
        note: pkg.boostFactor > 1 ? `x${pkg.boostFactor} lượt xem` : "Đăng tin cơ bản", // 'note' (UI) = tự tạo
        // ===== KẾT THÚC SỬA =====

        price: pkg.price,
        priceText: pkg.price === 0 ? "Miễn phí" : fmtVND(pkg.price),
        
        // (Xóa 'chip', vì 'tag' đã thay thế nó rồi)
        // chip: pkg.highlightTag || (pkg.boostFactor > 1 ? `x${pkg.boostFactor}` : "Cơ bản"),
        
        _raw: pkg, // Giữ lại data gốc
    };
};

// (Backend) ListingPackageDTO -> (React) State cho ComboCard
const transformCombo = (pkg) => {
    const originalPrice = pkg.priceOriginal || 0;
    const salePrice = pkg.price || 0;
    
    let discountPercent = 0;
    if (originalPrice > 0 && salePrice < originalPrice) {
        discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    }

   return {
        id: pkg.id,
        title: pkg.name,
        chip: pkg.highlightTag,
        sub: pkg.description,
        old: originalPrice,
        price: salePrice,
        save: discountPercent,
        _raw: pkg, // Giữ lại data gốc (rất quan trọng)
        
        // (Bỏ 'items' cũ, vì _raw đã chứa nó)
        // items: (pkg.items || []).map((it) => ({ ... })), 
    };
};


// THUNK MỚI (đã loại bỏ Mock data)
export const loadPricing = createAsyncThunk("pricing/load", async (_, { rejectWithValue }) => {
  try {
    const apiData = await fetchPricingCatalog(); // Chỉ gọi API
    
    // Tách và chuyển đổi dữ liệu ngay tại đây
    const SINGLE = [];
    const COMBOS = [];
    const ALL_ITEMS = [];

    (apiData || []).forEach(pkg => {
        if (pkg.packageType === "SINGLE") {
            const transformed = transformSingle(pkg);
            SINGLE.push(transformed);
            ALL_ITEMS.push(transformed);
        } else if (pkg.packageType === "COMBO") {
            const transformed = transformCombo(pkg);
            COMBOS.push(transformed);
            ALL_ITEMS.push(transformed);
        }
    });

    return { SINGLE, COMBOS, ALL_ITEMS }; 
  } catch (e) {
    return rejectWithValue((e && e.message) ? e.message : "load failed");
  }
});

const initialState = {
  SINGLE: [],
  COMBOS: [],
  ALL_ITEMS: [],
  loading: true, // Mặc định là true khi bắt đầu
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
        state.error = action.payload || "Lỗi tải bảng giá";
        // Không còn fallback về mock data nữa
        state.SINGLE = []; 
        state.COMBOS = [];
        state.ALL_ITEMS = [];
      });
  },
});

export default pricingSlice.reducer;
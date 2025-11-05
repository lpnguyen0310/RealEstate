import { createApi } from "@reduxjs/toolkit/query/react";
import api from "@/api/axios"; // <-- Import instance axios CÓ SẴN của bạn
import { axiosBaseQuery } from "@/services/axiosBaseQuery"; // <-- Import file bắc cầu

// ==========================================================
// BỘ CHUYỂN ĐỔI (ADAPTER)
// Logic chuyển đổi (giống hệt file service trước)
// Chúng ta cần nó để "dịch" dữ liệu qua lại
// ==========================================================

// (Backend) ListingPackageDTO -> (React) ListingType
const fromBackendListingType = (pkg) => ({
  id: pkg.id,
  code: pkg.code,
  name: pkg.name,
  description: pkg.description,
  price: pkg.price,
  maxDays: pkg.durationDays,
  highlightFactor: pkg.boostFactor,
  isActive: pkg.isActive,
  createdAt: pkg.createdAt,
});

// (Backend) ListingPackageDTO -> (React) Combo
const fromBackendCombo = (pkg) => {
  const originalPrice = pkg.priceOriginal || 0;
  const salePrice = pkg.price || 0;
  let discountPercent = 0;
  if (originalPrice > 0 && salePrice < originalPrice) {
    discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }
  return {
    id: pkg.id,
    code: pkg.code,
    name: pkg.name,
    description: pkg.description,
    originalPrice: pkg.priceOriginal,
    discountPercent: discountPercent,
    salePrice: pkg.price,
    durationDays: pkg.durationDays,
    items: (pkg.items || []).map((it) => ({
      typeCode: it.listingType,
      qty: it.quantity,
    })),
    isActive: pkg.isActive,
    createdAt: pkg.createdAt,
  };
};

// (React) ListingType -> (Backend) ListingPackageDTO
const toBackendListingType = (lt) => ({
  id: lt.id,
  code: lt.code,
  name: lt.name,
  description: lt.description,
  price: lt.price,
  durationDays: lt.maxDays,
  boostFactor: lt.highlightFactor,
  isActive: lt.isActive,
  packageType: "SINGLE",
  listingType: lt.listingType,
  items: [],
});

// (React) Combo -> (Backend) ListingPackageDTO
const toBackendCombo = (cb) => ({
  id: cb.id,
  code: cb.code,
  name: cb.name,
  description: cb.description,
  priceOriginal: cb.originalPrice,
  price: cb.salePrice,
  durationDays: cb.durationDays,
  items: (cb.items || []).map((it) => ({
    listingType: it.typeCode,
    quantity: it.qty,
  })),
  isActive: cb.isActive,
  packageType: "COMBO",
  listingType: null,
});

// ==========================================================
// API SLICE
// ==========================================================

export const adminListingPackageApiSlice = createApi({
  reducerPath: "adminListingPackageApi", // Tên trong Redux state
  baseQuery: axiosBaseQuery({ axiosInstance: api }), // Dùng axios của bạn
  tagTypes: ["ListingPackage"], // Dùng để-caching

  endpoints: (builder) => ({
    /**
     * Fetch một lần, trả về cả 2 danh sách (đã được chuyển đổi)
     */
    getActiveCatalog: builder.query({
      // `query` sẽ gọi tới GET /api/pricing/catalog (vì base URL là /api/pricing)
      // (File controller của bạn là: PricingCatalogController)
      query: () => ({ url: "/pricing/catalog", method: "GET" }),

      /**
       * (Quan trọng) Chuyển đổi response từ backend
       * Tự động tách 1 mảng từ API thành 2 mảng cho UI
       */
      transformResponse: (response, meta, arg) => {
        const allPackages = response.data || []; // Giả sử API trả về { data: [...] }
        const listingTypes = [];
        const combos = [];

        allPackages.forEach((pkg) => {
          if (pkg.packageType === "SINGLE") {
            listingTypes.push(fromBackendListingType(pkg));
          } else if (pkg.packageType === "COMBO") {
            combos.push(fromBackendCombo(pkg));
          }
        });

        return { listingTypes, combos }; // Trả về object UI cần
      },
      
      // Cung cấp tag "LIST" để các mutation có thể làm vô hiệu (invalidate)
      providesTags: (result) => [{ type: "ListingPackage", id: "LIST" }],
    }),

    /**
     * Tạo/Cập nhật một Gói lẻ (ListingType)
     */
    upsertListingType: builder.mutation({
      // `query` sẽ nhận `payload` là object `form` từ React
      query: (reactListingTypeForm) => ({
        url: "/pricing/packages", // POST /api/pricing/packages
        method: "POST",
        // Tự động chuyển đổi sang DTO mà backend cần
        data: toBackendListingType(reactListingTypeForm),
      }),
      // Sau khi thành công, làm mới lại cache của "LIST"
      invalidatesTags: [{ type: "ListingPackage", id: "LIST" }],
    }),

    /**
     * Tạo/Cập nhật một Gói Combo
     */
    upsertCombo: builder.mutation({
      query: (reactComboForm) => ({
        url: "/pricing/packages", // POST /api/pricing/packages
        method: "POST",
        data: toBackendCombo(reactComboForm),
      }),
      invalidatesTags: [{ type: "ListingPackage", id: "LIST" }],
    }),

    /**
     * Xóa một gói (Lẻ hoặc Combo)
     */
    deletePackage: builder.mutation({
      // `id` được truyền trực tiếp vào
      query: (id) => ({
        url: `/pricing/packages/${id}`, // DELETE /api/pricing/packages/{id}
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ListingPackage", id: "LIST" }],
    }),
  }),
});

// Tự động tạo hooks cho bạn sử dụng
export const {
  useGetActiveCatalogQuery,
  useUpsertListingTypeMutation,
  useUpsertComboMutation,
  useDeletePackageMutation,
} = adminListingPackageApiSlice;
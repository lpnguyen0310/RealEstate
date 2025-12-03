import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery"; 
import api from "@/api/axios"; 

export const trackingApi = createApi({
reducerPath: "trackingApi", 
baseQuery: axiosBaseQuery({ axiosInstance: api }), 

tagTypes: ['Leads'], // Giữ nguyên

endpoints: (builder) => ({
trackZaloClick: builder.mutation({
        // ... (code giữ nguyên)
        query: (propertyId) => ({
url: `/tracking/interaction/${propertyId}?type=ZALO_CLICK`,
method: "POST",
}),
}),
trackShareClick: builder.mutation({
        // ... (code giữ nguyên)
        query: (propertyId) => ({
url: `/tracking/interaction/${propertyId}?type=SHARE`,
method: "POST",
}),
}),
trackViewPhone: builder.mutation({
        // ... (code giữ nguyên)
        query: (propertyId) => ({
url: `/tracking/lead/view-phone/${propertyId}`,
method: "POST",
}),
}),

    getMyLeads: builder.query({
      query: ({ type, page = 0, size = 10 }) => ({
        url: `/tracking/my-leads`,
        method: "GET",
        params: { type, page, size },
      }),
      // SỬA LẠI PROVIDESTAGS
      providesTags: (result) => 
        result ? [
          // Gắn tag 'LIST' cho cả trang
          ...result.content.map(({ id }) => ({ type: 'Leads', id })),
          { type: 'Leads', id: 'LIST' }, 
        ] : [{ type: 'Leads', id: 'LIST' }],
    }),

    // === THÊM MUTATION MỚI ĐỂ XÓA ===
    deleteLead: builder.mutation({
        query: (leadId) => ({
            url: `/tracking/my-leads/${leadId}`,
            method: 'DELETE',
        }),
        // Sau khi xóa, làm mới lại danh sách
        invalidatesTags: (result, error, leadId) => [{ type: 'Leads', id: 'LIST' }],
    }),
    // ==================================

}),
});

export const {
useTrackZaloClickMutation,
useTrackShareClickMutation,
useTrackViewPhoneMutation,
  useGetMyLeadsQuery,
  useDeleteLeadMutation, // <-- XUẤT HOOK MỚI
} = trackingApi;
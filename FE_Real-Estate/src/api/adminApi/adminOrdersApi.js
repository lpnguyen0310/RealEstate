// Giả định client Axios đã được cấu hình (có interceptors) được export là 'api'
import api from "@/api/axios"; 
import { message } from "antd"; // Tái sử dụng message notification

// Endpoint cơ sở cho Admin Orders
const ADMIN_ORDERS_API = '/admin/orders'; // Sửa từ /api/admin/orders thành /admin/orders vì BASE_URL đã có /api

/**
 * Hàm trợ giúp để xử lý lỗi API chung và trả về thông báo.
 * Sử dụng message của Ant Design (được import trong AdminOrder.jsx)
 */
function handleApiError(error, defaultMessage) {
    // Lấy message chi tiết từ BE (nếu có cấu trúc ApiResponse.message)
    const msg = error.response?.data?.message || defaultMessage;
    
    message.error(msg);
    // Ném lỗi để hàm fetchData có thể bắt và set loading = false
    throw error;
}

export const adminOrdersApi = {

    /**
     * Tương ứng với: GET /api/admin/orders
     */
    async search(params = {}) {
        const { page = 1, size = 10, q, status, method, sort, dateRange = 'LAST_6_MONTHS' } = params;

        // BE Spring Pageable sử dụng page index 0 (trừ 1)
        const pageIndex = page - 1; 
        const sortParam = sort ? { sort: sort } : {};

        const queryParams = {
            page: pageIndex,
            size: size,
            q: q || '',
            status: status || 'ALL',
            method: method || 'ALL',
            dateRange: dateRange,
            ...sortParam
        };

        try {
            // Sử dụng api client đã có interceptors
            const response = await api.get(ADMIN_ORDERS_API, { params: queryParams });
            
            // Response.data.data là PageResponse<OrderDTO> từ BE
            const bePageResponse = response.data.data; 

            return {
                content: bePageResponse.content || [],
                total: bePageResponse.totalElements || 0,
                page: (bePageResponse.number || 0) + 1, // Trả lại page 1-based cho Frontend
                size: bePageResponse.size || size,
            };

        } catch (error) {
            handleApiError(error, "Không tải được danh sách đơn hàng.");
        }
    },

    /**
     * Tương ứng với: GET /api/admin/orders/{id}
     */
    async getById(id) {
        try {
            const response = await api.get(`${ADMIN_ORDERS_API}/${id}`);
            return response.data.data; // Trả về OrderDTO
        } catch (error) {
            handleApiError(error, `Không tìm thấy đơn hàng ${id}.`);
        }
    },
    
    // --- HÀNH ĐỘNG ĐƠN LẺ ---

    /**
     * Tương ứng với: POST /api/admin/orders/{id}/mark-paid
     */
    async markPaid(id) {
        try {
            await api.post(`${ADMIN_ORDERS_API}/${id}/mark-paid`);
            message.success(`Đã đánh dấu đơn hàng #${id} là đã thanh toán.`); // Thêm thông báo thành công
            return { success: true };
        } catch (error) {
            // Lỗi đã được handleApiError xử lý
            throw error;
        }
    },
    
    /**
     * Tương ứng với: POST /api/admin/orders/{id}/cancel
     */
    async cancel(id) {
        try {
            await api.post(`${ADMIN_ORDERS_API}/${id}/cancel`);
            message.success(`Đã hủy đơn hàng #${id}.`);
            return { success: true };
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * Tương ứng với: POST /api/admin/orders/{id}/refund
     */
    async refund(id) {
        try {
            await api.post(`${ADMIN_ORDERS_API}/${id}/refund`);
            message.success(`Đã hoàn tiền đơn hàng #${id}.`);
            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Tương ứng với: POST /api/admin/orders/bulk-action
     */
    async bulk(ids = [], action = "paid") {
        try {
            const payload = { ids, action }; 
            await api.post(`${ADMIN_ORDERS_API}/bulk-action`, payload);
            message.success(`Đã thực hiện ${action} cho ${ids.length} đơn.`);
            return { success: true };
        } catch (error) {
            throw error;
        }
    },
};

export function normalizeApiError(e) {
    const data = e?.response?.data;
    return {
        message: data?.message || data?.error || e?.message || "Có lỗi xảy ra",
        code: data?.code || e?.response?.status || 0,
        // Nếu BE trả map lỗi field (validation) trong data.data
        fieldErrors:
            data?.data && typeof data.data === "object" ? data.data : null,
    };
}
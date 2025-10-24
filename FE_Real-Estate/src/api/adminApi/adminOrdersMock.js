// Lightweight mock order-service using localStorage
const LS_KEY = "MOCK_ORDERS_V1";
const fmtId = (n) => `ORD-${String(n).padStart(6, "0")}`;
const STATUS = ["PENDING", "UNPAID", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "REFUNDED", "FAILED", "CANCELED"];
const METHODS = ["COD", "VNPAY", "STRIPE", "BANK_QR", "ZALOPAY"];

function seedIfEmpty() {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(LS_KEY)) return;
    const now = Date.now();
    const data = [];
    for (let i = 1; i <= 120; i++) {
        data.push({
            id: fmtId(i),
            user: {
                name: `Khách hàng ${i}`,
                email: `user${i}@mail.com`,
                phone: "09" + String(10000000 + i),
                avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${i}`,
            },
            method: METHODS[i % METHODS.length],
            amount: 100000 * ((i % 7) + 3),
            status: STATUS[i % STATUS.length],
            itemsCount: (i % 4) + 1,
            createdAt: new Date(now - i * 86400000).toISOString(),
            updatedAt: new Date(now - i * 3600000).toISOString(),
            meta: {
                listingType: ["VIP", "Premium", "Standard"][i % 3],
                propertyId: 1000 + i,
                note: i % 2 ? "Đẩy tin 7 ngày" : "Gia hạn 14 ngày",
                address: "Quận 1, TP. HCM",
            },
            items: [{ sku: "LISTING-VIP-7D", name: "Đăng tin VIP 7 ngày", qty: 1, price: 1250000 }],
            timeline: [
                { key: "created", label: "Tạo đơn", time: new Date(now - i * 86400000).toISOString(), desc: "Khởi tạo đơn" },
                { key: "payment", label: "Thanh toán", time: new Date(now - i * 86400000 + 3600000).toISOString(), desc: "Kênh thanh toán" },
                { key: "processing", label: "Kích hoạt gói", time: new Date(now - i * 86400000 + 7200000).toISOString(), desc: "Kích hoạt dịch vụ" },
            ],
        });
    }
    localStorage.setItem(LS_KEY, JSON.stringify(data));
}
function readAll() { seedIfEmpty(); return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
function writeAll(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

function applyFilters(rows, { q = "", status = "ALL", method = "ALL", sort = "createdAt,DESC" }) {
    let r = [...rows];
    if (q) {
        const t = q.toLowerCase();
        r = r.filter(x =>
            x.id.toLowerCase().includes(t) ||
            x.user.name.toLowerCase().includes(t) ||
            x.user.email.toLowerCase().includes(t)
        );
    }
    if (status !== "ALL") r = r.filter(x => x.status === status);
    if (method !== "ALL") r = r.filter(x => x.method === method);

    const [field, dir = "DESC"] = sort.split(",");
    r.sort((a, b) => {
        const va = a[field] ?? a.meta?.[field];
        const vb = b[field] ?? b.meta?.[field];
        if (va > vb) return dir === "DESC" ? -1 : 1;
        if (va < vb) return dir === "DESC" ? 1 : -1;
        return 0;
    });
    return r;
}

export const adminOrdersApi = {
    async search(params = {}) {
        const { page = 1, size = 10 } = params;
        const all = readAll();
        const filtered = applyFilters(all, params);
        const start = (page - 1) * size;
        return { content: filtered.slice(start, start + size), total: filtered.length, page, size };
    },
    async getById(id) {
        const found = readAll().find(x => x.id === id);
        if (!found) throw new Error("Not found");
        return found;
    },
    async markPaid(id) {
        const all = readAll();
        const i = all.findIndex(x => x.id === id);
        if (i < 0) throw new Error("Not found");
        all[i].status = "PAID";
        all[i].updatedAt = new Date().toISOString();
        all[i].timeline.push({ key: "markPaid", label: "Đánh dấu đã thanh toán", time: all[i].updatedAt, desc: "Manual" });
        writeAll(all); return { success: true };
    },
    async cancel(id) {
        const all = readAll();
        const i = all.findIndex(x => x.id === id);
        if (i < 0) throw new Error("Not found");
        all[i].status = "CANCELED";
        all[i].updatedAt = new Date().toISOString();
        all[i].timeline.push({ key: "cancel", label: "Hủy đơn", time: all[i].updatedAt, desc: "Manual" });
        writeAll(all); return { success: true };
    },
    async refund(id) {
        const all = readAll();
        const i = all.findIndex(x => x.id === id);
        if (i < 0) throw new Error("Not found");
        all[i].status = "REFUNDED";
        all[i].updatedAt = new Date().toISOString();
        all[i].timeline.push({ key: "refund", label: "Hoàn tiền", time: all[i].updatedAt, desc: "Manual" });
        writeAll(all); return { success: true };
    },
    async bulk(ids = [], action = "paid") {
        for (const id of ids) {
            if (action === "paid") await this.markPaid(id);
            if (action === "cancel") await this.cancel(id);
            if (action === "refund") await this.refund(id);
        }
        return { success: true };
    },
};

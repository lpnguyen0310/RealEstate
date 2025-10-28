import api from "@/api/axios";

/* ===== ENV & CONST ===== */
export const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY;
export const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

/* ===== tiny utils ===== */
export const uid = () => Math.random().toString(36).slice(2);
export const cn = (...xs) => xs.filter(Boolean).join(" ");
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function timeAgoVi(ts) {
    const s = Math.max(1, Math.floor((Date.now() - (ts || 0)) / 1000));
    if (s < 60) return `${s}s trước`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}p trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}g trước`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày trước`;
    return new Date(ts).toLocaleString("vi-VN", { hour12: false });
}

/* ===== OpenRouter call ===== */
export async function callAI(historyMsgs) {
    if (!OPENROUTER_KEY) return "⚠️ Thiếu VITE_OPENROUTER_KEY trong .env.local";
    const sys = {
        role: "system",
        content:
            "Bạn là trợ lý bất động sản nói tiếng Việt, văn phong gọn, dùng bullet khi phù hợp. " +
            "Hỗ trợ: /search (lọc tin), /mortgage (tính vay), /estimate (định giá), /amenities (tiện ích).",
    };
    const cleaned = (historyMsgs || [])
        .filter((m) => typeof m?.content === "string" && m.content.trim())
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENROUTER_KEY}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "RealEstateX",
            },
            body: JSON.stringify({ model: MODEL, messages: [sys, ...cleaned], temperature: 0.6 }),
        });
        if (!res.ok) return `⚠️ OpenRouter ${res.status}: ${(await res.text()).slice(0, 160)}`;
        const data = await res.json();
        return data?.choices?.[0]?.message?.content?.trim() || "(empty)";
    } catch {
        return "⚠️ Không thể gọi OpenRouter (mạng/CORS).";
    }
}

/* ===== /search helpers ===== */
export function parseMoneyVN(s) {
    if (!s) return null;
    const x = s.toString().trim().toLowerCase().replace(/\./g, "").replace(/,/g, "");
    if (x.endsWith("k")) return Number(x.slice(0, -1)) * 1_000;
    if (/(ng|nghìn|nghin)$/.test(x)) return Number(x.replace(/[^\d]/g, "")) * 1_000;
    if (x.endsWith("m") || x.endsWith("tr")) return Number(x.replace(/[^\d]/g, "")) * 1_000_000;
    if (/(ty|tỷ|tỷ)$/.test(x)) return Number(x.replace(/[^\d]/g, "")) * 1_000_000_000;
    const n = Number(x.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : null;
}

export function parseArea(s) {
    if (!s) return null;
    const n = Number(String(s).toLowerCase().replace(/m2|m²/g, "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
}

export function parseSearchDSL(text) {
    const m = text.trim().match(/^\/search\s+(.+)$/i);
    if (!m) return null;
    const tokens = m[1].split(/\s+/).map(t => t.trim()).filter(Boolean);
    const params = {};
    for (const t of tokens) {
        const rel = t.match(/^([^=<>:]+)\s*(<=|>=|=|:)\s*(.+)$/);
        if (!rel) continue;
        const key = rel[1].toLowerCase(), op = rel[2], val = rel[3];
        if (key === "type") {
            params.type = val.toLowerCase().includes("rent") ? "rent" : "sell";
        } else if (key === "category") {
            params.category = val;
        } else if (key === "keyword" || key === "q") {
            params.keyword = val;
        } else if (key === "area") {
            params.keyword = (params.keyword ? params.keyword + " " : "") + val;
        } else if (key === "price") {
            const v = parseMoneyVN(val);
            if (v != null) {
                if (op === "<=") params.priceTo = v;
                else if (op === ">=") params.priceFrom = v;
                else params.priceFrom = params.priceTo = v;
            }
        } else if (key === "beds" || key === "bedrooms") {
            const n = Number(val.replace(/[^\d]/g, ""));
            if (Number.isFinite(n)) params.keyword = (params.keyword ? params.keyword + " " : "") + `${n} phòng ngủ`;
        } else if (key === "areasize" || key === "size" || key === "area") {
            const a = parseArea(val);
            if (a != null) {
                if (op === "<=") params.areaTo = a;
                else if (op === ">=") params.areaFrom = a;
                else params.areaFrom = params.areaTo = a;
            }
        }
    }
    return params;
}

function toNum(v) {
    if (v == null) return null;
    const n = typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : Number(v);
    return Number.isFinite(n) ? n : null;
}

export function mapPublicPropertyToCard(p) {
    if (!p) return {};
    return {
        id: p.id,
        image: p.image,
        images: Array.isArray(p.images) ? p.images : [],
        title: p.title,
        description: p.description,
        price: toNum(p.price),
        pricePerM2: toNum(p.pricePerM2),
        postedAt: p.postedAt,
        photos: p.photos,
        addressMain: p.addressFull || p.addressShort || "",
        addressShort: p.addressShort || "",
        addressFull: p.addressFull || "",
        area: p.area,
        bed: p.bed,
        bath: p.bath,
        agent: p.agent,
        type: p.type,
        category: p.category,
        listingType: p.listing_type,
    };
}

export async function searchPropertiesAPI(params) {
    const res = await api.get("/properties", { params });
    const page = res?.data?.data ?? res?.data;
    const arr = Array.isArray(page?.content) ? page.content : [];
    return {
        items: arr.map(mapPublicPropertyToCard),
        total: page?.totalElements ?? arr.length,
        page: page?.number ?? 0,
        pages: page?.totalPages ?? 1,
    };
}

export function buildSearchSummary({ total, page, pages, shownCount }) {
    const pn = (n) => new Intl.NumberFormat("vi-VN").format(n);
    const pageText = pages > 1 ? ` (trang ${page + 1}/${pages})` : "";
    if (!total) return "Chưa thấy tin nào khớp tiêu chí 😥. Bạn thử:\n• Đổi từ khóa\n• Nới khoảng giá/diện tích\n• Chọn lại loại tin";
    if (total === 1) return "Mình tìm được 1 tin đúng yêu cầu, bạn xem ngay bên dưới nhé.";
    const head = `Mình tìm được ${pn(total)} tin phù hợp${pageText}.`;
    const tail = shownCount && shownCount < total ? ` Mình hiển thị ${shownCount} tin đầu tiên trước, cần mình tải thêm không?` : "";
    return head + tail;
}

/* ===== NL → /search ===== */
export function tryAutoConvertToSearch(nlText) {
    if (!nlText) return null;
    const text = nlText.trim();
    const verbRe = /^(tìm|cho tôi xem|hiển thị|tôi muốn xem|liệt kê)\b/i;
    if (!verbRe.test(text)) return null;

    let body = text.replace(verbRe, "")
        .replace(/\b(các|những|bất động sản|tin|nhà|căn hộ|chung cư|bài đăng)\b/gi, "")
        .trim();

    let type = "";
    if (/\bthuê\b/i.test(body)) type = "type=rent";
    if (/\b(mua|bán)\b/i.test(body)) type = "type=buy";

    const priceRe = /(dưới|<=|<|trên|>=|>|từ|khoảng)\s*(\d+[.,]?\d*)\s*(tỷ|ty|triệu|tr|nghìn|nghin|k)?/i;
    let priceClause = "";
    const pm = body.match(priceRe);
    if (pm) {
        const dir = pm[1].toLowerCase(), val = pm[2], unit = pm[3] || "";
        let sign = "=";
        if (dir.includes("dưới") || dir === "<=" || dir === "<" || dir.includes("khoảng")) sign = "<=";
        if (dir.includes("trên") || dir === ">=" || dir === ">" || dir.includes("từ")) sign = sign === "<=" ? "<=" : ">=";
        priceClause = ` price${sign}${val}${unit}`;
        body = body.replace(priceRe, "").trim();
    }

    let keyword = "";
    const locRe = /(ở|tại)\s+(.+)$/i;
    const lm = body.match(locRe);
    if (lm?.[2]) keyword = lm[2].trim();
    else keyword = body.replace(/\b(ở|tại|quận|huyện|thành phố|tp\.?)\b/gi, "").replace(/\s+/g, " ").trim();

    if (keyword) keyword = keyword.replace(/[,.;\-–—]+$/, "").trim();

    const parts = ["/search"];
    if (type) parts.push(type);
    if (keyword) parts.push(`keyword=${keyword}`);
    if (priceClause) parts.push(priceClause.trim());
    const generated = parts.join(" ");
    return generated.length > "/search".length ? generated : null;
}

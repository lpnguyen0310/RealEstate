import api from "@/api/axios";

/* ===== ENV & CONST ===== */
export const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY;
export const MODEL =
    import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

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
        .map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
        }));

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENROUTER_KEY}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "RealEstateX",
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [sys, ...cleaned],
                temperature: 0.6,
            }),
        });
        if (!res.ok)
            return `⚠️ OpenRouter ${res.status}: ${(await res.text()).slice(0, 160)}`;
        const data = await res.json();
        return data?.choices?.[0]?.message?.content?.trim() || "(empty)";
    } catch {
        return "⚠️ Không thể gọi OpenRouter (mạng/CORS).";
    }
}

/* ===== /search helpers ===== */
export function parseMoneyVN(s) {
    if (!s) return null;
    const raw = String(s).trim().toLowerCase();

    // giữ lại dấu thập phân, chỉ bỏ khoảng trắng
    const x = raw.replace(/\s+/g, "");

    // helper đọc số float (hỗ trợ 6.9 hoặc 6,9)
    const readFloat = (t) => {
        const n = Number(String(t).replace(",", ".").replace(/[^\d.]/g, ""));
        return Number.isFinite(n) ? n : null;
    };

    if (x.endsWith("k")) {
        const v = readFloat(x.slice(0, -1));
        return v == null ? null : Math.round(v * 1_000);
    }

    if (/(ng|nghìn|nghin)$/.test(x)) {
        const v = readFloat(x);
        return v == null ? null : Math.round(v * 1_000);
    }

    if (x.endsWith("m") || x.endsWith("tr") || /trieu/.test(x)) {
        const v = readFloat(x);
        return v == null ? null : Math.round(v * 1_000_000);
    }

    if (/(ty|tỷ|tỷ|ti|tỉ)$/.test(x)) {
        const v = readFloat(x);
        return v == null ? null : Math.round(v * 1_000_000_000);
    }

    // fallback: số vnd thô
    const digits = Number(x.replace(/[^\d]/g, ""));
    return Number.isFinite(digits) ? digits : null;
}

export function parseArea(s) {
    if (!s) return null;
    const n = Number(
        String(s).toLowerCase().replace(/m2|m²/g, "").replace(/[^\d.]/g, "")
    );
    return Number.isFinite(n) ? n : null;
}

export function parseSearchDSL(text) {
    const m = text.trim().match(/^\/search\s+(.+)$/i);
    if (!m) return null;

    const tokens = m[1]
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

    const params = {};

    for (const t of tokens) {
        const rel = t.match(/^([^=<>:]+)\s*(<=|>=|=|:)\s*(.+)$/);
        if (!rel) continue;

        const rawKey = rel[1].trim();
        const key = rawKey.toLowerCase();
        const op = rel[2];
        const val = rel[3].trim();

        // ---- TYPE ----
        if (key === "type") {
            // "rent" => rent, còn lại mặc định sell
            params.type = val.toLowerCase().includes("rent") ? "rent" : "sell";
            continue;
        }

        // ---- CATEGORY ----
        if (key === "category") {
            params.category = val;
            continue;
        }

        // ---- KEYWORD ----
        if (key === "keyword" || key === "q") {
            params.keyword = val;
            continue;
        }

        // ---- PRICE (VND) ----
        if (key === "price") {
            const v = parseMoneyVN(val);
            if (v != null) {
                if (op === "<=") params.priceTo = v;
                else if (op === ">=") params.priceFrom = v;
                else {
                    params.priceFrom = v;
                    params.priceTo = v;
                }
            }
            continue;
        }

        // ---- AREA (m²) ----
        if (key === "areasize" || key === "size" || key === "area") {
            const a = parseArea(val);
            if (a != null) {
                if (op === "<=") params.areaTo = a;
                else if (op === ">=") params.areaFrom = a;
                else {
                    params.areaFrom = a;
                    params.areaTo = a;
                }
            }
            continue;
        }

        // ---- BEDROOMS ----
        if (key === "beds" || key === "bedrooms") {
            const n = Number(val.replace(/[^\d]/g, ""));
            if (!Number.isFinite(n)) continue;

            if (op === "<=") {
                params.bedroomsTo = n;
            } else if (op === ">=") {
                params.bedroomsFrom = n; // ≥ 2
            } else {
                params.bedroomsFrom = n;
                params.bedroomsTo = n;
            }
            continue;
        }

        // ---- BATHROOMS ----
        if (key === "baths" || key === "bathrooms") {
            const n = Number(val.replace(/[^\d]/g, ""));
            if (!Number.isFinite(n)) continue;

            if (op === "<=") {
                params.bathroomsTo = n;
            } else if (op === ">=") {
                params.bathroomsFrom = n;
            } else {
                params.bathroomsFrom = n;
                params.bathroomsTo = n;
            }
            continue;
        }

        // ---- AMENITIES (optional, dạng id) ----
        if (key === "amenities" || key === "amenity") {
            // ví dụ: amenities:1,5,7
            const ids = val
                .split(/[;,]+/)
                .map((x) => x.trim())
                .map((x) => Number(x.replace(/[^\d]/g, "")))
                .filter((x) => Number.isFinite(x));

            if (ids.length) {
                // BE đọc query param "amenities" dạng "1,5,7"
                params.amenities = ids.join(",");
                // nếu BE đọc "amenityIds" dạng List<Long> thì đổi:
                // params.amenityIds = ids;
            }
            continue;
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
    console.log("API raw p.price:", p?.price);

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
    if (!total)
        return (
            "Chưa thấy tin nào khớp tiêu chí 😥. Bạn thử:\n" +
            "• Đổi từ khóa\n" +
            "• Nới khoảng giá/diện tích\n" +
            "• Chọn lại loại tin"
        );
    if (total === 1)
        return "Mình tìm được 1 tin đúng yêu cầu, bạn xem ngay bên dưới nhé.";
    const head = `Mình tìm được ${pn(total)} tin phù hợp${pageText}.`;
    const tail =
        shownCount && shownCount < total
            ? ` Mình hiển thị ${shownCount} tin đầu tiên trước, cần mình tải thêm không?`
            : "";
    return head + tail;
}

/* ===== NL → /search (DSL text) ===== */
export function tryAutoConvertToSearch(nlText) {
    if (!nlText) return null;
    const text = nlText.trim();
    const verbRe = /^(tìm|cho tôi xem|hiển thị|tôi muốn xem|liệt kê)\b/i;
    if (!verbRe.test(text)) return null;

    let body = text
        .replace(verbRe, "")
        .replace(
            /\b(các|những|bất động sản|tin|nhà|căn hộ|chung cư|bài đăng)\b/gi,
            ""
        )
        .trim();

    let type = "";
    if (/\bthuê\b/i.test(body)) type = "type=rent";
    if (/\b(mua|bán)\b/i.test(body)) type = "type=sell";

    const priceRe =
        /(dưới|<=|<|trên|>=|>|từ|khoảng)\s*(\d+[.,]?\d*)\s*(tỷ|ty|triệu|tr|nghìn|nghin|k)?/i;
    let priceClause = "";
    const pm = body.match(priceRe);
    if (pm) {
        const dir = pm[1].toLowerCase(),
            val = pm[2],
            unit = pm[3] || "";
        let sign = "=";
        if (
            dir.includes("dưới") ||
            dir === "<=" ||
            dir === "<" ||
            dir.includes("khoảng")
        )
            sign = "<=";
        if (
            dir.includes("trên") ||
            dir === ">=" ||
            dir === ">" ||
            dir.includes("từ")
        )
            sign = sign === "<=" ? "<=" : ">=";
        priceClause = ` price${sign}${val}${unit}`;
        body = body.replace(priceRe, "").trim();
    }

    let keyword = "";
    const locRe = /(ở|tại)\s+(.+)$/i;
    const lm = body.match(locRe);
    if (lm?.[2]) keyword = lm[2].trim();
    else
        keyword = body
            .replace(/\b(ở|tại|quận|huyện|thành phố|tp\.?)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

    if (keyword) keyword = keyword.replace(/[,.;\-–—]+$/, "").trim();

    const parts = ["/search"];
    if (type) parts.push(type);
    if (keyword) parts.push(`keyword=${keyword}`);
    if (priceClause) parts.push(priceClause.trim());
    const generated = parts.join(" ");
    return generated.length > "/search".length ? generated : null;
}

/* ===== NL → params trực tiếp (không cần /search) ===== */
export function tryNLToSearchParams(nlText) {
    if (!nlText) return null;
    const original = nlText.trim();
    if (!original) return null;

    const text = original.toLowerCase();

    // ==== intent ====
    const intentRe =
        /(tìm|mua|thuê|cần|kiếm)\b.*(nhà|căn hộ|chung cư|phòng|đất|bất động sản|bđs)|\b(nhà|căn hộ|chung cư|phòng|đất|bất động sản|bđs)\b.*(tìm|mua|thuê)/;
    if (!intentRe.test(text)) return null;

    const params = {};

    // ==== TYPE ====
    if (text.includes("thuê")) params.type = "rent";
    else if (text.includes("mua") || text.includes("bán")) params.type = "sell";

    // ==== PRICE ====
    const priceRe =
        /(dưới|<=|<|trên|>=|>|từ|khoảng)\s*([\d.,]+)\s*(tỷ|ty|triệu|tr|nghìn|nghin|k)?/i;
    const pm = original.match(priceRe);
    if (pm) {
        const dir = pm[1].toLowerCase();
        const val = parseMoneyVN(pm[2] + (pm[3] || ""));
        if (val != null) {
            if (dir.includes("dưới") || dir === "<=" || dir === "<" || dir.includes("khoảng")) {
                params.priceTo = val;
            } else {
                params.priceFrom = val;
            }
        }
    }

    // ==== AREA ====
    const areaRe = /(\d+)\s*(m2|m²|m vuông|m\s*vuong)/i;
    const am = original.match(areaRe);
    if (am) {
        const a = parseArea(am[0]);
        if (a != null) params.areaFrom = a;
    }

    // ==== BEDROOMS ====
    const bedRe = /(\d+)\s*(pn|phòng ngủ|phong ngu)/i;
    const bm = original.match(bedRe);
    if (bm) {
        const n = Number(bm[1]);
        if (Number.isFinite(n)) params.bedroomsFrom = n;
    }

    // ==== BATHROOMS ====
    const bathRe = /(\d+)\s*(wc|toilet|phòng tắm|phong tam)/i;
    const wm = original.match(bathRe);
    if (wm) {
        const n = Number(wm[1]);
        if (Number.isFinite(n)) params.bathroomsFrom = n;
    }

    // ==== DIRECTION (HƯỚNG) ====
    const dirRe =
        /\b(hướng|huong)\s+(đông\s*nam|dong\s*nam|đông\s*bắc|dong\s*bac|tây\s*nam|tay\s*nam|tây\s*bắc|tay\s*bac|đông|dong|tây|tay|nam|bắc|bac)\b/i;
    const dm = original.match(dirRe);
    if (dm?.[2]) {
        let d = dm[2].trim().replace(/\s+/g, " ");
        d = d
            .replace(/^dong$/i, "Đông")
            .replace(/^tay$/i, "Tây")
            .replace(/^bac$/i, "Bắc")
            .replace(/^dong nam$/i, "Đông Nam")
            .replace(/^dong bac$/i, "Đông Bắc")
            .replace(/^tay nam$/i, "Tây Nam")
            .replace(/^tay bac$/i, "Tây Bắc");
        params.directions = d;
    }

    // ==== LOCATION ====
    const locRe = /\b(ở|tại|khu vực|khu vuc)\s+([^,.;]+)/i;
    const lm = original.match(locRe);
    if (lm?.[2]) {
        let kw = lm[2]
            .replace(/\b(có giá|giá|dưới|trên|từ|khoảng|max|<=|>=|<|>)\b.*$/i, "")
            .trim();
        if (kw) params.keyword = kw;
    }

    return Object.keys(params).length ? params : null;
}

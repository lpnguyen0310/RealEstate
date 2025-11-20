// src/components/aiChatBox/section/MultiCriteriaSearchFlow.jsx
import React, { useEffect, useState } from "react";
import { categoryApi } from "@/api/categoryApi";
import { amenityApi } from "@/api/amenityApi";

/* ========= Helper cho giá tiền (ngay trong file) ========= */

/**
 * Chuẩn hóa input giá về đơn vị "triệu".
 * Hỗ trợ:
 *  - 5tr, 5m, 5triệu → 5 (triệu)
 *  - 3ty, 3tỷ, 3b    → 3000 (triệu) = 3 tỷ
 *  - số lớn: 5_000_000 → 5 (triệu), 500_000 → 0.5 (triệu)
 *  - số nhỏ (<= 10_000) → xem như triệu đã nhập sẵn (VD: 5000 = 5000 triệu = 5 tỷ)
 */
function normalizePriceInput(raw) {
    if (raw == null) return null;
    let s = String(raw).trim().toLowerCase();
    if (!s) return null;

    // bỏ dấu , . và khoảng trắng
    s = s.replace(/[.,\s]/g, "");

    // pattern 5tr, 5triệu, 5m
    if (/^\d+(tr|triệu|trieu|m)$/.test(s)) {
        const num = parseInt(s.replace(/\D/g, ""), 10);
        return Number.isFinite(num) ? num : null; // triệu
    }

    // pattern 3ty, 3tỷ, 3b
    if (/^\d+(ty|tỷ|tyr|b)$/.test(s)) {
        const num = parseInt(s.replace(/\D/g, ""), 10);
        return Number.isFinite(num) ? num * 1000 : null; // tỷ → triệu
    }

    // chỉ là số
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) return null;

    // nếu số rất lớn (>= 100.000) → hiểu là VND, convert sang triệu
    if (n >= 100000) {
        // 500000  → 0.5 triệu
        // 5000000 → 5 triệu
        const million = n / 1_000_000;
        return Number(million.toFixed(2)); // giữ 2 số thập phân
    }

    // nhỏ hơn 100.000 → xem như đã là "triệu"
    return n;
}

/**
 * Format label để hiển thị cho user
 *  - < 1 triệu → "xxx nghìn"
 *  - 1–999 triệu → "xxx triệu"
 *  - >= 1000 triệu → "x.y tỷ"
 */
function formatPriceLabel(million) {
    if (million == null || isNaN(million)) return "";

    if (million < 1) {
        const k = (million * 1000).toFixed(0);
        return `${k} nghìn`;
    }

    if (million >= 1000) {
        const ty = (million / 1000).toFixed(1).replace(/\.0$/, "");
        return `${ty} tỷ`;
    }

    // triệu, cho phép .5 triệu
    const text = million.toFixed(1).replace(/\.0$/, "");
    return `${text} triệu`;
}

/* ================= MAIN FLOW ================= */

export default function MultiCriteriaSearchFlow({ msgHClass, onCancel, onSubmit }) {
    const [step, setStep] = useState(1);
    const [criteria, setCriteria] = useState({
        purpose: "buy",
        propertyTypes: [],      // tên category
        locationText: "",
        includeNearby: false,
        nearbyRadiusKm: 3,
        priceMin: null,         // đơn vị: triệu
        priceMax: null,
        areaMin: null,
        areaMax: null,
        bedrooms: null,
        bathrooms: null,
        amenities: [],          // tên amenity
        legalType: "",
        note: "",
    });

    const [categories, setCategories] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [metaError, setMetaError] = useState(null);

    // load category + amenity
    useEffect(() => {
        let cancelled = false;

        async function fetchMeta() {
            try {
                setLoadingMeta(true);
                setMetaError(null);
                const [cats, ams] = await Promise.all([
                    categoryApi.getAll(),
                    amenityApi.getAll(),
                ]);
                if (cancelled) return;
                setCategories(Array.isArray(cats) ? cats : []);
                setAmenities(Array.isArray(ams) ? ams : []);
            } catch (e) {
                if (cancelled) return;
                console.error("Load categories/amenities failed", e);
                setMetaError(
                    "Không tải được danh mục & tiện ích. Bạn vẫn có thể nhập tiêu chí cơ bản."
                );
            } finally {
                if (!cancelled) setLoadingMeta(false);
            }
        }

        fetchMeta();
        return () => {
            cancelled = true;
        };
    }, []);

    const goNext = () => setStep((s) => Math.min(4, s + 1));
    const goPrev = () => setStep((s) => Math.max(1, s - 1));

    const handleSubmit = () => {
        onSubmit?.(criteria);
    };

    const heightClass = msgHClass || "h-[420px]";

    return (
        <div className={`${heightClass} flex flex-col`}>
            {/* progress */}
            <div className="px-3 pt-2 pb-1 text-xs text-gray-500 flex items-center gap-2 bg-white">
                <div className="flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-[10px] text-white font-semibold">
                        {step}
                    </span>
                    <span>Bước {step} / 4</span>
                </div>
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
            </div>

            {/* meta error / loading */}
            {metaError && (
                <div className="mx-3 mt-1 mb-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    {metaError}
                </div>
            )}

            {/* body */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
                {loadingMeta ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải danh mục & tiện ích…</span>
                    </div>
                ) : (
                    <>
                        {step === 1 && (
                            <StepPurpose
                                criteria={criteria}
                                setCriteria={setCriteria}
                                categories={categories}
                            />
                        )}
                        {step === 2 && (
                            <StepLocation
                                criteria={criteria}
                                setCriteria={setCriteria}
                            />
                        )}
                        {step === 3 && (
                            <StepPriceArea
                                criteria={criteria}
                                setCriteria={setCriteria}
                            />
                        )}
                        {step === 4 && (
                            <StepMore
                                criteria={criteria}
                                setCriteria={setCriteria}
                                amenities={amenities}
                            />
                        )}
                    </>
                )}
            </div>

            {/* footer */}
            <div className="px-3 py-2 border-t border-gray-100 bg-white flex justify-between gap-2">
                <button
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={onCancel}
                >
                    Hủy
                </button>
                <div className="flex gap-2">
                    {step > 1 && (
                        <button
                            className="px-3 py-1.5 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={goPrev}
                        >
                            Quay lại
                        </button>
                    )}
                    {step < 4 ? (
                        <button
                            className="px-3 py-1.5 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700"
                            onClick={goNext}
                            disabled={loadingMeta}
                        >
                            Tiếp tục
                        </button>
                    ) : (
                        <button
                            className="px-3 py-1.5 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700"
                            onClick={handleSubmit}
                            disabled={loadingMeta}
                        >
                            Tìm tin
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ================= STEP 1: Mục đích & loại BĐS ================= */

function StepPurpose({ criteria, setCriteria, categories }) {
    const toggleType = (name) => {
        setCriteria((prev) => {
            const exists = prev.propertyTypes.includes(name);
            return {
                ...prev,
                propertyTypes: exists
                    ? prev.propertyTypes.filter((x) => x !== name)
                    : [...prev.propertyTypes, name],
            };
        });
    };

    return (
        <div className="space-y-3">
            {/* bubble */}
            <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs mt-0.5">
                    🧭
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 text-xs text-gray-700 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                    Bạn muốn <b>mua hay thuê</b>? Và đang quan tâm đến loại bất động sản nào?
                </div>
            </div>

            {/* purpose cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                    type="button"
                    onClick={() =>
                        setCriteria((p) => ({ ...p, purpose: "buy" }))
                    }
                    className={`flex flex-col items-start gap-1 px-3 py-2 rounded-xl border transition ${criteria.purpose === "buy"
                            ? "border-blue-500 bg-blue-50/80 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs">
                        🏠
                    </span>
                    <span className="font-semibold text-gray-800">Mua</span>
                    <span className="text-[11px] text-gray-500">
                        Tìm nhà / căn hộ để mua lâu dài.
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() =>
                        setCriteria((p) => ({ ...p, purpose: "rent" }))
                    }
                    className={`flex flex-col items-start gap-1 px-3 py-2 rounded-xl border transition ${criteria.purpose === "rent"
                            ? "border-blue-500 bg-blue-50/80 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs">
                        🏡
                    </span>
                    <span className="font-semibold text-gray-800">Thuê</span>
                    <span className="text-[11px] text-gray-500">
                        Thuê căn hộ, phòng trọ, văn phòng…
                    </span>
                </button>
            </div>

            {/* loại BĐS */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-700">
                        Loại bất động sản
                    </div>
                    <div className="text-[11px] text-gray-400">
                        Có thể chọn nhiều
                    </div>
                </div>

                {(!categories || categories.length === 0) ? (
                    <div className="text-[11px] text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-3 py-2">
                        Chưa có danh mục từ server. Bạn vẫn có thể tiếp tục các bước tiếp theo.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                            const label =
                                cat.name || cat.label || cat.code || "Không tên";
                            const active = criteria.propertyTypes.includes(label);
                            return (
                                <button
                                    key={cat.id || label}
                                    type="button"
                                    onClick={() => toggleType(label)}
                                    className={`px-3 py-1.5 text-xs rounded-full border transition ${active
                                            ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================= STEP 2: Khu vực ================= */

function StepLocation({ criteria, setCriteria }) {
    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs mt-0.5">
                    📍
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 text-xs text-gray-700 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                    Bạn muốn tìm bất động sản ở <b>khu vực nào</b>? (VD: Q.7, TP. Thủ Đức, Phú Nhuận…)
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                    Khu vực ưu tiên
                </div>
                <input
                    type="text"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="VD: Quận 7, TP. Hồ Chí Minh"
                    value={criteria.locationText}
                    onChange={(e) =>
                        setCriteria((p) => ({
                            ...p,
                            locationText: e.target.value,
                        }))
                    }
                />
                <p className="text-[11px] text-gray-500">
                    Có thể nhập quận, TP hoặc tên khu vực bạn muốn ưu tiên.
                </p>
            </div>

            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={criteria.includeNearby}
                        onChange={(e) =>
                            setCriteria((p) => ({
                                ...p,
                                includeNearby: e.target.checked,
                            }))
                        }
                    />
                    Chấp nhận khu vực lân cận
                </label>
                {criteria.includeNearby && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 w-12">Bán kính</span>
                        <input
                            type="number"
                            min={1}
                            max={30}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs text-right"
                            value={criteria.nearbyRadiusKm}
                            onChange={(e) =>
                                setCriteria((p) => ({
                                    ...p,
                                    nearbyRadiusKm: Number(e.target.value || 0),
                                }))
                            }
                        />
                        <span className="text-gray-600">km</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================= STEP 3: Giá & diện tích ================= */

function StepPriceArea({ criteria, setCriteria }) {
    // raw text để user nhập thoải mái, criteria.priceMin/Max lưu giá trị "triệu"
    const [rawMin, setRawMin] = useState(
        criteria.priceMin != null ? formatPriceLabel(criteria.priceMin) : ""
    );
    const [rawMax, setRawMax] = useState(
        criteria.priceMax != null ? formatPriceLabel(criteria.priceMax) : ""
    );

    // nếu criteria thay đổi từ bên ngoài thì sync lại
    useEffect(() => {
        setRawMin(
            criteria.priceMin != null ? formatPriceLabel(criteria.priceMin) : ""
        );
    }, [criteria.priceMin]);
    useEffect(() => {
        setRawMax(
            criteria.priceMax != null ? formatPriceLabel(criteria.priceMax) : ""
        );
    }, [criteria.priceMax]);

    const handleBlurMin = () => {
        const million = normalizePriceInput(rawMin);
        setCriteria((p) => ({ ...p, priceMin: million }));
        setRawMin(million != null ? formatPriceLabel(million) : "");
    };

    const handleBlurMax = () => {
        const million = normalizePriceInput(rawMax);
        setCriteria((p) => ({ ...p, priceMax: million }));
        setRawMax(million != null ? formatPriceLabel(million) : "");
    };

    const setNum = (field, val) => {
        setCriteria((p) => ({
            ...p,
            [field]: val === "" ? null : Number(val),
        }));
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs mt-0.5">
                    💰
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 text-xs text-gray-700 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                    Nhập giá thoải mái: <b>500000 → 500 nghìn</b>,{" "}
                    <b>5000000 → 5 triệu</b>, <b>5tr → 5 triệu</b>,{" "}
                    <b>3ty → 3 tỷ</b>. Hệ thống sẽ tự quy đổi.
                </div>
            </div>

            {/* Giá nhập thông minh */}
            <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Khoảng giá</div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 w-8">Từ</span>
                    <input
                        value={rawMin}
                        onChange={(e) => setRawMin(e.target.value)}
                        onBlur={handleBlurMin}
                        placeholder="VD: 5000000, 5tr, 3ty..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 w-8">Đến</span>
                    <input
                        value={rawMax}
                        onChange={(e) => setRawMax(e.target.value)}
                        onBlur={handleBlurMax}
                        placeholder="VD: 20000000, 20tr, 2ty..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <p className="text-[11px] text-gray-500">
                    Đơn vị lưu trữ là <b>triệu</b>. Ví dụ: 5.000.000 → 5 triệu, 500.000 → 0.5
                    triệu.
                </p>
            </div>

            {/* Diện tích */}
            <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                    Diện tích (m²)
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 w-8">Từ</span>
                    <input
                        type="number"
                        min={0}
                        className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-xs text-right"
                        value={criteria.areaMin ?? ""}
                        onChange={(e) => setNum("areaMin", e.target.value)}
                    />
                    <span className="text-gray-600 w-8 text-right">Đến</span>
                    <input
                        type="number"
                        min={0}
                        className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-xs text-right"
                        value={criteria.areaMax ?? ""}
                        onChange={(e) => setNum("areaMax", e.target.value)}
                    />
                </div>
            </div>

            {/* Phòng */}
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700">
                        Phòng ngủ (≥)
                    </div>
                    <select
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                        value={criteria.bedrooms ?? ""}
                        onChange={(e) =>
                            setNum("bedrooms", e.target.value || "")
                        }
                    >
                        <option value="">Không cố định</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700">
                        Phòng tắm (≥)
                    </div>
                    <select
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                        value={criteria.bathrooms ?? ""}
                        onChange={(e) =>
                            setNum("bathrooms", e.target.value || "")
                        }
                    >
                        <option value="">Không cố định</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

/* ================= STEP 4: Tiện ích, pháp lý & ghi chú ================= */

function StepMore({ criteria, setCriteria, amenities }) {
    const toggleAmenity = (name) => {
        setCriteria((prev) => {
            const exists = prev.amenities.includes(name);
            return {
                ...prev,
                amenities: exists
                    ? prev.amenities.filter((x) => x !== name)
                    : [...prev.amenities, name],
            };
        });
    };

    const summaryText = buildMiniSummary(criteria);

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-xs mt-0.5">
                    ⭐
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 text-xs text-gray-700 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                    Bạn có <b>ưu tiên tiện ích</b> hoặc <b>yêu cầu pháp lý</b> nào không?
                </div>
            </div>

            {/* Tiện ích */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-700">
                        Tiện ích mong muốn
                    </div>
                    <div className="text-[11px] text-gray-400">
                        Có thể chọn nhiều
                    </div>
                </div>

                {(!amenities || amenities.length === 0) ? (
                    <div className="text-[11px] text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-3 py-2">
                        Chưa có danh sách tiện ích từ server.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {amenities.map((a) => {
                            const label =
                                a.name || a.label || a.code || "Không tên";
                            const active = criteria.amenities.includes(label);
                            return (
                                <button
                                    key={a.id || label}
                                    type="button"
                                    onClick={() => toggleAmenity(label)}
                                    className={`px-3 py-1.5 text-xs rounded-full border transition ${active
                                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pháp lý */}
            <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                    Tình trạng pháp lý
                </div>
                <select
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={criteria.legalType}
                    onChange={(e) =>
                        setCriteria((p) => ({ ...p, legalType: e.target.value }))
                    }
                >
                    <option value="">Không yêu cầu cụ thể</option>
                    <option value="Sổ hồng">Sổ hồng</option>
                    <option value="Sổ đỏ">Sổ đỏ</option>
                    <option value="HĐ mua bán">HĐ mua bán</option>
                    <option value="Giấy tờ tay">Giấy tờ tay</option>
                </select>
            </div>

            {/* Ghi chú */}
            <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                    Ghi chú thêm (tùy chọn)
                </div>
                <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="VD: Ưu tiên view sông, không gần nghĩa trang, ..."
                    value={criteria.note}
                    onChange={(e) =>
                        setCriteria((p) => ({ ...p, note: e.target.value }))
                    }
                />
            </div>

            {/* Tóm tắt nhanh */}
            <div className="border border-gray-100 rounded-xl bg-gray-50 px-3 py-2">
                <div className="text-xs font-semibold text-gray-800 mb-1">
                    Tóm tắt nhanh
                </div>
                <pre className="text-[11px] text-gray-700 whitespace-pre-wrap">
                    {summaryText}
                </pre>
            </div>
        </div>
    );
}

function buildMiniSummary(c) {
    const parts = [];
    if (c.purpose === "buy") parts.push("Mua");
    else if (c.purpose === "rent") parts.push("Thuê");

    if (c.locationText) parts.push(c.locationText);

    if (c.priceMin || c.priceMax) {
        const min =
            c.priceMin != null ? formatPriceLabel(c.priceMin) : "0";
        const max =
            c.priceMax != null ? formatPriceLabel(c.priceMax) : "∞";
        parts.push(`Giá ${min} – ${max}`);
    }

    if (c.areaMin || c.areaMax) {
        const min = c.areaMin ? `${c.areaMin}m²` : "0m²";
        const max = c.areaMax ? `${c.areaMax}m²` : "∞";
        parts.push(`DT ${min}-${max}`);
    }

    if (c.propertyTypes?.length) {
        parts.push(c.propertyTypes.join(", "));
    }
    if (c.amenities?.length) {
        parts.push(`Tiện ích: ${c.amenities.join(", ")}`);
    }

    return parts.length ? parts.join(" • ") : "Chưa có tiêu chí cụ thể.";
}

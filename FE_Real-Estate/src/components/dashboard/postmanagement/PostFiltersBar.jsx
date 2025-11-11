// src/components/dashboard/postmanagement/PostFilters.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import dayjs from "dayjs";
import {
    TextField,
    MenuItem,
    Button as MUIButton,
    Popover,
    Drawer,
    useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import { DatePicker as AntDatePicker } from "antd";

import { PRICE_PRESETS } from "@/data/PostManagementData/FilterData";
import { locationApi } from "@/api/locationApi";

/* ================= UI TOKENS ================= */
const PILL_RADIUS = 50;

const TF_PILL = {
    "& .MuiOutlinedInput-root": {
        height: 44,
        borderRadius: PILL_RADIUS,
        backgroundColor: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        "& fieldset": { borderColor: "#e5e7eb", borderRadius: PILL_RADIUS },
        "&:hover fieldset": { borderColor: "#d1d5db" },
        "&.Mui-focused fieldset": { borderColor: "#1d4b8f" },
    },
    "& .MuiOutlinedInput-input": {
        padding: "12px 16px",
        lineHeight: "20px",
    },
    "& .MuiInputLabel-outlined": {
        transform: "translate(16px, 11px) scale(1)",
    },
    "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
        transform: "translate(14px, -6px) scale(0.75)",
    },
    "& .MuiInputLabel-root": { color: "#94a3b8" },
    "& .MuiSelect-icon": { right: 12 },
};

const BTN_BASE_SX = {
    height: 44,
    borderRadius: PILL_RADIUS,
    textTransform: "none",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
    "&:hover": { boxShadow: "0 3px 8px rgba(0,0,0,0.06)" },
};
const BTN_PRIMARY_SX = {
    ...BTN_BASE_SX,
    backgroundColor: "#163B6A",
    color: "#fff",
    "&:hover": { backgroundColor: "#1d4b8f" },
};
const BTN_OUTLINED_SX = {
    ...BTN_BASE_SX,
    borderColor: "#163B6A",
    color: "#163B6A",
    backgroundColor: "#fff",
    "&:hover": { borderColor: "#1d4b8f", backgroundColor: "rgba(29,75,143,0.06)" },
};

/* ================= HELPERS ================= */
const fmtVN = (v) =>
    v >= 1_000_000_000
        ? `${(v / 1_000_000_000).toFixed(v % 1e9 ? 1 : 0)} tỷ`
        : `${Math.round(v / 1_000_000)} triệu`;

/* ================= COMPONENT ================= */
export default function PostFilters({ onSearch, onCreate }) {
    const isMobile = useMediaQuery("(max-width: 768px)");

    // ====== states ======
    const [keyword, setKeyword] = useState(""); // q

    // ✅ City select
    const [citySlug, setCitySlug] = useState("");
    const [cities, setCities] = useState([]); // [{id, name}]

    const [expireDate, setExpireDate] = useState(null); // dayjs|null
    const [areaMin, setAreaMin] = useState("");
    const [areaMax, setAreaMax] = useState("");
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [priceLabel, setPriceLabel] = useState("Khoảng giá");

    // popovers (desktop)
    const [openArea, setOpenArea] = useState(false);
    const [openPrice, setOpenPrice] = useState(false);
    const areaAnchorRef = useRef(null);
    const priceAnchorRef = useRef(null);

    // mobile sheet
    const [sheetOpen, setSheetOpen] = useState(false);

    // ====== load cities ======
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const data = await locationApi.getCities();
                if (mounted) setCities(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Load cities failed:", e);
                if (mounted) setCities([]);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const prettyPrice = useMemo(() => {
        if (priceLabel !== "Khoảng giá") return priceLabel;
        const hasMin = priceMin !== "" && priceMin != null;
        const hasMax = priceMax !== "" && priceMax != null;
        if (!hasMin && !hasMax) return "Khoảng giá";
        if (hasMin && hasMax) return `${fmtVN(Number(priceMin))} – ${fmtVN(Number(priceMax))}`;
        if (hasMin) return `≥ ${fmtVN(Number(priceMin))}`;
        if (hasMax) return `≤ ${fmtVN(Number(priceMax))}`;
        return "Khoảng giá";
    }, [priceMin, priceMax, priceLabel]);

    // ====== actions ======
    const submit = () => {
        onSearch?.({
            q: keyword?.trim() || undefined,
            areaSlug: citySlug || undefined, // ✅ Gửi slug thay vì id
            areaMin: areaMin === "" ? undefined : Number(areaMin),
            areaMax: areaMax === "" ? undefined : Number(areaMax),
            priceMin: priceMin === "" ? undefined : Number(priceMin),
            priceMax: priceMax === "" ? undefined : Number(priceMax),
            expireDate: expireDate ? dayjs(expireDate).format("YYYY-MM-DD") : undefined,
        });
        if (isMobile) setSheetOpen(false);
    };


    const reset = () => {
        setKeyword("");
        setCitySlug(""); setAreaMin("");
        setAreaMax("");
        setPriceMin("");
        setPriceMax("");
        setPriceLabel("Khoảng giá");
        setExpireDate(null);
        onSearch?.({});
    };

    /* ===================== POPUP CONTENTS ===================== */
    const areaContent = (
        <div className="w-[280px] p-1">
            <div className="mb-2 text-sm text-gray-500">Diện tích (m²)</div>
            <div className="flex items-center gap-2">
                <TextField
                    label="Từ"
                    type="number"
                    size="small"
                    value={areaMin}
                    onChange={(e) => setAreaMin(e.target.value)}
                    sx={{ width: "100%", "& .MuiInputBase-root": { height: 36, borderRadius: 10 } }}
                />
                <span className="text-gray-400">—</span>
                <TextField
                    label="Đến"
                    type="number"
                    size="small"
                    value={areaMax}
                    onChange={(e) => setAreaMax(e.target.value)}
                    sx={{ width: "100%", "& .MuiInputBase-root": { height: 36, borderRadius: 10 } }}
                />
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <MUIButton size="small" variant="text" sx={{ textTransform: "none", minHeight: 32 }} onClick={() => { setAreaMin(""); setAreaMax(""); }}>
                    Xoá
                </MUIButton>
                <MUIButton size="small" variant="contained" sx={{ ...BTN_PRIMARY_SX, height: 32 }} onClick={() => setOpenArea(false)}>
                    OK
                </MUIButton>
            </div>
        </div>
    );

    const priceContent = (
        <div className="w:[340px] md:w-[340px] w-[300px] p-1">
            <div className="mb-2 text-sm text-gray-500">Khoảng giá (VNĐ)</div>
            <div className="flex items-center gap-2">
                <TextField
                    label="Giá từ"
                    type="number"
                    size="small"
                    value={priceMin}
                    onChange={(e) => { setPriceMin(e.target.value); setPriceLabel("Khoảng giá"); }}
                    sx={{ width: "100%", "& .MuiInputBase-root": { height: 36, borderRadius: 10 } }}
                />
                <span className="text-gray-400">—</span>
                <TextField
                    label="đến"
                    type="number"
                    size="small"
                    value={priceMax}
                    onChange={(e) => { setPriceMax(e.target.value); setPriceLabel("Khoảng giá"); }}
                    sx={{ width: "100%", "& .MuiInputBase-root": { height: 36, borderRadius: 10 } }}
                />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                {PRICE_PRESETS.map((p) => (
                    <MUIButton
                        key={p.key}
                        variant="outlined"
                        sx={{ ...BTN_OUTLINED_SX, height: 36, borderRadius: 10 }}
                        onClick={() => { setPriceMin(p.min ?? ""); setPriceMax(p.max ?? ""); setPriceLabel(p.label); }}
                    >
                        {p.label}
                    </MUIButton>
                ))}
            </div>

            <div className="mt-3 flex justify-end gap-2">
                <MUIButton
                    size="small"
                    variant="text"
                    sx={{ textTransform: "none", minHeight: 32 }}
                    onClick={() => { setPriceMin(""); setPriceMax(""); setPriceLabel("Khoảng giá"); }}
                >
                    Xoá
                </MUIButton>
                <MUIButton size="small" variant="contained" sx={{ ...BTN_PRIMARY_SX, height: 32 }} onClick={() => setOpenPrice(false)}>
                    OK
                </MUIButton>
            </div>
        </div>
    );

    /* ===================== RENDER ===================== */
    if (isMobile) {
        // ------- MOBILE -------
        return (
            <div className="bg-white border border-gray-100 rounded-[18px] shadow-[0_6px_24px_rgba(0,0,0,0.04)] p-4">
                <div className="flex flex-col gap-3">
                    <TextField
                        label="Từ khóa"
                        variant="outlined"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        fullWidth
                        sx={TF_PILL}
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                    />

                    <div className="flex items-center gap-2">
                        <MUIButton
                            variant="outlined"
                            startIcon={<FilterListIcon />}
                            sx={{ ...BTN_OUTLINED_SX, flex: 1 }}
                            onClick={() => setSheetOpen(true)}
                        >
                            Bộ lọc
                        </MUIButton>
                        <MUIButton
                            variant="contained"
                            startIcon={<SearchIcon />}
                            sx={{ ...BTN_PRIMARY_SX, flex: 1 }}
                            onClick={submit}
                        >
                            Tìm kiếm
                        </MUIButton>
                    </div>
                </div>

                {/* Bottom Sheet */}
                <Drawer
                    anchor="bottom"
                    open={sheetOpen}
                    onClose={() => setSheetOpen(false)}
                    PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, p: 2 } }}
                >
                    <div className="max-w-screen-md mx-auto w-full">
                        <div className="h-1.5 w-10 bg-gray-300 rounded-full mx-auto mb-3" />

                        {/* ✅ City */}
                        <div className="mb-3">
                            <TextField
                                label="Thành phố"
                                variant="outlined"
                                select
                                value={citySlug}
                                onChange={(e) => setCitySlug(e.target.value)}
                                fullWidth
                                sx={TF_PILL}
                                SelectProps={{
                                    MenuProps: {
                                        disablePortal: true, // 🧩 gắn menu ngay dưới input
                                        PaperProps: {
                                            style: {
                                                maxHeight: 300,           // giới hạn chiều cao
                                                marginTop: 4,             // khoảng cách nhỏ
                                                borderRadius: 8,          // bo góc menu
                                                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                                            },
                                        },
                                        MenuListProps: {
                                            sx: {
                                                py: 0.5,
                                                "& .MuiMenuItem-root": {
                                                    fontSize: 14,
                                                    py: 1,
                                                },
                                            },
                                        },
                                    },
                                }}
                            >
                                {cities.map((c) => (
                                    <MenuItem key={c.id} value={c.slug}>
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </TextField>

                        </div>

                        {/* Diện tích */}
                        <div className="mb-3">
                            <div className="mb-2 text-sm text-gray-500">Diện tích (m²)</div>
                            <div className="flex items-center gap-2">
                                <TextField
                                    label="Từ"
                                    type="number"
                                    size="small"
                                    value={areaMin}
                                    onChange={(e) => setAreaMin(e.target.value)}
                                    sx={{ width: "100%", "& .MuiInputBase-root": { height: 44, borderRadius: 14 } }}
                                />
                                <span className="text-gray-400">—</span>
                                <TextField
                                    label="Đến"
                                    type="number"
                                    size="small"
                                    value={areaMax}
                                    onChange={(e) => setAreaMax(e.target.value)}
                                    sx={{ width: "100%", "& .MuiInputBase-root": { height: 44, borderRadius: 14 } }}
                                />
                            </div>
                        </div>

                        {/* Khoảng giá */}
                        <div className="mb-3">
                            <div className="mb-2 text-sm text-gray-500">Khoảng giá (VNĐ)</div>
                            <div className="flex items-center gap-2">
                                <TextField
                                    label="Giá từ"
                                    type="number"
                                    size="small"
                                    value={priceMin}
                                    onChange={(e) => { setPriceMin(e.target.value); setPriceLabel("Khoảng giá"); }}
                                    sx={{ width: "100%", "& .MuiInputBase-root": { height: 44, borderRadius: 14 } }}
                                />
                                <span className="text-gray-400">—</span>
                                <TextField
                                    label="đến"
                                    type="number"
                                    size="small"
                                    value={priceMax}
                                    onChange={(e) => { setPriceMax(e.target.value); setPriceLabel("Khoảng giá"); }}
                                    sx={{ width: "100%", "& .MuiInputBase-root": { height: 44, borderRadius: 14 } }}
                                />
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {PRICE_PRESETS.map((p) => (
                                    <MUIButton
                                        key={p.key}
                                        variant="outlined"
                                        sx={{ ...BTN_OUTLINED_SX, height: 40, borderRadius: 12 }}
                                        onClick={() => { setPriceMin(p.min ?? ""); setPriceMax(p.max ?? ""); setPriceLabel(p.label); }}
                                    >
                                        {p.label}
                                    </MUIButton>
                                ))}
                            </div>
                        </div>

                        {/* Ngày hết hạn */}
                        <div className="mb-3">
                            <AntDatePicker
                                value={expireDate}
                                onChange={setExpireDate}
                                format="DD/MM/YYYY"
                                placeholder="Ngày hết hạn"
                                allowClear
                                className={`w-full
                  !h-11 !rounded-full !border !border-gray-200 !px-4
                  [&_.ant-picker-input>input]:!h-11
                  [&_.ant-picker-input>input]:!leading-[44px]
                  [&_.ant-picker-input>input::placeholder]:!text-gray-400
                  [&_.ant-picker-suffix]:!text-gray-400
                `}
                            />
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center gap-2">
                            <MUIButton variant="outlined" sx={{ ...BTN_OUTLINED_SX, flex: 1 }} onClick={reset}>
                                Xoá lọc
                            </MUIButton>
                            <MUIButton
                                variant="contained"
                                startIcon={<SearchIcon />}
                                sx={{ ...BTN_PRIMARY_SX, flex: 1 }}
                                onClick={submit}
                            >
                                Áp dụng
                            </MUIButton>
                        </div>
                    </div>
                </Drawer>
            </div>
        );
    }

    // ------- DESKTOP -------
    return (
        <div className="bg-white border border-gray-100 rounded-[18px] shadow-[0_6px_24px_rgba(0,0,0,0.04)] p-4 md:p-5">
            <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap">
                {/* Từ khóa */}
                <div className="basis-[260px] xl:basis-[240px] grow">
                    <TextField
                        label="Từ khóa"
                        variant="outlined"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        fullWidth
                        sx={TF_PILL}
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                    />
                </div>

                {/* ✅ City Select */}
                <div className="basis-[220px] xl:basis-[200px] grow">
                    <TextField
                        label="Thành phố"
                        select
                        value={citySlug}
                        onChange={(e) => setCitySlug(e.target.value)}
                        fullWidth
                        sx={TF_PILL}
                    >
                        {cities.map((c) => (
                            <MenuItem key={c.id} value={c.slug}>
                                {c.name}
                            </MenuItem>
                        ))}
                    </TextField>

                </div>

                {/* Diện tích (trigger) */}
                <div className="basis-[200px] xl:basis-[180px] grow">
                    <TextField
                        label="Diện tích"
                        variant="outlined"
                        value={areaMin || areaMax ? `${areaMin || 0} – ${areaMax || 0} m²` : ""}
                        placeholder=""
                        fullWidth
                        inputProps={{ readOnly: true }}
                        sx={TF_PILL}
                        onClick={() => setOpenArea(true)}
                        inputRef={areaAnchorRef}
                    />
                    <Popover
                        open={openArea}
                        onClose={() => setOpenArea(false)}
                        anchorEl={areaAnchorRef.current}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        transformOrigin={{ vertical: "top", horizontal: "left" }}
                        elevation={2}
                    >
                        {areaContent}
                    </Popover>
                </div>

                {/* Khoảng giá (trigger) */}
                <div className="basis-[200px] xl:basis-[180px] grow">
                    <TextField
                        label="Khoảng giá"
                        variant="outlined"
                        value={prettyPrice === "Khoảng giá" ? "" : prettyPrice}
                        placeholder=""
                        fullWidth
                        inputProps={{ readOnly: true }}
                        sx={TF_PILL}
                        onClick={() => setOpenPrice(true)}
                        inputRef={priceAnchorRef}
                    />
                    <Popover
                        open={openPrice}
                        onClose={() => setOpenPrice(false)}
                        anchorEl={priceAnchorRef.current}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        transformOrigin={{ vertical: "top", horizontal: "left" }}
                        elevation={2}
                    >
                        {priceContent}
                    </Popover>
                </div>

                {/* Ngày hết hạn (AntD) */}
                <div className="basis-[220px] xl:basis-[200px] grow">
                    <AntDatePicker
                        value={expireDate}
                        onChange={setExpireDate}
                        format="DD/MM/YYYY"
                        placeholder="Ngày hết hạn"
                        allowClear
                        className={`w-full
              !h-11 !rounded-full !border !border-gray-200 !px-4
              [&_.ant-picker-input>input]:!h-11
              [&_.ant-picker-input>input]:!leading-[44px]
              [&_.ant-picker-input>input::placeholder]:!text-gray-400
              [&_.ant-picker-suffix]:!text-gray-400
            `}
                    />
                </div>

                {/* Actions */}
                <div className="ml-auto flex gap-2 basis-auto shrink-0 whitespace-nowrap items-center">
                    <MUIButton variant="outlined" sx={BTN_OUTLINED_SX} onClick={reset}>
                        Xoá lọc
                    </MUIButton>

                    <MUIButton
                        variant="contained"
                        startIcon={<SearchIcon />}
                        sx={BTN_PRIMARY_SX}
                        onClick={submit}
                    >
                        Tìm Kiếm
                    </MUIButton>

                    <MUIButton
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={BTN_PRIMARY_SX}
                        onClick={onCreate}
                    >
                        Tạo Mới
                    </MUIButton>
                </div>
            </div>
        </div>
    );
}

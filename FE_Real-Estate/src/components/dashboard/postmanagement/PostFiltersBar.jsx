import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { TextField, MenuItem, Button as MUIButton, Popover } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { DatePicker as AntDatePicker } from "antd";

import {
    AREA_OPTIONS,
    PRICE_PRESETS,
} from "@/data/PostManagementData/FilterData";

/* ====== UI tokens ====== */
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

/* ===== Helpers ===== */
const fmtVN = (v) =>
    v >= 1_000_000_000
        ? `${(v / 1_000_000_000).toFixed(v % 1e9 ? 1 : 0)} tỷ`
        : `${Math.round(v / 1_000_000)} triệu`;

export default function PostFilters({ onSearch, onCreate }) {
    // ====== states ======
    const [keyword, setKeyword] = useState("");      // q
    const [area, setArea] = useState("");
    const [expireDate, setExpireDate] = useState(null); // dayjs | null

    const [areaMin, setAreaMin] = useState("");
    const [areaMax, setAreaMax] = useState("");

    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [priceLabel, setPriceLabel] = useState("Khoảng giá");

    // popovers
    const [openArea, setOpenArea] = useState(false);
    const [openPrice, setOpenPrice] = useState(false);
    const areaAnchorRef = useRef(null);
    const priceAnchorRef = useRef(null);

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
            q: keyword?.trim() || undefined,                 // từ khóa
            area: area || undefined,
            areaMin: areaMin === "" ? undefined : Number(areaMin),
            areaMax: areaMax === "" ? undefined : Number(areaMax),
            priceMin: priceMin === "" ? undefined : Number(priceMin),
            priceMax: priceMax === "" ? undefined : Number(priceMax),
            expireDate: expireDate ? dayjs(expireDate).format("YYYY-MM-DD") : undefined,
        });
    };

    const reset = () => {
        setKeyword("");
        setArea("");
        setAreaMin("");
        setAreaMax("");
        setPriceMin("");
        setPriceMax("");
        setPriceLabel("Khoảng giá");
        setExpireDate(null);
        onSearch?.({});
    };

    // ====== popover contents ======
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
                <MUIButton size="small" variant="text" sx={{ textTransform: "none", minHeight: 32 }}
                    onClick={() => { setAreaMin(""); setAreaMax(""); }}>
                    Xoá
                </MUIButton>
                <MUIButton size="small" variant="contained" sx={{ ...BTN_PRIMARY_SX, height: 32 }}
                    onClick={() => setOpenArea(false)}>
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

            {/* Presets */}
            <div className="mt-3 grid grid-cols-2 gap-2">
                {PRICE_PRESETS.map((p) => (
                    <MUIButton
                        key={p.key}
                        variant="outlined"
                        sx={{ ...BTN_OUTLINED_SX, height: 36, borderRadius: 10 }}
                        onClick={() => {
                            setPriceMin(p.min ?? "");
                            setPriceMax(p.max ?? "");
                            setPriceLabel(p.label);
                        }}
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
                <MUIButton
                    size="small"
                    variant="contained"
                    sx={{ ...BTN_PRIMARY_SX, height: 32 }}
                    onClick={() => setOpenPrice(false)}
                >
                    OK
                </MUIButton>
            </div>
        </div>
    );

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
                    />
                </div>

                {/* Khu vực */}
                <div className="basis-[220px] xl:basis-[200px] grow">
                    <TextField
                        label="Khu vực"
                        variant="outlined"
                        select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        fullWidth
                        sx={TF_PILL}
                    >
                        {AREA_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
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

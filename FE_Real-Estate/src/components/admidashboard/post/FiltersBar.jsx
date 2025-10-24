import React, { useEffect, useMemo, useState } from "react";
import { Paper, Stack, TextField, Select, MenuItem, Button } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { CATEGORIES, LISTING_TYPES } from "./constants";
import { categoryApi } from "@/api/categoryApi";

// Menu Select: neo dưới, có scroll
const MENU_PROPS = {
    anchorOrigin: { vertical: "bottom", horizontal: "left" },
    transformOrigin: { vertical: "top", horizontal: "left" },
    disableScrollLock: true,
    PaperProps: {
        sx: { maxHeight: 320, overflowY: "auto", mt: 0.5, borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
        elevation: 4,
    },
    marginThreshold: 8,
};

export default function FiltersBar({
    q, setQ,
    category, setCategory,
    listingType, setListingType,
    onSearch, onReset, // vẫn giữ để dùng nút nếu muốn
}) {
    // local draft cho ô input
    const [localQ, setLocalQ] = useState(q || "");

    // đồng bộ khi q ngoài (Redux) đổi (vd reset)
    useEffect(() => { setLocalQ(q || ""); }, [q]);

    // debounce: vừa gõ là tự setQ sau 300ms
    useEffect(() => {
        const t = setTimeout(() => {
            const next = (localQ || "").trim();
            if (next !== (q || "")) setQ(next);
        }, 300);
        return () => clearTimeout(t);
    }, [localQ]); // eslint-disable-line react-hooks/exhaustive-deps

    // ====== Category từ API ======
    const [catRaw, setCatRaw] = useState([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [catErr, setCatErr] = useState(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingCats(true);
                setCatErr(null);
                const data = await categoryApi.getAll();
                if (!alive) return;
                setCatRaw(Array.isArray(data) && data.length ? data : CATEGORIES);
            } catch (e) {
                if (!alive) return;
                setCatErr(e);
                setCatRaw(CATEGORIES);
            } finally {
                if (alive) setLoadingCats(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const catOptions = useMemo(() => {
        if (!Array.isArray(catRaw) || !catRaw.length) return [];
        const first = catRaw[0];
        return typeof first === "string"
            ? catRaw.map((s) => ({ value: s, label: s }))
            : catRaw.map((c) => ({
                value: c?.id ?? c?.value ?? c?.code ?? c?.slug ?? c?.name ?? "",
                label: c?.name ?? c?.label ?? c?.title ?? c?.slug ?? String(c?.id ?? ""),
            }));
    }, [catRaw]);

    const renderCategoryValue = (v) => {
        if (!v) return "Loại BĐS";
        const found = catOptions.find((o) => String(o.value) === String(v));
        return found?.label ?? v;
    };

    return (
        <Paper
            elevation={0}
            sx={{ p: 2, mt: 2, borderRadius: "14px", border: "1px solid #e8edf6", bgcolor: "#fff" }}
        >
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                {/* Ô search: live (debounce) */}
                <TextField
                    size="small"
                    placeholder="Tìm mã, tiêu đề…"
                    value={localQ}
                    onChange={(e) => setLocalQ(e.target.value)}
                    onKeyDown={(e) => {
                        // Optional: Enter cũng “commit” ngay lập tức
                        if (e.key === "Enter") {
                            const next = (localQ || "").trim();
                            if (next !== (q || "")) setQ(next);
                        }
                    }}
                    sx={{ width: 300 }}
                />

                {/* Loại BĐS */}
                <Select
                    size="small"
                    displayEmpty
                    value={category ?? ""}
                    onChange={(e) => setCategory(e.target.value)}
                    sx={{ minWidth: 200 }}
                    renderValue={renderCategoryValue}
                    MenuProps={MENU_PROPS}
                >
                    <MenuItem value="">
                        <em>Tất cả</em>
                    </MenuItem>

                    {loadingCats && <MenuItem disabled>Đang tải…</MenuItem>}
                    {!loadingCats &&
                        catOptions.map((c) => (
                            <MenuItem key={String(c.value)} value={c.value}>
                                {c.label}
                            </MenuItem>
                        ))}
                    {catErr && <MenuItem disabled>Không tải được danh mục (đang dùng mặc định)</MenuItem>}
                </Select>

                {/* Loại tin */}
                <Select
                    size="small"
                    displayEmpty
                    value={listingType ?? ""}
                    onChange={(e) => setListingType(e.target.value)}
                    sx={{ minWidth: 140 }}
                    renderValue={(v) => (v ? (v === "NORMAL" ? "Thường" : v) : "Loại tin")}
                    MenuProps={MENU_PROPS}
                >
                    <MenuItem value="">
                        <em>Tất cả</em>
                    </MenuItem>
                    {LISTING_TYPES.map((t) => (
                        <MenuItem key={t} value={t}>
                            {t === "NORMAL" ? "Thường" : t}
                        </MenuItem>
                    ))}
                </Select>

                {/* Nút vẫn giữ (tuỳ bạn có dùng hay không) */}
                <Button
                    variant="contained"
                    onClick={() => {
                        const next = (localQ || "").trim();
                        if (next !== (q || "")) setQ(next);
                    }}
                >
                    Tìm kiếm
                </Button>

                <Button startIcon={<RestartAltIcon />} onClick={onReset}>
                    Xóa lọc
                </Button>
            </Stack>
        </Paper>
    );
}

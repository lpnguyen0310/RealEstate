import { Paper, Stack, TextField, Select, MenuItem, Button } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { CATEGORIES, LISTING_TYPES } from "./constants";

export default function FiltersBar({ q, setQ, category, setCategory, listingType, setListingType, onSearch, onReset }) {
    return (
        <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: "14px", border: "1px solid #e8edf6", bgcolor: "#fff" }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <TextField size="small" placeholder="Tìm mã, tiêu đề…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 300 }} />

                <Select size="small" displayEmpty value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 160 }}
                    renderValue={(v) => (v ? v : "Loại BĐS")}>
                    <MenuItem value=""><em>Tất cả</em></MenuItem>
                    {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>

                <Select size="small" displayEmpty value={listingType} onChange={(e) => setListingType(e.target.value)} sx={{ minWidth: 140 }}
                    renderValue={(v) => (v ? (v === "NORMAL" ? "Thường" : v) : "Loại tin")}>
                    <MenuItem value=""><em>Tất cả</em></MenuItem>
                    {LISTING_TYPES.map((t) => <MenuItem key={t} value={t}>{t === "NORMAL" ? "Thường" : t}</MenuItem>)}
                </Select>

                <Button variant="contained" onClick={onSearch}>Tìm kiếm</Button>
                <Button startIcon={<RestartAltIcon />} onClick={onReset}>Xóa lọc</Button>
            </Stack>
        </Paper>
    );
}

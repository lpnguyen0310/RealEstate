// src/pages/Admin/AdminListingTypePackage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Paper,
    Pagination,
    PaginationItem,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
} from "@mui/icons-material";

/* =================== UI COLORS & TABLE STYLES (giống UsersTable) =================== */
const UI = {
    headBg: "#f3f7ff",
    rowHover: "#e7f0ff",
    border: "#e8edf6",
    cellBorder: "#eef2f9",
    selectedPage: "#415a8c",
    prevNextBg: "#e9eaee",
};
const tableSX = {
    mt: 2,
    borderRadius: "12px",
    border: `1px solid ${UI.border}`,
    overflow: "hidden",
    "& table": { borderCollapse: "separate", borderSpacing: 0 },
    "& thead th": {
        backgroundColor: UI.headBg,
        fontWeight: 800,
        fontFamily: "'Inter', system-ui",   // ← font

        color: "#143a78",
        letterSpacing: 0.2,
        borderBottom: `1px solid ${UI.cellBorder}`,
        whiteSpace: "nowrap",
        py: 1.5,
    },
    "& tbody td": {
        borderBottom: `1px solid ${UI.cellBorder}`,
        color: "#263b58",
        fontSize: 14,
        py: 1.25,
        transition: "background-color 140ms ease",
    },
    "& tbody tr:hover td": {
        backgroundColor: UI.rowHover,
    },
};

/* =========================================================
   MOCK DATA LAYER (UI only). Replace with real API later.
   ========================================================= */
let _ltId = 3;
let _listingTypes = [
    { id: 1, code: "NORMAL", name: "Tin Thường", description: "Đăng tin cơ bản", price: 0, maxDays: 7, highlightFactor: 1, isActive: true, createdAt: "2025-10-01T10:00:00Z" },
    { id: 2, code: "VIP", name: "Tin VIP", description: "Đầy đủ thông tin, x10 lượt xem", price: 35000, maxDays: 15, highlightFactor: 5, isActive: true, createdAt: "2025-10-05T10:00:00Z" },
    { id: 3, code: "PREMIUM", name: "Tin Premium", description: "Hiển thị ấn tượng, x50 lượt xem", price: 100000, maxDays: 30, highlightFactor: 10, isActive: true, createdAt: "2025-10-10T10:00:00Z" },
];

let _cbId = 3;
let _combos = [
    { id: 1, name: "Combo Trải nghiệm", description: "Phù hợp dùng thử", originalPrice: 125000, discountPercent: 21, salePrice: Math.round((125000 * (100 - 21)) / 100), items: [{ typeCode: "VIP", qty: 1 }, { typeCode: "PREMIUM", qty: 1 }], isActive: true, createdAt: "2025-10-01T10:00:00Z" },
    { id: 2, name: "Combo Tăng tốc", description: "Lựa chọn nhiều nhất", originalPrice: 550000, discountPercent: 27, salePrice: Math.round((550000 * (100 - 27)) / 100), items: [{ typeCode: "VIP", qty: 5 }, { typeCode: "PREMIUM", qty: 2 }], isActive: true, createdAt: "2025-10-05T10:00:00Z" },
    { id: 3, name: "Combo Dẫn đầu", description: "Giá hời nhất", originalPrice: 1500000, discountPercent: 33, salePrice: Math.round((1500000 * (100 - 33)) / 100), items: [{ typeCode: "PREMIUM", qty: 10 }], isActive: false, createdAt: "2025-10-10T10:00:00Z" },
];

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const api = {
    listingTypes: {
        async list({ q, isActive } = {}) {
            await delay();
            let rows = [..._listingTypes];
            if (q) {
                const s = q.toLowerCase();
                rows = rows.filter(
                    (x) =>
                        x.name.toLowerCase().includes(s) ||
                        (x.description || "").toLowerCase().includes(s) ||
                        (x.code || "").toLowerCase().includes(s)
                );
            }
            if (isActive !== undefined && isActive !== null) rows = rows.filter((x) => x.isActive === isActive);
            return rows;
        },
        async create(payload) {
            await delay();
            _ltId += 1;
            const row = { id: _ltId, createdAt: new Date().toISOString(), ...payload };
            _listingTypes = [row, ..._listingTypes];
            return row;
        },
        async update(id, patch) {
            await delay();
            const i = _listingTypes.findIndex((x) => x.id === id);
            if (i < 0) throw new Error("Not found");
            _listingTypes[i] = { ..._listingTypes[i], ...patch };
            return _listingTypes[i];
        },
        async remove(id) {
            await delay();
            _listingTypes = _listingTypes.filter((x) => x.id !== id);
            return { ok: true };
        },
    },
    combos: {
        async list({ q, isActive } = {}) {
            await delay();
            let rows = [..._combos];
            if (q) {
                const s = q.toLowerCase();
                rows = rows.filter(
                    (x) =>
                        x.name.toLowerCase().includes(s) ||
                        (x.description || "").toLowerCase().includes(s)
                );
            }
            if (isActive !== undefined && isActive !== null) rows = rows.filter((x) => x.isActive === isActive);
            return rows;
        },
        async create(payload) {
            await delay();
            _cbId += 1;
            const row = { id: _cbId, createdAt: new Date().toISOString(), ...payload };
            _combos = [row, ..._combos];
            return row;
        },
        async update(id, patch) {
            await delay();
            const i = _combos.findIndex((x) => x.id === id);
            if (i < 0) throw new Error("Not found");
            _combos[i] = { ..._combos[i], ...patch };
            return _combos[i];
        },
        async remove(id) {
            await delay();
            _combos = _combos.filter((x) => x.id !== id);
            return { ok: true };
        },
    },
};

/* ================= Helpers ================= */
const fmtVND = (n) => (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const typeNameByCode = (code) => {
    const t = _listingTypes.find((x) => x.code === code);
    return t ? t.name : code;
};
const sumQty = (items = []) => (items || []).reduce((acc, cur) => acc + Number(cur.qty || 0), 0);

/* ============== Reusable Confirm Dialog ============== */
function ConfirmDialog({ open, title, content, confirmText = "Xác nhận", cancelText = "Hủy", onClose, onConfirm }) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2">{content}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{cancelText}</Button>
                <Button color="error" variant="contained" onClick={onConfirm}>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/* ================= Dialogs: Create/Edit ================= */
function ListingTypeDialog({ open, onClose, initial, onSave }) {
    const isEdit = !!initial;
    const [form, setForm] = useState(
        initial || { code: "", name: "", description: "", price: 0, maxDays: 7, highlightFactor: 1, isActive: true }
    );
    useEffect(() => {
        if (open) {
            setForm(initial || { code: "", name: "", description: "", price: 0, maxDays: 7, highlightFactor: 1, isActive: true });
        }
    }, [open, initial]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? "Sửa gói đăng lẻ" : "Thêm gói đăng lẻ"}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} mt={1}>
                    <TextField label="Mã gói (code)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                    <TextField label="Tên gói" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <TextField label="Mô tả" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={2} />
                    <Stack direction="row" spacing={2}>
                        <TextField label="Giá (VND)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value || 0) })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }} />
                        <TextField label="Số ngày tối đa" type="number" value={form.maxDays} onChange={(e) => setForm({ ...form, maxDays: Number(e.target.value || 1) })} fullWidth />
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField label="Hệ số nổi bật (x)" type="number" value={form.highlightFactor} onChange={(e) => setForm({ ...form, highlightFactor: Number(e.target.value || 1) })} fullWidth />
                        <FormControlLabel control={<Switch checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Kích hoạt" />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="contained" onClick={() => onSave(form)} disabled={!form.code || !form.name}>Lưu</Button>
            </DialogActions>
        </Dialog>
    );
}

function ComboDialog({ open, onClose, initial, onSave }) {
    const isEdit = !!initial;
    const [form, setForm] = useState(
        initial || { name: "", description: "", originalPrice: 0, discountPercent: 0, salePrice: 0, isActive: true, items: [{ typeCode: "VIP", qty: 1 }] }
    );
    const allowedCodes = new Set(["VIP", "PREMIUM"]);

    useEffect(() => {
        if (open) {
            const base = initial || { name: "", description: "", originalPrice: 0, discountPercent: 0, salePrice: 0, isActive: true, items: [{ typeCode: "VIP", qty: 1 }] };
            const items = (base.items || []).filter((it) => allowedCodes.has(it.typeCode));
            setForm({ ...base, items: items.length ? items : [{ typeCode: "VIP", qty: 1 }] });
        }
    }, [open, initial]);

    const recalcSale = (originalPrice, discountPercent) => Math.max(0, Math.round(Number(originalPrice || 0) * (100 - Number(discountPercent || 0)) / 100));
    const updateField = (patch) => {
        const next = { ...form, ...patch };
        next.salePrice = recalcSale(next.originalPrice, next.discountPercent);
        setForm(next);
    };

    const addRow = () => setForm({ ...form, items: [...(form.items || []), { typeCode: "VIP", qty: 1 }] });
    const removeRow = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    const changeRow = (idx, patch) => setForm({ ...form, items: form.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });

    const totalPosts = sumQty(form.items);
    const saveDisabled =
        !form.name ||
        form.originalPrice < 0 ||
        form.discountPercent < 0 ||
        form.discountPercent > 100 ||
        !form.items || form.items.length === 0 ||
        form.items.some((it) => !allowedCodes.has(it.typeCode) || !it.qty || it.qty <= 0);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{isEdit ? "Sửa gói Combo" : "Thêm gói Combo"}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} mt={1}>
                    <TextField label="Tên combo" value={form.name} onChange={(e) => updateField({ name: e.target.value })} required />
                    <TextField label="Mô tả" value={form.description || ""} onChange={(e) => updateField({ description: e.target.value })} multiline minRows={2} />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField label="Giá gốc" type="number" value={form.originalPrice} onChange={(e) => updateField({ originalPrice: Number(e.target.value || 0) })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }} />
                        <TextField label="% khuyến mãi" type="number" value={form.discountPercent} onChange={(e) => { let v = Number(e.target.value || 0); if (v < 0) v = 0; if (v > 100) v = 100; updateField({ discountPercent: v }); }} fullWidth InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                        <TextField label="Giá bán (tự tính)" value={fmtVND(form.salePrice)} fullWidth InputProps={{ readOnly: true }} />
                        <FormControlLabel sx={{ ml: { xs: 0, sm: 2 } }} control={<Switch checked={!!form.isActive} onChange={(e) => updateField({ isActive: e.target.checked })} />} label="Kích hoạt" />
                    </Stack>

                    <Divider textAlign="left">Thành phần trong Combo</Divider>

                    <Stack spacing={1}>
                        {(form.items || []).map((it, idx) => (
                            <Stack key={idx} direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                                <FormControl sx={{ minWidth: 220 }} fullWidth>
                                    <InputLabel>Loại tin</InputLabel>
                                    <Select label="Loại tin" value={it.typeCode} onChange={(e) => changeRow(idx, { typeCode: e.target.value })}>
                                        {_listingTypes.filter((t) => t.code === "VIP" || t.code === "PREMIUM").map((t) => (
                                            <MenuItem key={t.code} value={t.code}>{t.name} ({t.code})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField label="Số lượng" type="number" sx={{ width: 160 }} value={it.qty} onChange={(e) => changeRow(idx, { qty: Math.max(1, Number(e.target.value || 1)) })} />
                                <IconButton color="error" onClick={() => removeRow(idx)}><DeleteIcon /></IconButton>
                            </Stack>
                        ))}

                        <Button startIcon={<AddIcon />} variant="outlined" onClick={addRow} sx={{ alignSelf: "flex-start", mt: 1 }}>
                            Thêm dòng
                        </Button>

                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Tổng số tin: <b>{totalPosts}</b>
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="contained" onClick={() => onSave(form)} disabled={saveDisabled}>Lưu</Button>
            </DialogActions>
        </Dialog>
    );
}

/* ================= PrettyPagination giống UsersTable ================= */
function PrettyPagination({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange }) {
    const totalPages = Math.max(1, Math.ceil(count / Math.max(1, rowsPerPage)));
    const start = count === 0 ? 0 : page * rowsPerPage + 1;
    const end = count === 0 ? 0 : Math.min(count, start + rowsPerPage - 1);

    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 2 }}
        >
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Select
                    size="small"
                    value={rowsPerPage}
                    onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                    sx={{
                        height: 40,
                        minWidth: 96,
                        borderRadius: "12px",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff", borderWidth: 1.4 },
                    }}
                >
                    {[10, 20, 50].map((v) => (<MenuItem key={v} value={v}>{v}</MenuItem>))}
                </Select>
                <Typography fontSize={13} color="#7a8aa1">
                    Hiển thị {start} đến {end} của {count}
                </Typography>
            </Stack>

            <Pagination
                page={page + 1}
                count={totalPages}
                onChange={(_, p) => onPageChange(p - 1)}
                renderItem={(item) => (
                    <PaginationItem
                        {...item}
                        slots={{
                            previous: () => <span style={{ padding: "0 10px" }}>Trước</span>,
                            next: () => <span style={{ padding: "0 10px" }}>Tiếp Theo</span>,
                        }}
                        sx={{
                            outline: "none",
                            "&:focus": { outline: "none" },
                            "&.Mui-focusVisible": { outline: "none", boxShadow: "none" },
                            height: 40,
                            minWidth: 40,
                            px: 1.5,
                            borderRadius: "12px",
                            fontSize: 13,
                            fontWeight: 600,
                            "&.MuiPaginationItem-root": { border: "1px solid #e5e7eb" },
                            "&.Mui-selected": {
                                bgcolor: UI.selectedPage,
                                color: "#fff",
                                borderColor: "transparent",
                                "&:hover": { bgcolor: UI.selectedPage },
                            },
                            "&.MuiPaginationItem-previousNext": {
                                bgcolor: UI.prevNextBg,
                                color: "#6b7280",
                                border: "none",
                                "&:hover": { bgcolor: "#dfe2e8" },
                                "&.Mui-disabled": { opacity: 0.6 },
                            },
                        }}
                    />
                )}
                sx={{
                    "& .MuiPagination-ul": { gap: "px" },
                    "& .MuiButtonBase-root": { WebkitTapHighlightColor: "transparent" },
                }}
            />
        </Stack>
    );
}

/* ================= Main Page ================= */
export default function AdminListingTypePackage() {
    /* Listing Types state */
    const [ltRows, setLtRows] = useState([]);
    const [ltSearch, setLtSearch] = useState("");
    const [ltActive, setLtActive] = useState("all");
    const [ltDialogOpen, setLtDialogOpen] = useState(false);
    const [ltEditing, setLtEditing] = useState(null);
    const [ltPage, setLtPage] = useState(0);
    const [ltRowsPerPage, setLtRowsPerPage] = useState(10);
    const [ltDeleteTarget, setLtDeleteTarget] = useState(null);

    /* Combos state */
    const [cbRows, setCbRows] = useState([]);
    const [cbSearch, setCbSearch] = useState("");
    const [cbActive, setCbActive] = useState("all");
    const [cbDialogOpen, setCbDialogOpen] = useState(false);
    const [cbEditing, setCbEditing] = useState(null);
    const [cbPage, setCbPage] = useState(0);
    const [cbRowsPerPage, setCbRowsPerPage] = useState(10);
    const [cbDeleteTarget, setCbDeleteTarget] = useState(null);

    const loadListingTypes = async () => {
        const isActive = ltActive === "all" ? null : ltActive === "active" ? true : false;
        const rows = await api.listingTypes.list({ q: ltSearch.trim(), isActive });
        setLtRows(rows);
    };
    const loadCombos = async () => {
        const isActive = cbActive === "all" ? null : cbActive === "active" ? true : false;
        const rows = await api.combos.list({ q: cbSearch.trim(), isActive });
        setCbRows(rows);
    };

    useEffect(() => {
        loadListingTypes();
        loadCombos();
    }, []);

    /* ======== Listing columns ======== */
    const listingColumns = useMemo(
        () => [
            { key: "id", label: "ID", sx: { width: 80 } },
            { key: "code", label: "Code", sx: { width: 120 } },
            { key: "name", label: "Tên gói" },
            { key: "price", label: "Giá", render: (r) => fmtVND(r.price), sx: { width: 140, textAlign: "right" } },
            { key: "maxDays", label: "Ngày tối đa", render: (r) => <Chip label={`${r.maxDays} ngày`} size="small" />, sx: { width: 140 } },
            { key: "highlightFactor", label: "Hệ số nổi bật", render: (r) => <Chip color="warning" label={`x${r.highlightFactor}`} size="small" />, sx: { width: 160 } },
            {
                key: "isActive",
                label: "Trạng thái",
                render: (r) => (
                    <Switch
                        checked={!!r.isActive}
                        onChange={async (e) => {
                            await api.listingTypes.update(r.id, { isActive: e.target.checked });
                            loadListingTypes();
                        }}
                    />
                ),
                sx: { width: 140 },
            },
            {
                key: "actions",
                label: "Hành động",
                render: (r) => (
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Sửa">
                            <IconButton size="small" onClick={() => { setLtEditing(r); setLtDialogOpen(true); }}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <IconButton size="small" color="error" onClick={() => setLtDeleteTarget(r)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ),
                sx: { width: 120 },
            },
        ],
        []
    );

    /* ======== Combo columns ======== */
    const comboColumns = useMemo(
        () => [
            { key: "id", label: "ID", sx: { width: 80 } },
            { key: "name", label: "Tên combo" },
            {
                key: "items",
                label: "Thành phần",
                render: (r) =>
                    (r.items || []).length === 0 ? (
                        <Chip label="Trống" size="small" />
                    ) : (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {r.items.map((it, i) => (
                                <Chip key={i} label={`${typeNameByCode(it.typeCode)} × ${it.qty}`} size="small" sx={{ mb: 0.5 }} />
                            ))}
                        </Stack>
                    ),
            },
            { key: "total", label: "Tổng số tin", render: (r) => <Chip label={sumQty(r.items)} size="small" />, sx: { width: 140 } },
            { key: "originalPrice", label: "Giá gốc", render: (r) => fmtVND(r.originalPrice), sx: { width: 140, textAlign: "right" } },
            { key: "discountPercent", label: "% KM", render: (r) => <Chip color="info" label={`${r.discountPercent}%`} size="small" />, sx: { width: 100 } },
            { key: "salePrice", label: "Giá bán", render: (r) => <Chip color="success" label={fmtVND(r.salePrice)} size="small" />, sx: { width: 140 } },
            {
                key: "isActive",
                label: "Trạng thái",
                render: (r) => (
                    <Switch
                        checked={!!r.isActive}
                        onChange={async (e) => {
                            await api.combos.update(r.id, { isActive: e.target.checked });
                            loadCombos();
                        }}
                    />
                ),
                sx: { width: 140 },
            },
            {
                key: "actions",
                label: "Hành động",
                render: (r) => (
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Sửa">
                            <IconButton size="small" onClick={() => { setCbEditing(r); setCbDialogOpen(true); }}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <IconButton size="small" color="error" onClick={() => setCbDeleteTarget(r)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ),
                sx: { width: 120 },
            },
        ],
        []
    );

    /* ======== Handlers ======== */
    const saveListingType = async (data) => {
        if (ltEditing) await api.listingTypes.update(ltEditing.id, data);
        else await api.listingTypes.create(data);
        setLtDialogOpen(false);
        setLtEditing(null);
        loadListingTypes();
    };

    const saveCombo = async (data) => {
        const salePrice = Math.max(0, Math.round(Number(data.originalPrice || 0) * (100 - Number(data.discountPercent || 0)) / 100));
        const payload = { ...data, salePrice };
        if (cbEditing) await api.combos.update(cbEditing.id, payload);
        else await api.combos.create(payload);
        setCbDialogOpen(false);
        setCbEditing(null);
        loadCombos();
    };

    /* ================= Render ================= */
    return (
        <Stack spacing={4}>
            {/* Listing Types */}
            <Paper elevation={1}>
                <Box p={2}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
                        <Typography variant="h6">Quản lý Gói đăng lẻ</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mô tả, code…"
                                value={ltSearch}
                                onChange={(e) => setLtSearch(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                                sx={{ width: 320 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select label="Trạng thái" value={ltActive} onChange={(e) => setLtActive(e.target.value)}>
                                    <MenuItem value="all">Tất cả</MenuItem>
                                    <MenuItem value="active">Đang bán</MenuItem>
                                    <MenuItem value="inactive">Tạm tắt</MenuItem>
                                </Select>
                            </FormControl>
                            <Tooltip title="Tải lại">
                                <IconButton onClick={loadListingTypes}><RefreshIcon /></IconButton>
                            </Tooltip>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setLtEditing(null); setLtDialogOpen(true); }}>
                                Thêm gói
                            </Button>
                        </Stack>
                    </Stack>

                    <TableContainer sx={tableSX}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {listingColumns.map((c) => (
                                        <TableCell key={c.key} sx={c.sx}>{c.label}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ltRows.slice(ltPage * ltRowsPerPage, ltPage * ltRowsPerPage + ltRowsPerPage).map((r) => (
                                    <TableRow key={r.id}>
                                        {listingColumns.map((c) => (
                                            <TableCell key={c.key} sx={c.sx}>
                                                {c.render ? c.render(r) : r[c.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <PrettyPagination
                        count={ltRows.length}
                        page={ltPage}
                        rowsPerPage={ltRowsPerPage}
                        onPageChange={(p) => setLtPage(p)}
                        onRowsPerPageChange={(rpp) => { setLtRowsPerPage(rpp); setLtPage(0); }}
                    />
                </Box>
            </Paper>

            {/* Combos */}
            <Paper elevation={1}>
                <Box p={2}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
                        <Typography variant="h6">Quản lý Gói Combo</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mô tả…"
                                value={cbSearch}
                                onChange={(e) => setCbSearch(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                                sx={{ width: 320 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select label="Trạng thái" value={cbActive} onChange={(e) => setCbActive(e.target.value)}>
                                    <MenuItem value="all">Tất cả</MenuItem>
                                    <MenuItem value="active">Đang bán</MenuItem>
                                    <MenuItem value="inactive">Tạm tắt</MenuItem>
                                </Select>
                            </FormControl>
                            <Tooltip title="Tải lại">
                                <IconButton onClick={loadCombos}><RefreshIcon /></IconButton>
                            </Tooltip>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCbEditing(null); setCbDialogOpen(true); }}>
                                Thêm combo
                            </Button>
                        </Stack>
                    </Stack>

                    <TableContainer sx={tableSX}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {comboColumns.map((c) => (
                                        <TableCell key={c.key} sx={c.sx}>{c.label}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cbRows.slice(cbPage * cbRowsPerPage, cbPage * cbRowsPerPage + cbRowsPerPage).map((r) => (
                                    <TableRow key={r.id}>
                                        {comboColumns.map((c) => (
                                            <TableCell key={c.key} sx={c.sx}>
                                                {c.render ? c.render(r) : r[c.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <PrettyPagination
                        count={cbRows.length}
                        page={cbPage}
                        rowsPerPage={cbRowsPerPage}
                        onPageChange={(p) => setCbPage(p)}
                        onRowsPerPageChange={(rpp) => { setCbRowsPerPage(rpp); setCbPage(0); }}
                    />
                </Box>
            </Paper>

            {/* Dialogs */}
            <ListingTypeDialog
                open={ltDialogOpen}
                onClose={() => { setLtDialogOpen(false); setLtEditing(null); }}
                initial={ltEditing}
                onSave={saveListingType}
            />
            <ComboDialog
                open={cbDialogOpen}
                onClose={() => { setCbDialogOpen(false); setCbEditing(null); }}
                initial={cbEditing}
                onSave={saveCombo}
            />

            {/* Confirm delete dialogs */}
            <ConfirmDialog
                open={!!ltDeleteTarget}
                title="Xác nhận xoá gói đăng lẻ"
                content={ltDeleteTarget ? `Bạn có chắc muốn xoá "${ltDeleteTarget.name}" (code: ${ltDeleteTarget.code})? Hành động không thể hoàn tác.` : ""}
                onClose={() => setLtDeleteTarget(null)}
                onConfirm={async () => {
                    await api.listingTypes.remove(ltDeleteTarget.id);
                    setLtDeleteTarget(null);
                    loadListingTypes();
                }}
                confirmText="Xoá"
            />
            <ConfirmDialog
                open={!!cbDeleteTarget}
                title="Xác nhận xoá gói Combo"
                content={cbDeleteTarget ? `Bạn có chắc muốn xoá combo "${cbDeleteTarget.name}"? Hành động không thể hoàn tác.` : ""}
                onClose={() => setCbDeleteTarget(null)}
                onConfirm={async () => {
                    await api.combos.remove(cbDeleteTarget.id);
                    setCbDeleteTarget(null);
                    loadCombos();
                }}
                confirmText="Xoá"
            />
        </Stack>
    );
}

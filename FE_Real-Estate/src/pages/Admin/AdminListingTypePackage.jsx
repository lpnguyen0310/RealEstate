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
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import {
  useGetActiveCatalogQuery,
  useUpsertListingTypeMutation,
  useUpsertComboMutation,
  useDeletePackageMutation,
} from "@/services/adminListingPackageApiSlice";

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

/* ================= Helpers ================= */
const fmtVND = (n) => (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

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
function ListingTypeDialog({ open, onClose, initial, onSave, listingTypes = [] }) {
    const isEdit = !!initial;

    // Lấy code đầu tiên trong danh sách làm mặc định
    const defaultListingType = "NORMAL";

    const [form, setForm] = useState(
        initial || { code: "", name: "", description: "", price: 0, maxDays: 7, highlightFactor: 1, isActive: true }
    );
    useEffect(() => {
        if (open) {
            const defaultType = "NORMAL";
            setForm(initial || { code: "", name: "", description: "", price: 0, maxDays: 7, highlightFactor: 1, isActive: true, listingType: defaultType });
        }
    }, [open, initial]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? "Sửa gói đăng lẻ" : "Thêm gói đăng lẻ"}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} mt={1}>
                    <TextField label="Mã gói (code)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                    <FormControl fullWidth required>
                        <InputLabel>Loại tin (ListingType)</InputLabel>
                        <Select
                            label="Loại tin (ListingType)"
                            value={form.listingType}
                            onChange={(e) => setForm({ ...form, listingType: e.target.value })}
                        >
                            {/* THAY THẾ PHẦN .map() CŨ BẰNG 3 DÒNG NÀY */}
                            <MenuItem value="NORMAL">Tin Thường (NORMAL)</MenuItem>
                            <MenuItem value="VIP">Tin VIP (VIP)</MenuItem>
                            <MenuItem value="PREMIUM">Tin Premium (PREMIUM)</MenuItem>
                            
                        </Select>
                    </FormControl>
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

function ComboDialog({ open, onClose, initial, onSave, listingTypes = [] }) {
    const isEdit = !!initial;

    // SỬA 1: Lấy ID của Gói Lẻ đầu tiên làm mặc định (thay vì "VIP")
    const defaultChildPackageId = listingTypes.length > 0 ? listingTypes[0].id : null;

    const [form, setForm] = useState(
        initial || { 
            code: "", 
            name: "", 
            description: "", 
            originalPrice: 0, 
            discountPercent: 0, 
            salePrice: 0, 
            durationDays: 30, 
            isActive: true, 
            items: [{ typeCode: defaultChildPackageId, qty: 1 }] // <-- Sửa ở đây
        }
    );
    
    // SỬA 2: Xóa 'allowedCodes' (logic Enum cũ)
    // const allowedCodes = new Set(["VIP", "PREMIUM"]); // <-- XÓA DÒNG NÀY

    useEffect(() => {
        if (open) {
            // Lấy lại ID mặc định
            const defaultId = listingTypes.length > 0 ? listingTypes[0].id : null;
            
            // Đặt state mặc định
            const base = initial || { 
                code: "", 
                name: "", 
                description: "", 
                originalPrice: 0, 
                discountPercent: 0, 
                salePrice: 0, 
                durationDays: 30, 
                isActive: true, 
                items: [{ typeCode: defaultId, qty: 1 }] // <-- Sửa ở đây
            };
            
            // SỬA 3: Logic kiểm tra item hợp lệ (dùng ID thay vì Enum)
            // Lấy danh sách ID của các Gói Lẻ đang tồn tại
            const validListingTypeIds = new Set(listingTypes.map(lt => lt.id));
            
            // Lọc các item trong combo, đảm bảo Gói Lẻ của nó vẫn còn
            const items = (base.items || []).filter((it) => 
                validListingTypeIds.has(it.typeCode) // <-- Sửa ở đây (thay cho allowedCodes.has)
            );
            
            setForm({ ...base, items: items.length ? items : [{ typeCode: defaultId, qty: 1 }] });
        }
    }, [open, initial, listingTypes]); // <-- SỬA 4: Thêm listingTypes vào dependency

    const recalcSale = (originalPrice, discountPercent) => Math.max(0, Math.round(Number(originalPrice || 0) * (100 - Number(discountPercent || 0)) / 100));
    const updateField = (patch) => {
        const next = { ...form, ...patch };
        next.salePrice = recalcSale(next.originalPrice, next.discountPercent);
        setForm(next);
    };

    // SỬA 5: addRow dùng ID mặc định
    const addRow = () => {
        const defaultId = listingTypes.length > 0 ? listingTypes[0].id : null;
        setForm({ ...form, items: [...(form.items || []), { typeCode: defaultId, qty: 1 }] });
    };

    const removeRow = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    const changeRow = (idx, patch) => setForm({ ...form, items: form.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });

    const totalPosts = sumQty(form.items);

    // SỬA 6: Logic 'saveDisabled' (dùng ID thay vì Enum)
    const validListingTypeIds = useMemo(() => 
        new Set(listingTypes.map(lt => lt.id)), 
        [listingTypes]
    );

    const saveDisabled =
        !form.code || !form.name ||
        form.originalPrice < 0 ||
        form.discountPercent < 0 ||
        form.discountPercent > 100 ||
        !form.items || form.items.length === 0 ||
        // Sửa logic kiểm tra item
        form.items.some((it) => 
            !validListingTypeIds.has(it.typeCode) || !it.qty || it.qty <= 0
        );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{isEdit ? "Sửa gói Combo" : "Thêm gói Combo"}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} mt={1}>
                    <TextField label="Tên combo" value={form.name} onChange={(e) => updateField({ name: e.target.value })} required />
                    <TextField label="Mã combo (code)" value={form.code} onChange={(e) => updateField({ code: e.target.value })} required />
                    <TextField label="Mô tả" value={form.description || ""} onChange={(e) => updateField({ description: e.target.value })} multiline minRows={2} />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField label="Giá gốc" type="number" value={form.originalPrice} onChange={(e) => updateField({ originalPrice: Number(e.target.value || 0) })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }} />
                        <TextField label="% khuyến mãi" type="number" value={form.discountPercent} onChange={(e) => { let v = Number(e.target.value || 0); if (v < 0) v = 0; if (v > 100) v = 100; updateField({ discountPercent: v }); }} fullWidth InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                        <TextField label="Thời hạn (ngày)" type="number" value={form.durationDays} onChange={(e) => updateField({ durationDays: Number(e.target.value || 1) })} sx={{ minWidth: 120 }} />
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
                                        {/* (Phần JSX .map() này đã đúng) */}
                                        {listingTypes.map((t) => (
                                            <MenuItem key={t.id} value={t.id}>
                                                {t.name} ({t.code})
                                            </MenuItem>
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
                    s      Tổng số tin: <b>{totalPosts}</b>
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

    const {
        data: catalogData, // data trả về { listingTypes, combos }
        isLoading,
        isFetching,
        refetch, // Dùng để gọi lại API (thay cho onRefresh)
    } = useGetActiveCatalogQuery();

    // 3. GỌI CÁC MUTATIONS (Create, Update, Delete)
    const [upsertListingType, { isLoading: isSavingLt }] = useUpsertListingTypeMutation();
    const [upsertCombo, { isLoading: isSavingCb }] = useUpsertComboMutation();
    const [deletePackage, { isLoading: isDeleting }] = useDeletePackageMutation();

    /* Listing Types state */
    const ltRows = catalogData?.listingTypes || [];
    const cbRows = catalogData?.combos || [];   

    // const typeNameByCode = (code) => {
    //     const t = ltRows.find((x) => x.code === code); // Giờ nó sẽ dùng ltRows từ RTK Query
    //     return t ? t.name : code;
    // };

    // Đổi tên hàm và sửa logic: tìm theo ID
    const getPackageNameById = (id) => {
        const t = ltRows.find((x) => x.id === id); // <-- Sửa thành tìm theo x.id
        return t ? t.name : id; // Trả về Tên (name) nếu tìm thấy
    };
    const [ltSearch, setLtSearch] = useState("");
    const [ltActive, setLtActive] = useState("all");
    const [ltDialogOpen, setLtDialogOpen] = useState(false);
    const [ltEditing, setLtEditing] = useState(null);
    const [ltPage, setLtPage] = useState(0);
    const [ltRowsPerPage, setLtRowsPerPage] = useState(10);
    const [ltDeleteTarget, setLtDeleteTarget] = useState(null);

    /* Combos state */
    const [cbSearch, setCbSearch] = useState("");
    const [cbActive, setCbActive] = useState("all");
    const [cbDialogOpen, setCbDialogOpen] = useState(false);
    const [cbEditing, setCbEditing] = useState(null);
    const [cbPage, setCbPage] = useState(0);
    const [cbRowsPerPage, setCbRowsPerPage] = useState(10);
    const [cbDeleteTarget, setCbDeleteTarget] = useState(null);

    const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

    const handleCloseAlert = (event, reason) => {
        if (reason === "clickaway") return;
        setAlert((s) => ({ ...s, open: false }));
    };

    const filteredLtRows = useMemo(() => {
        const statusFilter = ltActive; // "all", "active", "inactive"
        const query = ltSearch.toLowerCase().trim();

        return ltRows.filter(pkg => {
            // 1. Lọc theo Status (Dropdown)
            if (statusFilter === "active" && !pkg.isActive) return false;
            if (statusFilter === "inactive" && pkg.isActive) return false;

            // 2. Lọc theo Search Text
            if (query && 
                !pkg.name.toLowerCase().includes(query) &&
                !pkg.code.toLowerCase().includes(query) &&
                !(pkg.description || "").toLowerCase().includes(query)
            ) {
                return false;
            }
            
            return true; // Vượt qua tất cả
        });
    }, [ltRows, ltSearch, ltActive]); // Lọc lại khi data, search, status thay đổi

    const filteredCbRows = useMemo(() => {
        const statusFilter = cbActive; // "all", "active", "inactive"
        const query = cbSearch.toLowerCase().trim();

        return cbRows.filter(pkg => {
            // 1. Lọc theo Status
            if (statusFilter === "active" && !pkg.isActive) return false;
            if (statusFilter === "inactive" && pkg.isActive) return false;

            // 2. Lọc theo Search Text
            if (query && 
                !pkg.name.toLowerCase().includes(query) &&
                !(pkg.description || "").toLowerCase().includes(query)
            ) {
                return false;
            }
            
            return true;
        });
    }, [cbRows, cbSearch, cbActive]);

    // const loadListingTypes = async () => {
    //     const isActive = ltActive === "all" ? null : ltActive === "active" ? true : false;
    //     const rows = await api.listingTypes.list({ q: ltSearch.trim(), isActive });
    //     setLtRows(rows);
    // };
    // const loadCombos = async () => {
    //     const isActive = cbActive === "all" ? null : cbActive === "active" ? true : false;
    //     const rows = await api.combos.list({ q: cbSearch.trim(), isActive });
    //     setCbRows(rows);
    // };


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
                        onChange={(e) => {
                            upsertListingType({ ...r, isActive: e.target.checked });
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
                            {r.items.map((it, i) => {
                                const color =
                                    it.typeCode === "VIP"
                                        ? "warning"
                                        : it.typeCode === "PREMIUM"
                                            ? "primary"
                                            : "default";
                                return (
                                    <Chip
                                        key={i}
                                        color={color}
                                        label={`${getPackageNameById(it.typeCode)} × ${it.qty}`}
                                        size="small"
                                        sx={{
                                            mb: 0.5,
                                            fontWeight: 600,
                                            color: color === "default" ? "#333" : "#fff",
                                        }}
                                    />
                                );
                            })}
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
                        onChange={(e) => {
                            upsertCombo({ ...r, isActive: e.target.checked });
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
        try {
        const saved = await upsertListingType(data).unwrap(); // .unwrap() để bắt lỗi
        setLtDialogOpen(false);
        setLtEditing(null);
        setAlert({ open: true, message: `Đã lưu "${saved.data.name}" thành công!`, severity: "success" });
        } catch (err) {
            console.error("Failed to save listing type:", err);
          // ===== THÊM DÒNG NÀY (CHO LỖI) =====
          setAlert({ open: true, message: err.data?.message || "Lưu gói lẻ thất bại", severity: "error" });
        }
    };

    const saveCombo = async (data) => {
        const salePrice = Math.max(0, Math.round(Number(data.originalPrice || 0) * (100 - Number(data.discountPercent || 0)) / 100));
        const payload = { ...data, salePrice };
        
        try {
            const saved = await upsertCombo(payload).unwrap();
            setCbDialogOpen(false);
            setCbEditing(null);
            setAlert({ open: true, message: `Đã lưu "${saved.data.name}" thành công!`, severity: "success" });
        } catch (err) {
          console.error("Failed to save combo:", err);
          setAlert({ open: true, message: err.data?.message || "Lưu combo thất bại", severity: "error" });
        }
    };

    const handleDeleteListingType = async () => {
        const nameToDelete = ltDeleteTarget?.name || 'Gói'; // Giữ tên lại
        try {
            await deletePackage(ltDeleteTarget.id).unwrap();
            setLtDeleteTarget(null);
            setAlert({ open: true, message: `Đã xóa "${nameToDelete}"`, severity: "success" });
        } catch (err) {
            console.error("Failed to delete package:", err);
            setAlert({ open: true, message: err.data?.message || "Xóa thất bại", severity: "error" });
        }
    };
    
    const handleDeleteCombo = async () => {
        const nameToDelete = cbDeleteTarget?.name || 'Combo'; // Giữ tên lại
        try {
            await deletePackage(cbDeleteTarget.id).unwrap();
            setCbDeleteTarget(null);
            setAlert({ open: true, message: `Đã xóa "${nameToDelete}"`, severity: "success" });
        } catch (err) {
            console.error("Failed to delete package:", err);
            setAlert({ open: true, message: err.data?.message || "Xóa thất bại", severity: "error" });
        }
    };

    /* ================= Render ================= */
    // Thêm xử lý `isLoading`
    if (isLoading) {
        return <Typography>Đang tải dữ liệu...</Typography>; // Hoặc Skeleton
    }

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
                                <IconButton onClick={refetch} disabled={isFetching}><RefreshIcon /></IconButton>
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
                                {filteredLtRows.slice(ltPage * ltRowsPerPage, ltPage * ltRowsPerPage + ltRowsPerPage).map((r) => (
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
                        count={filteredLtRows.length}
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
                                <IconButton onClick={refetch} disabled={isFetching}><RefreshIcon /></IconButton>
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
                                {filteredCbRows.slice(cbPage * cbRowsPerPage, cbPage * cbRowsPerPage + cbRowsPerPage).map((r) => (
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
                        count={filteredCbRows.length}
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
                listingTypes={ltRows}
            />
            <ComboDialog
                open={cbDialogOpen}
                onClose={() => { setCbDialogOpen(false); setCbEditing(null); }}
                initial={cbEditing}
                onSave={saveCombo}
                listingTypes={ltRows}
            />

            {/* Confirm delete dialogs */}
            <ConfirmDialog
                open={!!ltDeleteTarget}
                title="Xác nhận xoá gói đăng lẻ"
                content={ltDeleteTarget ? `Bạn có chắc muốn xoá "${ltDeleteTarget.name}" (code: ${ltDeleteTarget.code})? Hành động không thể hoàn tác.` : ""}
                onClose={() => setLtDeleteTarget(null)}
                onConfirm={handleDeleteListingType}
                confirmText="Xoá"
            />
            <ConfirmDialog
                open={!!cbDeleteTarget}
                title="Xác nhận xoá gói Combo"
                content={cbDeleteTarget ? `Bạn có chắc muốn xoá combo "${cbDeleteTarget.name}"? Hành động không thể hoàn tác.` : ""}
                onClose={() => setCbDeleteTarget(null)}
                onConfirm={handleDeleteCombo}
                confirmText="Xoá"
            />
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <MuiAlert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: "100%" }} variant="filled">
                    {alert.message}
                </MuiAlert>
            </Snackbar>
        </Stack>
    );
}

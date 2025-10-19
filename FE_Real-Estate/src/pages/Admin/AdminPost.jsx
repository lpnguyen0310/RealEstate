// src/pages/Admin/AdminPostsMUI.jsx
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
    Avatar, Box, Button, Card, CardContent, Chip, Divider, Drawer, Grid, IconButton, LinearProgress,
    MenuItem, Pagination, PaginationItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Tooltip, Typography
} from "@mui/material";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import HighlightOffOutlinedIcon2 from "@mui/icons-material/HighlightOffOutlined";

const HOVER_BG = "#dbe7ff";

/* ---------- Trạng thái ---------- */
const STATUS_LABEL = {
    PUBLISHED: "Đang Đăng",
    PENDING: "Chờ Duyệt",
    DRAFT: "Nháp",
    REJECTED: "Bị Từ Chối",
    EXPIRED: "Hết Hạn",
    EXPIRING_SOON: "Sắp Hết Hạn",
    HIDDEN: "Đã Ẩn",
};

const STATUS_CHIP_COLOR = {
    PUBLISHED: "success",
    PENDING: "warning",
    DRAFT: "info",
    REJECTED: "error",
    EXPIRED: "default",
    EXPIRING_SOON: "warning",
    HIDDEN: "default",
};

const fmtDate = (v) => (v && dayjs(v).isValid() ? dayjs(v).format("HH:mm DD/MM/YYYY") : "-");

/* ---------- Lọc bổ sung ---------- */
const CATEGORIES = ["Căn hộ", "Nhà phố", "Đất nền", "Mặt bằng", "Văn phòng"];
const LISTING_TYPES = ["NORMAL", "PREMIUM", "VIP"];

/* ---------- Mock data (đủ field cho Drawer) ---------- */
const INITIAL_POSTS = [
    {
        id: "TD-1001",
        title: "Căn hộ 2PN – Q.1, view sông",
        category: "Căn hộ",
        listingType: "NORMAL",
        area: 75,
        displayAddress: "Quận 1, TP.HCM",
        description: "Căn hộ 2PN, đã có sổ, view sông thoáng mát, nội thất đầy đủ.",
        images: [
            "https://images.unsplash.com/photo-1505691723518-36a5ac3b2ccb?q=80&w=1200",
            "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200",
        ],
        price: 5200000000,
        status: "PENDING",
        createdAt: "2025-06-20T08:30:00Z",
        expiresAt: "2025-07-20T08:30:00Z",
        author: { name: "Nguyễn Văn A", email: "a@example.com" },
        audit: [{ at: "20/06/2025 15:30", by: "system", type: "CREATED", message: "Người dùng tạo tin" }],
    },
    {
        id: "TD-1002",
        title: "Nhà phố 4x20, Q.7 – nội thất cao cấp",
        category: "Nhà phố",
        listingType: "PREMIUM",
        area: 80,
        displayAddress: "Quận 7, TP.HCM",
        description: "Nhà phố 1 trệt 2 lầu, nội thất cao cấp, khu dân cư an ninh.",
        images: ["https://images.unsplash.com/photo-1600585154340-1e4ce9a1428b?q=80&w=1200"],
        price: 8200000000,
        status: "PUBLISHED",
        createdAt: "2025-06-05T09:10:00Z",
        expiresAt: dayjs().add(5, "day").toISOString(),
        author: { name: "Trần Thị B", email: "b@example.com" },
        audit: [{ at: "05/06/2025 16:10", by: "Admin", type: "APPROVED", message: "Duyệt 30 ngày (PREMIUM)" }],
    },
    {
        id: "TD-1003",
        title: "Đất nền 100m2 – Bình Chánh",
        category: "Đất nền",
        listingType: "NORMAL",
        area: 100,
        displayAddress: "Bình Chánh, TP.HCM",
        description: "Sổ riêng, đường vào 6m, gần trường học, chợ.",
        images: [],
        price: 1800000000,
        status: "REJECTED",
        createdAt: "2025-05-17T14:15:00Z",
        expiresAt: "2025-06-17T14:15:00Z",
        author: { name: "Admin", email: "admin@site.com" },
        audit: [{ at: "18/05/2025 10:22", by: "Admin", type: "REJECTED", message: "Thiếu giấy tờ pháp lý" }],
    },
];

/* ---------- Page component ---------- */
export default function AdminPostsMUI() {
    const [posts, setPosts] = useState(INITIAL_POSTS);
    const [q, setQ] = useState("");
    const [category, setCategory] = useState("");       // lọc Category
    const [listingType, setListingType] = useState(""); // lọc Loại tin

    const [selectedTab, setSelectedTab] = useState("PENDING");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState(null);

    // Quyết định duyệt
    const [decision, setDecision] = useState({ listingType: "NORMAL", durationDays: 30, reason: "" });

    // Đánh dấu hết hạn/sắp hết hạn
    const normalized = useMemo(() => {
        const now = dayjs();
        return posts.map((p) => {
            if (p.status === "PUBLISHED") {
                if (p.expiresAt && dayjs(p.expiresAt).isBefore(now)) return { ...p, status: "EXPIRED" };
                if (p.expiresAt && dayjs(p.expiresAt).diff(now, "day") <= 7) return { ...p, status: "EXPIRING_SOON" };
            }
            return p;
        });
    }, [posts]);

    // counts
    const counts = useMemo(() => {
        const map = { PUBLISHED: 0, PENDING: 0, DRAFT: 0, REJECTED: 0, EXPIRED: 0, EXPIRING_SOON: 0, HIDDEN: 0 };
        normalized.forEach((p) => (map[p.status] = (map[p.status] || 0) + 1));
        return map;
    }, [normalized]);

    // filter
    const filtered = useMemo(() => {
        const kw = q.trim().toLowerCase();
        return normalized
            .filter((p) => (selectedTab ? p.status === selectedTab : true))
            .filter((p) =>
                kw ? p.title.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw) || p.author?.name?.toLowerCase().includes(kw) : true
            )
            .filter((p) => (category ? p.category === category : true))
            .filter((p) => (listingType ? (p.listingType || "NORMAL") === listingType : true));
    }, [normalized, q, selectedTab, category, listingType]);

    // paging
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(totalItems, page * pageSize);
    const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

    // actions
    const approve = (id) =>
        setPosts((p) =>
            p.map((x) =>
                x.id === id
                    ? {
                        ...x,
                        status: "PUBLISHED",
                        listingType: decision.listingType,
                        expiresAt: dayjs().add(decision.durationDays || 30, "day").toISOString(),
                        audit: [
                            ...(x.audit || []),
                            { at: dayjs().format("DD/MM/YYYY HH:mm"), by: "Admin", type: "APPROVED", message: decision.reason || `Duyệt ${decision.durationDays} ngày (${decision.listingType})` },
                        ],
                    }
                    : x
            )
        );

    const reject = (id) =>
        setPosts((p) =>
            p.map((x) =>
                x.id === id
                    ? { ...x, status: "REJECTED", audit: [...(x.audit || []), { at: dayjs().format("DD/MM/YYYY HH:mm"), by: "Admin", type: "REJECTED", message: decision.reason || "Từ chối tin" }] }
                    : x
            )
        );

    const hide = (id) => setPosts((p) => p.map((x) => (x.id === id ? { ...x, status: "HIDDEN" } : x)));
    const unhide = (id) => setPosts((p) => p.map((x) => (x.id === id ? { ...x, status: "PUBLISHED" } : x)));
    const hardDelete = (id) => setPosts((p) => p.filter((x) => x.id !== id));

    const money = (v) => (typeof v === "number" ? v.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ" : "-");

    return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", bgcolor: "#f8f9fc", p: 3 }}>
            <Box sx={{ width: "100%", maxWidth: 1440 }}>
                {/* KPI mới */}
                <KpiGrid
                    total={posts.length}
                    pending={counts.PENDING}
                    active={counts.PUBLISHED + counts.EXPIRING_SOON}
                    expSoon={counts.EXPIRING_SOON}
                    expired={counts.EXPIRED}
                />

                {/* Thanh pill trạng thái */}
                <PillBar
                    selected={selectedTab}
                    onSelect={(key) => {
                        setSelectedTab(key);
                        setPage(1);
                    }}
                    counts={counts}
                />

                {/* Thanh tìm kiếm (có Category + Loại tin) */}
                <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: "14px", border: "1px solid #e8edf6", bgcolor: "#fff" }}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                        <TextField size="small" placeholder="Tìm mã, tiêu đề…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 300 }} />

                        <Select
                            size="small"
                            displayEmpty
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            sx={{ minWidth: 160 }}
                            renderValue={(v) => (v ? v : "Loại BĐS")}
                        >
                            <MenuItem value=""><em>Tất cả</em></MenuItem>
                            {CATEGORIES.map((c) => (
                                <MenuItem key={c} value={c}>{c}</MenuItem>
                            ))}
                        </Select>

                        <Select
                            size="small"
                            displayEmpty
                            value={listingType}
                            onChange={(e) => setListingType(e.target.value)}
                            sx={{ minWidth: 140 }}
                            renderValue={(v) => (v ? (v === "NORMAL" ? "Thường" : v) : "Loại tin")}
                        >
                            <MenuItem value=""><em>Tất cả</em></MenuItem>
                            {LISTING_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>{t === "NORMAL" ? "Thường" : t}</MenuItem>
                            ))}
                        </Select>

                        <Button variant="contained" onClick={() => setPage(1)}>Tìm kiếm</Button>
                        <Button startIcon={<RestartAltIcon />} onClick={() => { setQ(""); setCategory(""); setListingType(""); setPage(1); }}>
                            Xóa lọc
                        </Button>
                    </Stack>
                </Paper>

                {/* Bảng */}
                <Paper
                    elevation={0}
                    sx={{ backgroundColor: "#fff", borderRadius: "14px", border: "1px solid #e8edf6", boxShadow: "0 6px 18px rgba(13,47,97,0.06)", mt: 2 }}
                >
                    <Box sx={{ p: 2 }}>
                        <TableContainer sx={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #eef2f9" }}>
                            <Table>
                                <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
                                    <TableRow>
                                        <TableCell sx={styles.headCell}>Mã tin</TableCell>
                                        <TableCell sx={styles.headCell}>Tiêu đề</TableCell>
                                        <TableCell sx={styles.headCell}>Loại</TableCell>
                                        <TableCell sx={styles.headCell} align="right">Giá</TableCell>
                                        <TableCell sx={styles.headCell}>Trạng thái</TableCell>
                                        <TableCell sx={styles.headCell}>Tạo lúc</TableCell>
                                        <TableCell sx={styles.headCell}>Hết hạn</TableCell>
                                        <TableCell sx={styles.headCell}>Người tạo</TableCell>
                                        <TableCell sx={styles.headCell} align="right">Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {pageData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 6, color: "#7a8aa1", bgcolor: "#fff" }}>
                                                Không có dữ liệu
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pageData.map((r) => (
                                            <TableRow key={r.id} hover sx={{ "& td": { transition: "background-color 140ms ease" }, "&:hover td": { backgroundColor: HOVER_BG } }}>
                                                <TableCell sx={styles.bodyCell}>{r.id}</TableCell>

                                                <TableCell sx={styles.bodyCell}>
                                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#eef2ff", color: "#4f46e5" }}>
                                                            <ArticleOutlinedIcon fontSize="small" />
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography fontWeight={700} noWrap>{r.title}</Typography>
                                                            <Typography fontSize={12} color="#718198" noWrap>
                                                                {r.author?.name} • {r.author?.email}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell sx={styles.bodyCell}>{r.category}</TableCell>
                                                <TableCell sx={{ ...styles.bodyCell, textAlign: "right", fontWeight: 700 }}>{money(r.price)}</TableCell>
                                                <TableCell sx={styles.bodyCell}>
                                                    <Chip label={STATUS_LABEL[r.status]} color={STATUS_CHIP_COLOR[r.status]} size="small" />
                                                </TableCell>
                                                <TableCell sx={styles.bodyCell}>{fmtDate(r.createdAt)}</TableCell>
                                                <TableCell sx={styles.bodyCell}>{fmtDate(r.expiresAt)}</TableCell>
                                                <TableCell sx={styles.bodyCell}>{r.author?.name || "-"}</TableCell>

                                                <TableCell align="right" sx={styles.bodyCell}>
                                                    {/* Con mắt xem tin -> Drawer review */}
                                                    <Tooltip title="Xem tin">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setDetail({ ...r, priceLabel: money(r.price) });
                                                                setDecision({ listingType: r.listingType || "NORMAL", durationDays: 30, reason: "" });
                                                                setOpen(true);
                                                            }}
                                                        >
                                                            <RemoveRedEyeOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {r.status === "PENDING" && (
                                                        <>
                                                            <Tooltip title="Duyệt đăng">
                                                                <IconButton size="small" color="success" onClick={() => { setDecision((s) => ({ ...s, reason: "" })); approve(r.id); }}>
                                                                    <CheckCircleOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Từ chối">
                                                                <IconButton size="small" color="error" onClick={() => { if (window.confirm("Từ chối tin này?")) reject(r.id); }}>
                                                                    <HighlightOffOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}

                                                    {(r.status === "PUBLISHED" || r.status === "EXPIRING_SOON") && (
                                                        <Tooltip title="Ẩn bài">
                                                            <IconButton size="small" color="default" onClick={() => hide(r.id)}>
                                                                <VisibilityOffOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {r.status === "HIDDEN" && (
                                                        <Tooltip title="Hiện lại">
                                                            <IconButton size="small" color="primary" onClick={() => unhide(r.id)}>
                                                                <VisibilityOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {(r.status === "DRAFT" || r.status === "REJECTED" || r.status === "EXPIRED") && (
                                                        <Tooltip title="Xóa vĩnh viễn">
                                                            <IconButton size="small" color="error" onClick={() => { if (window.confirm(`Xóa tin ${r.id}? Hành động không thể hoàn tác.`)) hardDelete(r.id); }}>
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Footer: page size + pagination */}
                        <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Select
                                    size="small"
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(e.target.value); setPage(1); }}
                                    sx={{
                                        height: 40, minWidth: 100, borderRadius: "8px",
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff", borderWidth: 1.4 },
                                    }}
                                >
                                    {[10, 20, 50].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                                </Select>
                                <Typography fontSize={13} color="#7a8aa1">
                                    Hiển thị {start} đến {end} của {totalItems}
                                </Typography>
                            </Box>

                            <Pagination
                                page={page}
                                count={totalPages}
                                onChange={(_, p) => setPage(p)}
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
                                                bgcolor: "#415a8c",
                                                color: "#fff",
                                                borderColor: "transparent",
                                                "&:hover": { bgcolor: "#415a8c" },
                                            },
                                            "&.MuiPaginationItem-previousNext": {
                                                bgcolor: "#e9eaee",
                                                color: "#6b7280",
                                                border: "none",
                                                "&:hover": { bgcolor: "#dfe2e8" },
                                                "&.Mui-disabled": { opacity: 0.6 },
                                            },
                                        }}
                                    />
                                )}
                            />
                        </Box>
                    </Box>
                </Paper>

                {/* Drawer review */}
                <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 860 } }}>
                    {detail && (
                        <Box sx={{ p: 2 }}>
                            {/* Header */}
                            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                                <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", fontWeight: 700, width: 48, height: 48 }}>
                                    <ArticleOutlinedIcon />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight={700}>{detail.title}</Typography>
                                    <Typography fontSize={13} color="#7a8aa1">{detail.id} • {STATUS_LABEL[detail.status]}</Typography>
                                </Box>
                                <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} onClick={() => window.open(`/posts/${detail.id}`, "_blank")}>
                                    Mở trên FE
                                </Button>
                            </Stack>
                            <Divider sx={{ my: 1.5 }} />

                            {/* Ảnh + thumbs */}
                            <ImageViewer images={detail.images} />

                            {/* Thông tin */}
                            <Card sx={{ borderRadius: 2, mt: 2 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={12} sm={6}><Row label="Giá" value={money(detail.price)} /></Grid>
                                        <Grid item xs={12} sm={6}><Row label="Diện tích" value={`${detail.area ?? "-"} m²`} /></Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Row label="Loại tin" value={
                                                <Chip label={detail.listingType || "NORMAL"} color={detail.listingType === "VIP" ? "secondary" : detail.listingType === "PREMIUM" ? "warning" : "info"} size="small" />
                                            } />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Row label="Trạng thái" value={<Chip label={STATUS_LABEL[detail.status]} color={STATUS_CHIP_COLOR[detail.status]} size="small" />} />
                                        </Grid>
                                        <Grid item xs={12}><Row label="Địa chỉ" value={detail.displayAddress || "-"} /></Grid>
                                        <Grid item xs={12}><Row label="Mô tả" value={detail.description || "-"} /></Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Quyết định duyệt */}
                            <Divider sx={{ my: 2 }}>Quyết định duyệt</Divider>
                            <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
                                <Select size="small" value={decision.listingType} onChange={(e) => setDecision((s) => ({ ...s, listingType: e.target.value }))} sx={{ width: 160 }}>
                                    {LISTING_TYPES.map((v) => <MenuItem key={v} value={v}>{v === "NORMAL" ? "Thường" : v}</MenuItem>)}
                                </Select>
                                <Select size="small" value={decision.durationDays} onChange={(e) => setDecision((s) => ({ ...s, durationDays: e.target.value }))} sx={{ width: 140 }}>
                                    {[10, 15, 20, 30].map((d) => <MenuItem key={d} value={d}>{d} ngày</MenuItem>)}
                                </Select>
                                <TextField
                                    size="small"
                                    placeholder="Ghi chú duyệt / lý do từ chối"
                                    value={decision.reason}
                                    onChange={(e) => setDecision((s) => ({ ...s, reason: e.target.value }))}
                                    sx={{ width: 420 }}
                                    multiline minRows={2} maxRows={4}
                                />
                                <Button variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={() => { approve(detail.id); setOpen(false); }}>
                                    Duyệt
                                </Button>
                                <Button color="error" variant="outlined" startIcon={<HighlightOffOutlinedIcon />} onClick={() => { if (window.confirm("Từ chối tin này?")) { reject(detail.id); setOpen(false); } }}>
                                    Từ chối
                                </Button>
                            </Stack>

                            {/* Lịch sử */}
                            <Divider sx={{ my: 2 }}>Lịch sử</Divider>
                            <Card sx={{ borderRadius: 2 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Stack spacing={1}>
                                        {(detail.audit || []).map((i, idx) => (
                                            <Typography key={idx} fontSize={14}>
                                                <strong>{i.at}</strong> • <em>{i.by}</em>: {i.message || i.type}
                                            </Typography>
                                        ))}
                                        {!(detail.audit || []).length && <Typography color="text.secondary">Chưa có lịch sử</Typography>}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Drawer>
            </Box>
        </Box>
    );
}

/* ---------- Components phụ ---------- */
function ImageViewer({ images = [] }) {
    const list = images.length ? images : [null];
    const [idx, setIdx] = useState(0);

    return (
        <Box>
            <Box
                sx={{
                    height: 360,
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "#f2f4f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {list[idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={list[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <Typography color="text.secondary">Chưa có hình</Typography>
                )}
            </Box>

            {images.length > 1 && (
                <Stack direction="row" spacing={1} mt={1} sx={{ overflowX: "auto", pb: 1 }}>
                    {images.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={src}
                            src={src}
                            alt=""
                            onClick={() => setIdx(i)}
                            style={{
                                width: 90,
                                height: 70,
                                objectFit: "cover",
                                borderRadius: 8,
                                cursor: "pointer",
                                border: i === idx ? "2px solid #3059ff" : "1px solid #e5e7eb",
                            }}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}

function Row({ label, value }) {
    return (
        <Stack direction="row" justifyContent="space-between" gap={2}>
            <Typography sx={{ color: "#6b7280" }}>{label}</Typography>
            <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
        </Stack>
    );
}

/* ===== KPI mới (gradient + progress) ===== */
function KpiGrid({ total = 0, pending = 0, active = 0, expSoon = 0, expired = 0 }) {
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

    const cards = [
        {
            key: "pending", label: "Chờ duyệt", value: pending, percent: pct(pending), icon: <PendingActionsOutlinedIcon />,
            gradient: "linear-gradient(135deg,#fff5e6 0%,#ffedd5 100%)", chip: "#b45309", bar: "#f59e0b"
        },
        {
            key: "active", label: "Đang đăng", value: active, percent: pct(active), icon: <RocketLaunchOutlinedIcon />,
            gradient: "linear-gradient(135deg,#eafff2 0%,#dcfce7 100%)", chip: "#065f46", bar: "#10b981"
        },
        {
            key: "expSoon", label: "Sắp hết hạn", value: expSoon, percent: pct(expSoon), icon: <ScheduleOutlinedIcon />,
            gradient: "linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)", chip: "#9a3412", bar: "#fb923c"
        },
        {
            key: "expired", label: "Hết hạn", value: expired, percent: pct(expired), icon: <HighlightOffOutlinedIcon2 />,
            gradient: "linear-gradient(135deg,#f8fafc 0%,#e5e7eb 100%)", chip: "#0f172a", bar: "#94a3b8"
        },
    ];

    return (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mb={2}>
            {cards.map((c) => <KpiTile key={c.key} {...c} />)}
        </Stack>
    );
}

function KpiTile({ label, value, percent, icon, gradient, chip, bar }) {
    return (
        <Card
            elevation={0}
            sx={{
                flex: "1 1 260px",
                minWidth: 240,
                borderRadius: "16px",
                border: "1px solid #e8edf6",
                background: gradient,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <CardContent sx={{ p: 2.25 }}>
                {/* Icon nổi */}
                <Box sx={{ position: "absolute", right: -14, top: -14, width: 90, height: 90, borderRadius: "50%", background: "#fff", opacity: 0.35, filter: "blur(2px)" }} />
                <Box sx={{
                    position: "absolute", right: 12, top: 10, width: 40, height: 40, borderRadius: "12px", display: "grid", placeItems: "center",
                    bgcolor: "#ffffff88", color: chip, boxShadow: "0 6px 16px rgba(0,0,0,.08)", backdropFilter: "blur(3px)"
                }}>
                    {icon}
                </Box>

                <Typography fontSize={13} color="#64748b" sx={{ mb: .25 }}>{label}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography fontSize={30} fontWeight={800} sx={{ color: "#0f2f63" }}>{value}</Typography>
                    <Typography fontSize={13} sx={{ color: chip, fontWeight: 700 }}>{percent}%</Typography>
                </Stack>

                <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={percent}
                        sx={{ height: 8, borderRadius: 999, backgroundColor: "#ffffff88", "& .MuiLinearProgress-bar": { backgroundColor: bar } }} />
                </Box>

                <Typography fontSize={12} color="#64748b" sx={{ mt: 1 }}>Tỷ lệ trên tổng tin trong hệ thống.</Typography>
            </CardContent>
        </Card>
    );
}

function PillBar({ selected, onSelect, counts }) {
    const pills = [
        { key: "PUBLISHED", label: "Đang Đăng", bg: "#0f2350", color: "#fff", badgeBg: "#33456d" },
        { key: "PENDING", label: "Chờ Duyệt", badgeBg: "#fde68a" },
        { key: "REJECTED", label: "Bị Từ Chối", badgeBg: "#fecdd3" },
        { key: "EXPIRED", label: "Hết Hạn", badgeBg: "#cbd5e1" },
        { key: "EXPIRING_SOON", label: "Sắp Hết Hạn", badgeBg: "#fed7aa" },
        { key: "HIDDEN", label: "Đã Ẩn", badgeBg: "#cbd5e1" },
    ];

    return (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {pills.map((p) => {
                const active = selected === p.key;
                return (
                    <Box
                        key={p.key}
                        onClick={() => onSelect(p.key)}
                        sx={{
                            userSelect: "none",
                            cursor: "pointer",
                            px: 2.25,
                            py: 1,
                            borderRadius: "16px",
                            border: "1px solid #e5e7eb",
                            bgcolor: active ? "#0f2350" : "#fff",
                            color: active ? "#fff" : "#111827",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1.25,
                            boxShadow: active ? "0 2px 6px rgba(15,35,80,.25)" : "none",
                        }}
                    >
                        <Typography fontWeight={800}>{p.label}</Typography>
                        <Box
                            sx={{
                                ml: 0.25,
                                fontSize: 12,
                                fontWeight: 800,
                                px: 1,
                                lineHeight: "18px",
                                height: 18,
                                borderRadius: "8px",
                                color: "#0f2350",
                                bgcolor: p.badgeBg || "#eef2f7",
                                ...(active && { bgcolor: "#e6edf9" }),
                            }}
                        >
                            {counts[p.key] || 0}
                        </Box>
                    </Box>
                );
            })}
        </Stack>
    );
}

const styles = {
    headCell: { fontWeight: 700, fontSize: 14, color: "#1a3b7c" },
    bodyCell: { fontSize: 14, color: "#2b3a55" },
};

// src/pages/Admin/AdminUsersMUI.jsx
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
    Avatar, Box, Chip, Divider, Drawer, IconButton, MenuItem, Pagination, PaginationItem,
    Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Tooltip, Typography, Button, Card, CardContent
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const HOVER_BG = "#dbe7ff";

/* ===================== KPI IMAGES (inline SVG -> data URL) ===================== */
const svgToDataUrl = (s) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

const IMG_USERS = svgToDataUrl(`
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eaf1ff"/><stop offset="100%" stop-color="#f7fbff"/></linearGradient></defs>
  <circle cx="90" cy="95" r="44" fill="url(#g1)"/>
  <circle cx="62" cy="56" r="18" fill="#2b59ff" fill-opacity="0.22"/>
  <rect x="34" y="84" rx="12" ry="12" width="56" height="24" fill="#2b59ff" fill-opacity="0.18"/>
  <circle cx="96" cy="64" r="10" fill="#2b59ff" fill-opacity="0.28"/>
  <circle cx="112" cy="78" r="6" fill="#2b59ff" fill-opacity="0.18"/>
</svg>
`);

const IMG_AGENTS = svgToDataUrl(`
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f3e9ff"/><stop offset="100%" stop-color="#fbf7ff"/></linearGradient></defs>
  <circle cx="95" cy="95" r="44" fill="url(#g2)"/>
  <path d="M58 58 l18 -12 l18 12 v20 h-36z" fill="#7a33ff" fill-opacity="0.25"/>
  <rect x="62" y="66" width="28" height="16" rx="3" fill="#7a33ff" fill-opacity="0.3"/>
  <circle cx="102" cy="62" r="8" fill="#7a33ff" fill-opacity="0.28"/>
</svg>
`);

const IMG_ACTIVE = svgToDataUrl(`
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eaffe9"/><stop offset="100%" stop-color="#f8fff7"/></linearGradient></defs>
  <circle cx="95" cy="95" r="44" fill="url(#g3)"/>
  <circle cx="64" cy="64" r="20" fill="#0ea85f" fill-opacity="0.22"/>
  <path d="M56 66 l7 7 l15 -15" stroke="#0ea85f" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="108" cy="70" r="7" fill="#0ea85f" fill-opacity="0.26"/>
</svg>
`);

const IMG_LOCKED = svgToDataUrl(`
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffeaea"/><stop offset="100%" stop-color="#fff7f7"/></linearGradient></defs>
  <circle cx="95" cy="95" r="44" fill="url(#g4)"/>
  <rect x="52" y="70" width="36" height="24" rx="6" fill="#e03434" fill-opacity="0.22"/>
  <path d="M60 70 v-6 a10 10 0 0 1 20 0 v6" stroke="#e03434" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="108" cy="68" r="7" fill="#e03434" fill-opacity="0.26"/>
</svg>
`);

/* ===================== Mock data (có deleteRequested) ===================== */
const INITIAL_USERS = [
    { id: 1, fullName: "Nguyễn Văn A", email: "a@example.com", phone: "0912345678", role: "USER", status: "ACTIVE", postsCount: 3, balance: 1200000, createdAt: "2025-04-12T09:30:00Z", address: "Q.1, TP.HCM", deleteRequested: false },
    { id: 2, fullName: "Trần Thị B", email: "b@example.com", phone: "0988888888", role: "AGENT", status: "ACTIVE", postsCount: 12, balance: 0, createdAt: "2025-05-02T10:00:00Z", address: "Q.3, TP.HCM", deleteRequested: true },
    { id: 3, fullName: "Admin", email: "admin@site.com", phone: "0900000000", role: "ADMIN", status: "LOCKED", postsCount: 0, balance: 0, createdAt: "2025-03-20T08:10:00Z", address: "Hà Nội", deleteRequested: false },
    { id: 4, fullName: "Phạm C", email: "c@example.com", phone: "0933333333", role: "USER", status: "PENDING", postsCount: 1, balance: 500000, createdAt: "2025-06-15T13:00:00Z", address: "", deleteRequested: false },
];

const STATUS_COLOR = { ACTIVE: "success", LOCKED: "error", PENDING: "warning" };
const ROLE_COLOR = { USER: "primary", AGENT: "secondary", ADMIN: "warning" };

const fmtDate = (v) => (v && dayjs(v).isValid() ? dayjs(v).format("HH:mm:ss DD/MM/YYYY") : "-");
const initials = (name = "") => {
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return "NA";
    const f = parts[0][0] || "";
    const l = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (f + l).toUpperCase();
};

export default function AdminUsersMUI() {
    // data + filters
    const [users, setUsers] = useState(INITIAL_USERS);
    const [q, setQ] = useState("");
    const [role, setRole] = useState("ALL");
    const [status, setStatus] = useState("ALL");

    // paging
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        const kw = q.trim().toLowerCase();
        return users
            .filter((u) => (role === "ALL" ? true : u.role === role))
            .filter((u) => (status === "ALL" ? true : u.status === status))
            .filter((u) =>
                kw
                    ? (u.fullName || "").toLowerCase().includes(kw) ||
                    (u.email || "").toLowerCase().includes(kw) ||
                    (u.phone || "").includes(kw)
                    : true
            );
    }, [users, q, role, status]);

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(totalItems, page * pageSize);
    const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

    // detail drawer
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState(null);

    /* ===================== Actions ===================== */
    const lockUser = (id) => setUsers(p => p.map(u => u.id === id ? { ...u, status: "LOCKED" } : u));
    const unlockUser = (id) => setUsers(p => p.map(u => u.id === id ? { ...u, status: "ACTIVE" } : u));

    // Đánh dấu đã nhận yêu cầu xóa (thực tế BE sẽ set cờ này)
    const markDeleteRequested = (id) =>
        setUsers(p => p.map(u => u.id === id ? { ...u, deleteRequested: true } : u));

    // Từ chối yêu cầu xóa
    const rejectDeleteRequest = (id) =>
        setUsers(p => p.map(u => u.id === id ? { ...u, deleteRequested: false } : u));

    // Phê duyệt xóa vĩnh viễn (demo hard delete). Thực tế gọi API xóa rồi refetch.
    const approveDelete = (id) =>
        setUsers(p => p.filter(u => u.id !== id));

    /* ===================== KPIs ===================== */
    const kpis = useMemo(() => {
        const total = users.length;
        const agents = users.filter((u) => u.role === "AGENT").length;
        const active = users.filter((u) => u.status === "ACTIVE").length;
        const locked = users.filter((u) => u.status === "LOCKED").length;
        return { total, agents, active, locked };
    }, [users]);

    return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", bgcolor: "#f8f9fc", p: 3 }}>
            <Box sx={{ width: "100%", maxWidth: 1440 }}>
                {/* KPI */}
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mb={2}>
                    {[
                        { title: "Tổng người dùng", value: kpis.total, img: IMG_USERS, bg: "linear-gradient(135deg,#eaf1ff 0%,#f7fbff 100%)", tint: "#2b59ff" },
                        { title: "Số môi giới (AGENT)", value: kpis.agents, img: IMG_AGENTS, bg: "linear-gradient(135deg,#f3e9ff 0%,#fbf7ff 100%)", tint: "#7a33ff" },
                        { title: "Đang hoạt động", value: kpis.active, img: IMG_ACTIVE, bg: "linear-gradient(135deg,#eaffe9 0%,#f8fff7 100%)", tint: "#0ea85f" },
                        { title: "Bị khóa", value: kpis.locked, img: IMG_LOCKED, bg: "linear-gradient(135deg,#ffeaea 0%,#fff7f7 100%)", tint: "#e03434" },
                    ].map((k) => (
                        <StatCard key={k.title} title={k.title} value={k.value} img={k.img} bg={k.bg} tint={k.tint} />
                    ))}
                </Stack>

                {/* Filters */}
                <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: "14px", border: "1px solid #e8edf6", bgcolor: "#fff" }}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                        <TextField
                            size="small"
                            label="Tìm tên, email, SĐT…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            sx={{ width: 340 }}
                        />
                        <Select size="small" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 180 }}>
                            <MenuItem value="ALL">Tất cả vai trò</MenuItem>
                            <MenuItem value="USER">USER</MenuItem>
                            <MenuItem value="AGENT">AGENT</MenuItem>
                            <MenuItem value="ADMIN">ADMIN</MenuItem>
                        </Select>
                        <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 200 }}>
                            <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                            <MenuItem value="LOCKED">LOCKED</MenuItem>
                            <MenuItem value="PENDING">PENDING</MenuItem>
                        </Select>
                        <Button startIcon={<RestartAltIcon />} onClick={() => { setQ(""); setRole("ALL"); setStatus("ALL"); setPage(1); }}>
                            Xóa lọc
                        </Button>
                    </Stack>
                </Paper>

                {/* Table */}
                <Paper elevation={0} sx={{ backgroundColor: "#fff", borderRadius: "14px", border: "1px solid #e8edf6", boxShadow: "0 6px 18px rgba(13,47,97,0.06)" }}>
                    <Box sx={{ p: 2 }}>
                        <TableContainer sx={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #eef2f9" }}>
                            <Table>
                                <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
                                    <TableRow>
                                        <TableCell sx={styles.headCell}>ID</TableCell>
                                        <TableCell sx={styles.headCell}>Họ tên / Email</TableCell>
                                        <TableCell sx={styles.headCell}>SĐT</TableCell>
                                        <TableCell sx={styles.headCell}>Vai trò</TableCell>
                                        <TableCell sx={styles.headCell}>Trạng thái</TableCell>
                                        <TableCell sx={styles.headCell} align="center">Yêu cầu xóa</TableCell>{/* NEW */}
                                        <TableCell sx={styles.headCell} align="center">Tin đăng</TableCell>
                                        <TableCell sx={styles.headCell}>Tạo lúc</TableCell>
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
                                            <TableRow
                                                key={r.id}
                                                hover
                                                sx={{
                                                    "& td": { transition: "background-color 140ms ease" },
                                                    "&:hover td": { backgroundColor: HOVER_BG },
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => { setDetail(r); setOpen(true); }}
                                            >
                                                <TableCell sx={styles.bodyCell}>{r.id}</TableCell>

                                                <TableCell sx={styles.bodyCell}>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", fontWeight: 700 }}>
                                                            {initials(r.fullName)}
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography fontWeight={700} noWrap>{r.fullName || "(Chưa đặt)"}</Typography>
                                                            <Typography fontSize={12} color="#718198" noWrap>{r.email}</Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell sx={styles.bodyCell}>{r.phone}</TableCell>

                                                <TableCell sx={styles.bodyCell}>
                                                    <Chip label={r.role} variant="outlined" color={ROLE_COLOR[r.role]} size="small" />
                                                </TableCell>

                                                <TableCell sx={styles.bodyCell}>
                                                    <Chip label={r.status} color={STATUS_COLOR[r.status]} size="small" />
                                                </TableCell>

                                                {/* Yêu cầu xóa */}
                                                <TableCell align="center">
                                                    {r.deleteRequested ? (
                                                        <Chip label="Đã yêu cầu" color="error" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                                    ) : (
                                                        <Chip label="Không" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                                    )}
                                                </TableCell>

                                                <TableCell sx={{ ...styles.bodyCell, textAlign: "center", fontWeight: 700 }}>
                                                    {r.postsCount}
                                                </TableCell>

                                                <TableCell sx={styles.bodyCell}>{fmtDate(r.createdAt)}</TableCell>

                                                {/* Thao tác */}
                                                <TableCell align="right" sx={styles.bodyCell} onClick={(e) => e.stopPropagation()}>
                                                    <Tooltip title="Chi tiết">
                                                        <IconButton size="small" onClick={() => { setDetail(r); setOpen(true); }}>
                                                            <InfoOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {r.status !== "LOCKED" ? (
                                                        <Tooltip title="Khóa">
                                                            <IconButton size="small" color="error" onClick={() => lockUser(r.id)}>
                                                                <LockOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title="Mở khóa">
                                                            <IconButton size="small" color="primary" onClick={() => unlockUser(r.id)}>
                                                                <LockOpenOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {/* Nhóm nút xoá tài khoản */}
                                                    {r.deleteRequested ? (
                                                        <>
                                                            <Tooltip title="Phê duyệt xóa vĩnh viễn">
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="error"
                                                                    sx={{ ml: 1 }}
                                                                    onClick={() => {
                                                                        if (window.confirm(`Xác nhận xóa vĩnh viễn tài khoản #${r.id}? Hành động không thể hoàn tác.`)) {
                                                                            approveDelete(r.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            </Tooltip>
                                                            <Tooltip title="Từ chối yêu cầu xóa">
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ ml: 1 }}
                                                                    onClick={() => rejectDeleteRequest(r.id)}
                                                                >
                                                                    Từ chối
                                                                </Button>
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <Tooltip title="Đánh dấu đã nhận yêu cầu xóa (demo)">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="error"
                                                                sx={{ ml: 1 }}
                                                                onClick={() => markDeleteRequested(r.id)}
                                                            >
                                                                Yêu cầu xóa
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Footer: page-size + pagination */}
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
                                sx={{
                                    "& .MuiPagination-ul": { gap: "px" },
                                    "& .MuiButtonBase-root": { WebkitTapHighlightColor: "transparent" },
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>

                {/* Drawer chi tiết */}
                <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 520 } }}>
                    {detail && (
                        <Box sx={{ p: 2 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                                <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", fontWeight: 700, width: 48, height: 48 }}>
                                    {initials(detail.fullName)}
                                </Avatar>
                                <Box>
                                    <Typography fontWeight={700}>{detail.fullName}</Typography>
                                    <Typography fontSize={13} color="#7a8aa1">{detail.email}</Typography>
                                </Box>
                            </Stack>
                            <Divider sx={{ my: 1.5 }} />

                            <Stack spacing={1}>
                                <Row label="ID" value={detail.id} />
                                <Row label="SĐT" value={detail.phone} />
                                <Row label="Vai trò" value={<Chip label={detail.role} color={ROLE_COLOR[detail.role]} size="small" />} />
                                <Row label="Trạng thái" value={<Chip label={detail.status} color={STATUS_COLOR[detail.status]} size="small" />} />
                                <Row label="Yêu cầu xóa" value={detail.deleteRequested ? <Chip label="Đã yêu cầu" color="error" variant="outlined" size="small" /> : <Chip label="Không" variant="outlined" size="small" />} />
                                <Row label="Tin đăng" value={detail.postsCount} />
                                <Row label="Ngày tạo" value={fmtDate(detail.createdAt)} />
                                <Row label="Số dư ví" value={`${(detail.balance ?? 0).toLocaleString()} đ`} />
                                <Row label="Địa chỉ" value={detail.address || "-"} />
                            </Stack>

                            <Divider sx={{ my: 2 }} />
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {detail.status !== "LOCKED" ? (
                                    <Button color="error" startIcon={<LockOutlinedIcon />} onClick={() => { lockUser(detail.id); setOpen(false); }}>
                                        Khóa
                                    </Button>
                                ) : (
                                    <Button variant="contained" startIcon={<LockOpenOutlinedIcon />} onClick={() => { unlockUser(detail.id); setOpen(false); }}>
                                        Mở khóa
                                    </Button>
                                )}

                                {/* Nhóm nút xoá tài khoản */}
                                {detail.deleteRequested ? (
                                    <>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => {
                                                if (window.confirm(`Xác nhận xóa vĩnh viễn tài khoản #${detail.id}? Hành động không thể hoàn tác.`)) {
                                                    approveDelete(detail.id);
                                                    setOpen(false);
                                                }
                                            }}
                                        >
                                            Xóa vĩnh viễn
                                        </Button>
                                        <Button variant="outlined" onClick={() => { rejectDeleteRequest(detail.id); setOpen(false); }}>
                                            Từ chối yêu cầu
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outlined" color="error" onClick={() => { markDeleteRequested(detail.id); setOpen(false); }}>
                                        Đánh dấu yêu cầu xóa
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                    )}
                </Drawer>
            </Box>
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

function StatCard({ title, value, img, bg = "#fff", tint = "#3059ff" }) {
    return (
        <Card sx={{ position: "relative", overflow: "hidden", flex: "1 1 260px", borderRadius: "14px", border: "1px solid #e8edf6", background: bg }}>
            <CardContent sx={{ minHeight: 110 }}>
                <Typography fontSize={13} color="#7a8aa1">{title}</Typography>
                <Typography fontSize={30} fontWeight={800} sx={{ color: "#0f2f63" }}>{value}</Typography>
                <Box sx={{ mt: 1, width: 42, height: 4, borderRadius: 999, backgroundColor: tint, opacity: 0.35 }} />
                {img && (
                    <Box
                        component="img"
                        src={img}
                        alt=""
                        sx={{
                            position: "absolute",
                            right: -6,
                            bottom: -6,
                            width: 120,
                            height: "auto",
                            opacity: 0.22,
                            pointerEvents: "none",
                            userSelect: "none",
                            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.08))",
                        }}
                    />
                )}
                <Box
                    sx={{
                        position: "absolute",
                        right: 70,
                        bottom: -30,
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at center, ${tint}22 0%, transparent 60%)`,
                    }}
                />
            </CardContent>
        </Card>
    );
}

const styles = {
    headCell: { fontWeight: 700, fontSize: 14, color: "#1a3b7c" },
    bodyCell: { fontSize: 14, color: "#2b3a55" },
};

import {
    Box,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Avatar,
    Chip,
    Stack,
    Typography,
    Tooltip,
    IconButton,
    Button,
    Pagination,
    PaginationItem,
    Select,
    MenuItem,
    LinearProgress,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import { styles, ROLE_COLOR, STATUS_COLOR, HOVER_BG } from "./constants";
import { initials } from "../../../utils/validators";

/**
 * rows: [{
 *  id, fullName, email, phone, role,
 *  status,               // ACTIVE | LOCKED (thực)
 *  displayStatus,        // ACTIVE | LOCKED | PENDING (hiển thị)
 *  lockRequested,        // boolean
 *  deleteRequested,      // boolean
 *  postsCount, createdAtText, ...
 * }]
 *
 * onLock(row):     nếu row.lockRequested === true → duyệt khóa; ngược lại → khóa
 * onUnlock(id)
 * onRejectLock(id)
 * onApproveDelete(id)
 * onRejectDelete(id)
 */
export default function UsersTable({
    rows,
    page,
    totalPages,
    start,
    end,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
    onOpenDetail,
    onLock,          // nhận row
    onUnlock,
    onRejectLock,
    onApproveDelete,
    onRejectDelete,
    loading = false,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                backgroundColor: "#fff",
                borderRadius: "14px",
                border: "1px solid #e8edf6",
                boxShadow: "0 6px 18px rgba(13,47,97,0.06)",
            }}
        >
            {loading && <LinearProgress />}
            <Box sx={{ p: 2 }}>
                <TableContainer
                    sx={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #eef2f9" }}
                >
                    <Table>
                        <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
                            <TableRow>
                                <TableCell sx={styles.headCell}>ID</TableCell>
                                <TableCell sx={styles.headCell}>Họ tên / Email</TableCell>
                                <TableCell sx={styles.headCell}>SĐT</TableCell>
                                <TableCell sx={styles.headCell}>Vai trò</TableCell>
                                <TableCell sx={styles.headCell}>Trạng thái</TableCell>
                                <TableCell sx={styles.headCell} align="center">Yêu cầu xóa</TableCell>
                                <TableCell sx={styles.headCell} align="center">Tin đăng</TableCell>
                                <TableCell sx={styles.headCell}>Tạo lúc</TableCell>
                                <TableCell sx={styles.headCell} align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: "#7a8aa1", bgcolor: "#fff" }}>
                                        Không có dữ liệu
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((r) => {
                                    const isLocked = r.status === "LOCKED";
                                    const isPending = (r.displayStatus || r.status) === "PENDING";
                                    const isLockPending = !!r.lockRequested && !r.deleteRequested;
                                    const isDeletePending = !!r.deleteRequested && !r.lockRequested;

                                    return (
                                        <TableRow
                                            key={r.id}
                                            hover
                                            sx={{
                                                "& td": { transition: "background-color 140ms ease" },
                                                "&:hover td": { backgroundColor: HOVER_BG },
                                                cursor: "pointer",
                                            }}
                                            onClick={() => onOpenDetail(r)}
                                        >
                                            <TableCell sx={styles.bodyCell}>{r.id}</TableCell>

                                            <TableCell sx={styles.bodyCell}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", fontWeight: 700 }}>
                                                        {initials(r.fullName)}
                                                    </Avatar>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography fontWeight={700} noWrap>
                                                            {r.fullName || "(Chưa đặt)"}
                                                        </Typography>
                                                        <Typography fontSize={12} color="#718198" noWrap>
                                                            {r.email}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            <TableCell sx={styles.bodyCell}>{r.phone}</TableCell>

                                            <TableCell sx={styles.bodyCell}>
                                                <Chip
                                                    label={r.role}
                                                    variant="outlined"
                                                    color={ROLE_COLOR[r.role]}
                                                    size="small"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>

                                            <TableCell sx={styles.bodyCell}>
                                                <Chip
                                                    label={r.displayStatus || r.status}
                                                    color={STATUS_COLOR[r.displayStatus || r.status]}
                                                    size="small"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>

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

                                            <TableCell sx={styles.bodyCell}>{r.createdAtText}</TableCell>

                                            <TableCell
                                                align="right"
                                                sx={{ ...styles.bodyCell, cursor: "default" }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Xem chi tiết: luôn hiển thị */}
                                                <Tooltip title="Chi tiết">
                                                    <IconButton size="small" onClick={() => onOpenDetail(r)}>
                                                        <InfoOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                {/* PENDING do lockRequested → Duyệt khóa / Từ chối yêu cầu */}
                                                {isLockPending && (
                                                    <>
                                                        <Tooltip title="Phê duyệt khóa tài khoản">
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="warning"
                                                                sx={{ ml: 1 }}
                                                                onClick={() => onLock(r)}        // truyền row để FE quyết định “duyệt khóa”
                                                            >
                                                                Duyệt khóa
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Từ chối yêu cầu khóa">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ ml: 1 }}
                                                                onClick={() => onRejectLock?.(r.id)}
                                                            >
                                                                Từ chối
                                                            </Button>
                                                        </Tooltip>
                                                    </>
                                                )}

                                                {/* PENDING do deleteRequested → Xóa / Từ chối */}
                                                {isDeletePending && (
                                                    <>
                                                        <Tooltip title="Phê duyệt xóa vĩnh viễn">
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="error"
                                                                sx={{ ml: 1 }}
                                                                onClick={() => onApproveDelete(r.id)}
                                                            >
                                                                Xóa
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Từ chối yêu cầu xóa">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ ml: 1 }}
                                                                onClick={() => onRejectDelete(r.id)}
                                                            >
                                                                Từ chối
                                                            </Button>
                                                        </Tooltip>
                                                    </>
                                                )}

                                                {/* Không pending → Lock/Unlock thường */}
                                                {!isPending && (
                                                    !isLocked ? (
                                                        <Tooltip title="Khóa">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => onLock(r)}    
                                                            >
                                                                <LockOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title="Mở khóa">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => onUnlock(r.id)}
                                                            >
                                                                <LockOpenOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Footer: page-size + pagination */}
                <Box
                    sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Select
                            size="small"
                            value={pageSize}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setPageSize(v);
                                setPage(1);
                            }}
                            sx={{
                                height: 40,
                                minWidth: 100,
                                borderRadius: "8px",
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff" },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#3059ff",
                                    borderWidth: 1.4,
                                },
                            }}
                        >
                            {[10, 20, 50].map((v) => (
                                <MenuItem key={v} value={v}>
                                    {v}
                                </MenuItem>
                            ))}
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
    );
}

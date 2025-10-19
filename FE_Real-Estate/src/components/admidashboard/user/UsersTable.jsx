import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Avatar, Chip, Stack, Typography, Tooltip, IconButton, Button, Pagination, PaginationItem } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import { styles, ROLE_COLOR, STATUS_COLOR, HOVER_BG } from "./constants";
import { initials } from "../../../utils/validators";
import { Select } from "antd";
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
    onLock,
    onUnlock,
    onMarkDeleteRequested,
    onRejectDelete,
    onApproveDelete,
}) {
    return (
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
                            ) : rows.map((r) => (
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
                                            <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", fontWeight: 700 }}>{initials(r.fullName)}</Avatar>
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

                                    <TableCell align="center">
                                        {r.deleteRequested
                                            ? <Chip label="Đã yêu cầu" color="error" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                            : <Chip label="Không" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                        }
                                    </TableCell>

                                    <TableCell sx={{ ...styles.bodyCell, textAlign: "center", fontWeight: 700 }}>
                                        {r.postsCount}
                                    </TableCell>

                                    <TableCell sx={styles.bodyCell}>{r.createdAtText}</TableCell>

                                    <TableCell align="right" sx={styles.bodyCell} onClick={(e) => e.stopPropagation()}>
                                        <Tooltip title="Chi tiết">
                                            <IconButton size="small" onClick={() => onOpenDetail(r)}>
                                                <InfoOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {r.status !== "LOCKED" ? (
                                            <Tooltip title="Khóa">
                                                <IconButton size="small" color="error" onClick={() => onLock(r.id)}>
                                                    <LockOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title="Mở khóa">
                                                <IconButton size="small" color="primary" onClick={() => onUnlock(r.id)}>
                                                    <LockOpenOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {r.deleteRequested ? (
                                            <>
                                                <Tooltip title="Phê duyệt xóa vĩnh viễn">
                                                    <Button size="small" variant="contained" color="error" sx={{ ml: 1 }} onClick={() => onApproveDelete(r.id)}>
                                                        Xóa
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip title="Từ chối yêu cầu xóa">
                                                    <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => onRejectDelete(r.id)}>
                                                        Từ chối
                                                    </Button>
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <Tooltip title="Đánh dấu đã nhận yêu cầu xóa (demo)">
                                                <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => onMarkDeleteRequested(r.id)}>
                                                    Yêu cầu xóa
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
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
                            {[10, 20, 50].map((v) => <PaginationItem as="div" key={v} component="div"><option value={v}>{v}</option></PaginationItem>)}
                        </Select>
                        {/* fallback simple select for SSR/option */}
                        <select hidden value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                            {[10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
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

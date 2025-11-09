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
    Menu,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import BlockIcon from "@mui/icons-material/Block";
import UndoIcon from "@mui/icons-material/Undo";
import { useState } from "react";
import { styles, ROLE_COLOR, STATUS_COLOR, HOVER_BG } from "./constants";
import { initials } from "../../../utils/validators";

/**
 * rows: [{ id, fullName, email, phone, role, status, displayStatus, lockRequested, deleteRequested, postsCount, createdAtText }]
 * onLock(row), onUnlock(id), onRejectLock(id), onApproveDelete(id), onRejectDelete(id)
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
    onLock,
    onUnlock,
    onRejectLock,
    onApproveDelete,
    onRejectDelete,
    loading = false,
}) {
    // mobile action menu
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const openMenu = Boolean(anchorEl);

    const handleOpenMenu = (e, row) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setMenuRow(row);
    };
    const handleCloseMenu = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };

    const runAndClose = (fn) => {
        if (!menuRow) return;
        fn(menuRow);
        handleCloseMenu();
    };

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

            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                <TableContainer
                    sx={{
                        borderRadius: "10px",
                        overflow: "auto",
                        border: "1px solid #eef2f9",
                        // cho phép cuộn ngang trên mobile
                        maxWidth: "100%",
                    }}
                >
                    <Table size="small" sx={{ minWidth: 860 }}>
                        <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
                            <TableRow>
                                <TableCell sx={styles.headCell}>ID</TableCell>
                                <TableCell sx={styles.headCell}>Họ tên / Email</TableCell>

                                {/* Ẩn SĐT ở xs */}
                                <TableCell sx={{ ...styles.headCell, display: { xs: "none", sm: "table-cell" } }}>
                                    SĐT
                                </TableCell>

                                <TableCell sx={styles.headCell}>Vai trò</TableCell>
                                <TableCell sx={styles.headCell}>Trạng thái</TableCell>

                                {/* Ẩn Yêu cầu xóa ở xs */}
                                <TableCell
                                    sx={{ ...styles.headCell, display: { xs: "none", md: "table-cell" } }}
                                    align="center"
                                >
                                    Yêu cầu xóa
                                </TableCell>

                                {/* Ẩn Tin đăng ở xs */}
                                <TableCell
                                    sx={{ ...styles.headCell, display: { xs: "none", sm: "table-cell" }, textAlign: "center" }}
                                >
                                    Tin đăng
                                </TableCell>

                                {/* Ẩn Tạo lúc ở sm- */}
                                <TableCell
                                    sx={{ ...styles.headCell, display: { xs: "none", md: "table-cell" } }}
                                >
                                    Tạo lúc
                                </TableCell>

                                <TableCell sx={styles.headCell} align="right">
                                    Thao tác
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        align="center"
                                        sx={{ py: 6, color: "#7a8aa1", bgcolor: "#fff" }}
                                    >
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
                                                "& td": { transition: "background-color 140ms ease", py: { xs: 1, sm: 1.25 } },
                                                "&:hover td": { backgroundColor: HOVER_BG },
                                                cursor: "pointer",
                                            }}
                                            onClick={() => onOpenDetail(r)}
                                        >
                                            <TableCell sx={styles.bodyCell}>{r.id}</TableCell>

                                            <TableCell sx={styles.bodyCell}>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: "#e6f0ff",
                                                            color: "#3059ff",
                                                            fontWeight: 700,
                                                            width: { xs: 30, sm: 36 },
                                                            height: { xs: 30, sm: 36 },
                                                            fontSize: { xs: 13, sm: 14 },
                                                        }}
                                                    >
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

                                            <TableCell
                                                sx={{ ...styles.bodyCell, display: { xs: "none", sm: "table-cell" } }}
                                            >
                                                {r.phone}
                                            </TableCell>

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

                                            <TableCell
                                                align="center"
                                                sx={{ display: { xs: "none", md: "table-cell" } }}
                                            >
                                                {r.deleteRequested ? (
                                                    <Chip
                                                        label="Đã yêu cầu"
                                                        color="error"
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Không"
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                )}
                                            </TableCell>

                                            <TableCell
                                                sx={{
                                                    ...styles.bodyCell,
                                                    display: { xs: "none", sm: "table-cell" },
                                                    textAlign: "center",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {r.postsCount}
                                            </TableCell>

                                            <TableCell
                                                sx={{ ...styles.bodyCell, display: { xs: "none", md: "table-cell" } }}
                                            >
                                                {r.createdAtText}
                                            </TableCell>

                                            {/* Thao tác */}
                                            <TableCell
                                                align="right"
                                                sx={{ ...styles.bodyCell, cursor: "default", whiteSpace: "nowrap" }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Desktop ≥ md: nút đầy đủ */}
                                                <Box sx={{ display: { xs: "none", md: "inline-flex" }, alignItems: "center" }}>
                                                    <Tooltip title="Chi tiết">
                                                        <IconButton size="small" onClick={() => onOpenDetail(r)}>
                                                            <InfoOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {isLockPending && (
                                                        <>
                                                            <Tooltip title="Phê duyệt khóa tài khoản">
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="warning"
                                                                    sx={{ ml: 1 }}
                                                                    onClick={() => onLock(r)}
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

                                                    {!isPending && (
                                                        !isLocked ? (
                                                            <Tooltip title="Khóa">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => onLock(r)}
                                                                    sx={{ ml: 0.5 }}
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
                                                                    sx={{ ml: 0.5 }}
                                                                >
                                                                    <LockOpenOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )
                                                    )}
                                                </Box>

                                                {/* Mobile/Tablet < md: gom vào menu ba chấm */}
                                                <Box sx={{ display: { xs: "inline-flex", md: "none" } }}>
                                                    <IconButton size="small" onClick={(e) => handleOpenMenu(e, r)}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
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
                        flexWrap: "wrap",
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
                                minWidth: { xs: 88, sm: 100 },
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

            {/* Mobile action menu */}
            <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
                {/* Chi tiết */}
                <MenuItem
                    onClick={() => runAndClose((r) => onOpenDetail(r))}
                >
                    <ListItemIcon>
                        <InfoOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Chi tiết</ListItemText>
                </MenuItem>

                {/* PENDING do lock */}
                {menuRow?.lockRequested && !menuRow?.deleteRequested && (
                    <>
                        <MenuItem onClick={() => runAndClose((r) => onLock(r))}>
                            <ListItemIcon>
                                <BlockIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Duyệt khóa</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => runAndClose((r) => onRejectLock?.(r.id))}>
                            <ListItemIcon>
                                <UndoIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Từ chối yêu cầu khóa</ListItemText>
                        </MenuItem>
                    </>
                )}

                {/* PENDING do delete */}
                {menuRow?.deleteRequested && !menuRow?.lockRequested && (
                    <>
                        <MenuItem onClick={() => runAndClose((r) => onApproveDelete(r.id))}>
                            <ListItemIcon>
                                <DeleteForeverIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Phê duyệt xóa vĩnh viễn</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => runAndClose((r) => onRejectDelete(r.id))}>
                            <ListItemIcon>
                                <UndoIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Từ chối yêu cầu xóa</ListItemText>
                        </MenuItem>
                    </>
                )}

                {/* Không pending → lock / unlock */}
                {!menuRow?.lockRequested && !menuRow?.deleteRequested && (
                    <>
                        {menuRow?.status !== "LOCKED" ? (
                            <MenuItem onClick={() => runAndClose((r) => onLock(r))}>
                                <ListItemIcon>
                                    <LockOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Khóa tài khoản</ListItemText>
                            </MenuItem>
                        ) : (
                            <MenuItem onClick={() => runAndClose((r) => onUnlock(r.id))}>
                                <ListItemIcon>
                                    <LockOpenOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Mở khóa tài khoản</ListItemText>
                            </MenuItem>
                        )}
                    </>
                )}
            </Menu>
        </Paper>
    );
}

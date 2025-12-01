import {
    Box,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
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
    Rating,
} from "@mui/material";

import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import { useState } from "react";
import { styles, STATUS_COLOR, HOVER_BG } from "../user/constants";

export default function SiteReviewsTable({
    rows,
    page,
    totalPages,
    start,
    end,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
    onShow,
    onHide,
    onDelete,
    loading = false,
}) {
    // menu mobile
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
                        maxWidth: "100%",
                    }}
                >
                    <Table size="small" sx={{ minWidth: 860 }}>
                        <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
                            <TableRow>
                                <TableCell sx={styles.headCell}>ID</TableCell>

                                <TableCell sx={styles.headCell}>Người dùng / Email</TableCell>

                                {/* Rating ẩn trên xs nếu muốn gọn */}
                                <TableCell
                                    sx={{
                                        ...styles.headCell,
                                        minWidth: 170,
                                        display: { xs: "none", sm: "table-cell" },
                                    }}
                                >
                                    Đánh giá
                                </TableCell>

                                <TableCell sx={styles.headCell}>Nhận xét</TableCell>

                                {/* Ngày tạo: ẩn ở mobile nhỏ */}
                                <TableCell
                                    sx={{
                                        ...styles.headCell,
                                        display: { xs: "none", md: "table-cell" },
                                    }}
                                >
                                    Ngày
                                </TableCell>

                                <TableCell sx={styles.headCell}>Trạng thái</TableCell>

                                <TableCell sx={styles.headCell} align="right">
                                    Thao tác
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        align="center"
                                        sx={{ py: 6, color: "#7a8aa1", bgcolor: "#fff" }}
                                    >
                                        Không có dữ liệu
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((r) => {
                                    const isPublished = r.status === "PUBLISHED";

                                    return (
                                        <TableRow
                                            key={r.id}
                                            hover
                                            sx={{
                                                "& td": {
                                                    transition: "background-color 140ms ease",
                                                    py: { xs: 1, sm: 1.25 },
                                                },
                                                "&:hover td": { backgroundColor: HOVER_BG },
                                                cursor: "default", // không click row nữa
                                            }}
                                        >
                                            <TableCell sx={styles.bodyCell}>{r.id}</TableCell>

                                            <TableCell sx={styles.bodyCell}>
                                                <Stack spacing={0.3}>
                                                    <Typography fontWeight={700} noWrap>
                                                        {r.userName || "(Người dùng)"}
                                                    </Typography>
                                                    <Typography
                                                        fontSize={12}
                                                        color="#718198"
                                                        noWrap
                                                    >
                                                        {r.email}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            <TableCell
                                                sx={{
                                                    ...styles.bodyCell,
                                                    display: { xs: "none", sm: "table-cell" },
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
                                                    <Rating
                                                        value={r.rating || 0}
                                                        precision={0.5}
                                                        readOnly
                                                        size="small"
                                                    />
                                                    <Typography
                                                        fontSize={12}
                                                        color="#718198"
                                                    >
                                                        {r.rating?.toFixed
                                                            ? `${r.rating.toFixed(1)} / 5`
                                                            : `${r.rating || 0} / 5`}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            <TableCell
                                                sx={{
                                                    ...styles.bodyCell,
                                                    maxWidth: 380,
                                                }}
                                            >
                                                <Typography
                                                    fontSize={13}
                                                    sx={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {r.comment}
                                                </Typography>
                                            </TableCell>

                                            <TableCell
                                                sx={{
                                                    ...styles.bodyCell,
                                                    display: { xs: "none", md: "table-cell" },
                                                }}
                                            >
                                                {r.createdAt}
                                            </TableCell>

                                            <TableCell sx={styles.bodyCell}>
                                                <Chip
                                                    label={r.status}
                                                    color={STATUS_COLOR[r.status] || "default"}
                                                    size="small"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>

                                            {/* Thao tác */}
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    ...styles.bodyCell,
                                                    cursor: "default",
                                                    whiteSpace: "nowrap",
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Desktop ≥ md: icon đầy đủ */}
                                                <Box
                                                    sx={{
                                                        display: { xs: "none", md: "inline-flex" },
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    {isPublished ? (
                                                        <Tooltip title="Ẩn đánh giá">
                                                            <IconButton
                                                                size="small"
                                                                color="warning"
                                                                sx={{ ml: 0.5 }}
                                                                onClick={() => onHide?.(r)}
                                                            >
                                                                <VisibilityOffIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title="Hiển thị đánh giá">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                sx={{ ml: 0.5 }}
                                                                onClick={() => onShow?.(r)}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title="Xóa đánh giá">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            sx={{ ml: 0.5 }}
                                                            onClick={() => onDelete?.(r)}
                                                        >
                                                            <DeleteForeverIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>

                                                {/* Mobile/Tablet < md: gom vào menu ba chấm */}
                                                <Box
                                                    sx={{
                                                        display: { xs: "inline-flex", md: "none" },
                                                    }}
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleOpenMenu(e, r)}
                                                    >
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
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#d7deec",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#3059ff",
                                },
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
                                    previous: () => (
                                        <span style={{ padding: "0 10px" }}>Trước</span>
                                    ),
                                    next: () => (
                                        <span style={{ padding: "0 10px" }}>Tiếp Theo</span>
                                    ),
                                }}
                                sx={{
                                    outline: "none",
                                    "&:focus": { outline: "none" },
                                    "&.Mui-focusVisible": {
                                        outline: "none",
                                        boxShadow: "none",
                                    },
                                    height: 40,
                                    minWidth: 40,
                                    px: 1.5,
                                    borderRadius: "12px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    "&.MuiPaginationItem-root": {
                                        border: "1px solid #e5e7eb",
                                    },
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
                            "& .MuiButtonBase-root": {
                                WebkitTapHighlightColor: "transparent",
                            },
                        }}
                    />
                </Box>
            </Box>

            {/* Mobile action menu */}
            <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
                {menuRow?.status === "PUBLISHED" ? (
                    <MenuItem onClick={() => runAndClose((r) => onHide?.(r))}>
                        <ListItemIcon>
                            <VisibilityOffIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Ẩn đánh giá</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => runAndClose((r) => onShow?.(r))}>
                        <ListItemIcon>
                            <VisibilityIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Hiển thị đánh giá</ListItemText>
                    </MenuItem>
                )}

                <MenuItem onClick={() => runAndClose((r) => onDelete?.(r))}>
                    <ListItemIcon>
                        <DeleteForeverIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Xóa đánh giá</ListItemText>
                </MenuItem>
            </Menu>
        </Paper>
    );
}

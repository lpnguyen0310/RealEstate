import React from "react";
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
  Pagination,
  PaginationItem,
  Select,
  MenuItem,
  Badge,
  Checkbox,
  Toolbar,
  Button,
  alpha,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import { HOVER_BG, STATUS_LABEL, STATUS_CHIP_COLOR, styles } from "./constants";

/* ===== Ribbon config ===== */
const RIBBON_STYLES = {
  PREMIUM: {
    label: "PREMIUM",
    bg: "#f97316", // cam
    fold: "#c2410c", // gập tối hơn
    color: "#fff",
  },
  VIP: {
    label: "VIP",
    bg: "#eab308", // vàng
    fold: "#a16207",
    color: "#000",
  },
};

/* ===== Helpers ===== */
const shortMoney = (value) => {
  if (value == null || isNaN(value)) return "-";
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return billions % 1 === 0 ? `${billions.toFixed(0)} tỷ` : `${billions.toFixed(1)} tỷ`;
  }
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return millions % 1 === 0 ? `${millions.toFixed(0)} triệu` : `${millions.toFixed(1)} triệu`;
  }
  return value.toLocaleString("vi-VN") + " đ";
};

export default function PostsTable({
  rows,
  loading,
  actioningId,
  page,
  totalPages,
  start,
  end,
  totalItems,
  pageSize,
  setPage,
  setPageSize,
  onOpenDetail,
  onApprove,
  onReject,
  onHide,
  onUnhide,
  onHardDelete,
  onOpenReports,
  money,
  fmtDate,
  setDecision,
  selectedIds = [],
  onSelectAll,
  onSelectOne,
  onBulkApprove,
  onBulkReject,
}) {
  const numSelected = selectedIds.length;
  const rowCount = rows.length;
  const isAllSelected = rowCount > 0 && rows.every((r) => selectedIds.includes(r.id));

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "#fff",
        borderRadius: "14px",
        border: "1px solid #e8edf6",
        boxShadow: "0 6px 18px rgba(13,47,97,0.06)",
        mt: 2,
        overflow: "hidden",
      }}
    >
      {numSelected > 0 && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            borderBottom: "1px solid #eef2f9",
            minHeight: "50px !important",
          }}
        >
          <Typography sx={{ flex: "1 1 100%" }} color="inherit" variant="subtitle1" component="div">
            Đã chọn <b>{numSelected}</b> tin
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={onBulkApprove}
              sx={{ whiteSpace: "nowrap", boxShadow: "none" }}
            >
              Duyệt ({numSelected})
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<HighlightOffOutlinedIcon />}
              onClick={onBulkReject}
              sx={{ whiteSpace: "nowrap", boxShadow: "none" }}
            >
              Từ chối ({numSelected})
            </Button>
          </Stack>
        </Toolbar>
      )}
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        {/* ===== Table cuộn ngang + header dính (giống UsersTable) ===== */}
        <TableContainer
          sx={{
            borderRadius: "10px",
            border: "1px solid #eef2f9",
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.25)",
              borderRadius: 999,
            },
          }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              minWidth: { xs: 1300, sm: 0 }, // ép rộng ở mobile để có thanh cuộn ngang
              tableLayout: "fixed",
            }}
          >
            <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
              <TableRow>
                <TableCell padding="checkbox" sx={{ ...styles.headCell, width: "40px !important" }}>
                  <Checkbox
                    color="primary"
                    indeterminate={numSelected > 0 && !isAllSelected}
                    checked={rowCount > 0 && isAllSelected}
                    onChange={onSelectAll}
                    inputProps={{
                      "aria-label": "select all posts",
                    }}
                    disabled={loading || rows.length === 0}
                  />
                </TableCell>
                <TableCell sx={{ ...styles.headCell, width: 80 }}>Mã tin</TableCell>
                <TableCell sx={{ ...styles.headCell, width: 300 }}>Tiêu đề</TableCell>

                {/* Ẩn Loại ở xs */}
                <TableCell
                  sx={{ ...styles.headCell, width: 100, display: { xs: "none", sm: "table-cell" } }}
                >
                  Loại
                </TableCell>

                <TableCell sx={{ ...styles.headCell, width: 120 }} align="right">
                  Giá
                </TableCell>

                <TableCell sx={{ ...styles.headCell, width: 140 }}>Trạng thái</TableCell>
                {/* Ẩn Báo cáo ở xs */}
                <TableCell
                  sx={{ ...styles.headCell, width: 80, display: { xs: "none", sm: "table-cell" } }}
                  align="right"
                >
                  Báo cáo
                </TableCell>

                {/* Ẩn Tạo lúc ở md- */}
                <TableCell sx={{ ...styles.headCell, display: { xs: "none", md: "table-cell" } }}>
                  Tạo lúc
                </TableCell>

                {/* Ẩn Hết hạn ở md- */}
                <TableCell sx={{ ...styles.headCell, display: { xs: "none", md: "table-cell" } }}>
                  Hết hạn
                </TableCell>

                {/* Ẩn Người tạo ở sm- */}
                <TableCell sx={{ ...styles.headCell, display: { xs: "none", sm: "table-cell" } }}>
                  Người tạo
                </TableCell>

                <TableCell sx={{ ...styles.headCell }} align="right">
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    align="center"
                    sx={{ py: 6, color: "#7a8aa1", bgcolor: "#fff" }}
                  >
                    {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const disabled = actioningId === r.id;
                  const isSelected = selectedIds.includes(r.id);
                  const ribbon = r.listingType ? RIBBON_STYLES[r.listingType] : null;

                  return (
                    <TableRow
                      key={r.id}
                      hover
                      selected={isSelected}
                      sx={{
                        "& td": {
                          transition: "background-color 140ms ease",
                          py: { xs: 1, sm: 1.25 },
                        },
                        "&.Mui-selected": { backgroundColor: alpha("#3059ff", 0.08) },
                        "&.Mui-selected:hover": { backgroundColor: alpha("#3059ff", 0.12) },
                        "&:hover td": { backgroundColor: !isSelected && HOVER_BG },
                      }}
                    >
                      <TableCell padding="checkbox" sx={styles.bodyCell}>
                        <Checkbox
                          color="primary"
                          checked={isSelected}
                          onChange={(event) => {
                            event.stopPropagation();
                            onSelectOne(r.id);
                          }}
                        />
                      </TableCell>

                      {/* Mã tin + Ribbon */}
                      <TableCell
                        sx={{
                          ...styles.bodyCell,
                          whiteSpace: "nowrap",
                          position: "relative",
                          pl: ribbon ? 3 : styles.bodyCell?.pl,
                        }}
                      >
                        {ribbon && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: -8,
                              left: -6,
                              bgcolor: ribbon.bg,
                              color: ribbon.color,
                              fontSize: "9px",
                              fontWeight: "bold",
                              lineHeight: 1,
                              py: 0.5,
                              px: 0.8,
                              borderRadius: "4px",
                              zIndex: 10,
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                              "&::after": {
                                content: '""',
                                position: "absolute",
                                bottom: "-4px",
                                left: "4px",
                                borderWidth: "4px 4px 0 0",
                                borderStyle: "solid",
                                borderColor: `${ribbon.fold} transparent transparent transparent`,
                              },
                            }}
                          >
                            {ribbon.label}
                          </Box>
                        )}
                        {r.id}
                      </TableCell>

                      {/* Tiêu đề */}
                      <TableCell sx={styles.bodyCell}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "#eef2ff", color: "#4f46e5" }}>
                            <ArticleOutlinedIcon fontSize="small" />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              fontWeight={700}
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {r.title}
                            </Typography>
                            <Typography fontSize={12} color="#718198" noWrap>
                              {r.author?.name} • {r.author?.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Loại (ẩn ở xs) */}
                      <TableCell
                        sx={{ ...styles.bodyCell, display: { xs: "none", sm: "table-cell" } }}
                      >
                        {r.category}
                      </TableCell>

                      {/* Giá */}
                      <TableCell
                        sx={{
                          ...styles.bodyCell,
                          textAlign: "right",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {shortMoney(r.price)}
                      </TableCell>

                      {/* Trạng thái */}
                      <TableCell sx={{ ...styles.bodyCell, whiteSpace: "nowrap" }}>
                        <Chip
                          label={STATUS_LABEL[r.status] ?? r.status}
                          color={STATUS_CHIP_COLOR[r.status] ?? "default"}
                          size="small"
                          sx={{ fontWeight: 600, width: "120px" }}
                        />
                      </TableCell>

                      {/* Báo cáo (ẩn ở xs) */}
                      <TableCell
                        sx={{
                          ...styles.bodyCell,
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        {(r.reportCount || 0) > 0 ? (
                          <Tooltip title="Xem chi tiết báo cáo">
                            <IconButton
                              size="small"
                              onClick={() => onOpenReports(r.id)}
                              color="error"
                              disabled={disabled}
                            >
                              <Badge badgeContent={r.reportCount} color="error">
                                <FeedbackOutlinedIcon fontSize="small" />
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* Tạo lúc (ẩn ở md-) */}
                      <TableCell
                        sx={{ ...styles.bodyCell, display: { xs: "none", md: "table-cell" } }}
                      >
                        {fmtDate(r.createdAt)}
                      </TableCell>

                      {/* Hết hạn (ẩn ở md-) */}
                      <TableCell
                        sx={{ ...styles.bodyCell, display: { xs: "none", md: "table-cell" } }}
                      >
                        {fmtDate(r.expiresAt)}
                      </TableCell>

                      {/* Người tạo (ẩn ở sm-) */}
                      <TableCell
                        sx={{ ...styles.bodyCell, display: { xs: "none", sm: "table-cell" } }}
                      >
                        {r.author?.name || "-"}
                      </TableCell>

                      {/* Thao tác */}
                      <TableCell align="right" sx={{ ...styles.bodyCell, whiteSpace: "nowrap" }}>
                        <Tooltip title="Xem tin">
                          <span>
                            <IconButton
                              size="small"
                              disabled={disabled}
                              onClick={() => {
                                onOpenDetail(r);
                                setDecision?.((s) => ({
                                  ...s,
                                  listingType: r.listingType || "NORMAL",
                                }));
                              }}
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {r.status === "PENDING_REVIEW" && (
                          <>
                            <Tooltip title="Duyệt đăng">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  disabled={disabled}
                                  onClick={() => onApprove(r.id)}
                                >
                                  <CheckCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Từ chối">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={disabled}
                                  onClick={() => onReject(r.id)}
                                >
                                  <HighlightOffOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}

                        {(r.status === "PUBLISHED" || r.status === "EXPIRING_SOON") && (
                          <Tooltip title="Ẩn bài">
                            <span>
                              <IconButton
                                size="small"
                                color="default"
                                disabled={disabled}
                                onClick={() => onHide(r.id)}
                              >
                                <VisibilityOffOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        {r.status === "HIDDEN" && (
                          <Tooltip title="Hiện lại">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={disabled}
                                onClick={() => onUnhide(r.id)}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        {(r.status === "DRAFT" ||
                          r.status === "REJECTED" ||
                          r.status === "EXPIRED") && (
                            <Tooltip title="Xóa vĩnh viễn">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={disabled}
                                  onClick={() => onHardDelete(r.id)}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ===== Footer ===== */}
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
    </Paper>
  );
}

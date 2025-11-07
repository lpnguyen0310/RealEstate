import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Avatar, Chip, Stack, Typography, Tooltip, IconButton, Pagination, PaginationItem, Select, MenuItem,
  Badge // <<< ĐÃ THÊM
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined"; // <<< ĐÃ THÊM
import { HOVER_BG, STATUS_LABEL, STATUS_CHIP_COLOR, styles } from "./constants";
const shortMoney = (value) => {
 if (value == null || isNaN(value)) return "-";
  if (value >= 1_000_000_000) {
   const billions = value / 1_000_000_000;
    return billions % 1 === 0
      ? `${billions.toFixed(0)} tỷ`
      : `${billions.toFixed(1)} tỷ`;
  }
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
   return millions % 1 === 0
      ? `${millions.toFixed(0)} triệu`
      : `${millions.toFixed(1)} triệu`;
  }
  return value.toLocaleString("vi-VN") + " đ";
};
export default function PostsTable({
  rows, loading, actioningId,
  page, totalPages, start, end, totalItems, pageSize, setPage, setPageSize,
  onOpenDetail, onApprove, onReject, onHide, onUnhide, onHardDelete,
  onOpenReports, // <<< ĐÃ THÊM
  money, fmtDate, setDecision,
}) {
  return (
    <Paper elevation={0} sx={{ backgroundColor: "#fff", borderRadius: "14px", border: "1px solid #e8edf6", boxShadow: "0 6px 18px rgba(13,47,97,0.06)", mt: 2 }}>
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
                {/* === THÊM CỘT BÁO CÁO === */}
                <TableCell sx={styles.headCell} align="right">Báo cáo</TableCell> 
                <TableCell sx={styles.headCell}>Tạo lúc</TableCell>
                <TableCell sx={styles.headCell}>Hết hạn</TableCell>
                <TableCell sx={styles.headCell}>Người tạo</TableCell>
                <TableCell sx={styles.headCell} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  {/* === CẬP NHẬT COLSPAN === */}
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: "#7a8aa1", bgcolor: "#fff" }}>
                    {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => {
                const disabled = actioningId === r.id;
                return (
                  <TableRow key={r.id} hover sx={{ "& td": { transition: "background-color 140ms ease" }, "&:hover td": { backgroundColor: HOVER_BG } }}>
                    <TableCell sx={styles.bodyCell}>{r.id}</TableCell>

                    <TableCell sx={styles.bodyCell}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#eef2ff", color: "#4f46e5" }}>
                          <ArticleOutlinedIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700}>{r.title}</Typography>
                          <Typography fontSize={12} color="#718198" >
                            {r.author?.name} • {r.author?.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell sx={styles.bodyCell}>{r.category}</TableCell>
                    <TableCell sx={{ ...styles.bodyCell, textAlign: "right", fontWeight: 700 }}>{shortMoney(r.price)}</TableCell>

                    <TableCell sx={styles.bodyCell}>
                      <Chip label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_CHIP_COLOR[r.status] ?? "default"} size="small" />
                    </TableCell>

                    {/* === THÊM CELL BÁO CÁO === */}
                    <TableCell sx={{ ...styles.bodyCell, textAlign: "center" }}>
                      {(r.reportCount || 0) > 0 ? (
                        <Tooltip title="Xem chi tiết báo cáo">
                          <IconButton
                            size="small"
                            onClick={() => onOpenReports(r.id)} // Gọi hàm prop mới
                            color="error"
                            disabled={disabled}
                          >
                            <Badge badgeContent={r.reportCount} color="error">
                              <FeedbackOutlinedIcon fontSize="small" />
                            </Badge>
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>-</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={styles.bodyCell}>{fmtDate(r.createdAt)}</TableCell>
                    <TableCell sx={styles.bodyCell}>{fmtDate(r.expiresAt)}</TableCell>
                    <TableCell sx={styles.bodyCell}>{r.author?.name || "-"}</TableCell>

                    <TableCell align="right" sx={styles.bodyCell}>
                      <Tooltip title="Xem tin">
                        <span>
                          <IconButton size="small" disabled={disabled}
                            onClick={() => { onOpenDetail(r); setDecision?.((s) => ({ ...s, listingType: r.listingType || "NORMAL" })); }}>
                            <InfoOutlinedIcon fontSize="small" /> 
                          </IconButton>
                        </span>
                      </Tooltip>

                      {r.status === "PENDING_REVIEW" && (
                        <>
                          <Tooltip title="Duyệt đăng">
                            <span>
                              <IconButton size="small" color="success" disabled={disabled} onClick={() => onApprove(r.id)}>
                                <CheckCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Từ chối">
                            <span>
                              <IconButton size="small" color="error" disabled={disabled} onClick={() => onReject(r.id)}>
                                <HighlightOffOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}

                      {(r.status === "PUBLISHED" || r.status === "EXPIRING_SOON") && (
                        <Tooltip title="Ẩn bài">
                          <span>
                            <IconButton size="small" color="default" disabled={disabled} onClick={() => onHide(r.id)}>
                              <VisibilityOffOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {r.status === "HIDDEN" && (
                        <Tooltip title="Hiện lại">
                          <span>
                            <IconButton size="small" color="primary" disabled={disabled} onClick={() => onUnhide(r.id)}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {(r.status === "DRAFT" || r.status === "REJECTED" || r.status === "EXPIRED") && (
                        <Tooltip title="Xóa vĩnh viễn">
                          <span>
                            <IconButton size="small" color="error" disabled={disabled} onClick={() => onHardDelete(r.id)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Select
              size="small"
              value={pageSize}
              onChange={(e) => { const v = Number(e.target.value); setPageSize(v); setPage(1); }}
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
                  outline: "none", "&:focus": { outline: "none" }, "&.Mui-focusVisible": { outline: "none", boxShadow: "none" },
                  height: 40, minWidth: 40, px: 1.5, borderRadius: "12px", fontSize: 13, fontWeight: 600,
                  "&.MuiPaginationItem-root": { border: "1px solid #e5e7eb" },
                  "&.Mui-selected": { bgcolor: "#415a8c", color: "#fff", borderColor: "transparent", "&:hover": { bgcolor: "#415a8c" } },
                  "&.MuiPaginationItem-previousNext": {
                    bgcolor: "#e9eaee", color: "#6b7280", border: "none",
                    "&:hover": { bgcolor: "#dfe2e8" }, "&.Mui-disabled": { opacity: 0.6 },
                  },
                }}
              />
            )}
          />
        </Box>
      </Box>
    </Paper>
  );
}
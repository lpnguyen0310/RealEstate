import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, Typography, Select, MenuItem, Pagination, PaginationItem
} from "@mui/material";
import { useMemo } from "react";
import dayjs from "dayjs"; // ✨ THÊM IMPORT NÀY

const HOVER_BG = "#dbe7ff";

export default function OrderTable({
  data = [],
  page = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}) {
  const { start, end, totalPages } = useMemo(() => {
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(totalItems, page * pageSize);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    return { start, end, totalPages };
  }, [page, pageSize, totalItems]);

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
      <Box sx={{ p: 2 }}>
        <TableContainer
          sx={{
            borderRadius: "10px",
            overflow: "hidden",
            border: "1px solid #eef2f9",
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
              <TableRow>
                <TableCell sx={styles.headCell}>Mã đơn hàng</TableCell>
                {/* ===== 1. THÊM HEADER MỚI ===== */}
                <TableCell sx={styles.headCell}>Nội dung đơn hàng</TableCell>
                <TableCell sx={styles.headCell}>Trạng thái</TableCell>
                <TableCell sx={styles.headCell}>Ngày tạo</TableCell>
                <TableCell sx={styles.headCell}>Số tiền</TableCell>
                <TableCell sx={styles.headCell}>Tạo bởi</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    /* ===== 2. SỬA COLSPAN ===== */
                    colSpan={6}
                    align="center"
                    sx={{
                      py: 6,
                      color: "#7a8aa1",
                      backgroundColor: "#fff",
                    }}
                  >
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.orderId}
                    hover
                    sx={{
                      "& td": { transition: "background-color 140ms ease" },
                      "&:hover td": { backgroundColor: HOVER_BG },
                      cursor: 'pointer'
                    }}
                    onClick={() => onRowClick?.(row)}
                  >
                    <TableCell sx={styles.bodyCell}>{row.orderId}</TableCell>

                    {/* ===== 3. THÊM CELL MỚI ===== */}
                    <TableCell sx={styles.bodyCell}>
                    {
                      row.type === 'TOP_UP' 
                        // 1. Nếu type là TOP_UP, hiển thị "Nạp tiền"
                        ? <span >Nạp tiền tài khoản</span>
                        // 2. Ngược lại (là PACKAGE_PURCHASE), dùng logic cũ
                        : (!row.items || row.items.length === 0)
                          ? <span style={{ color: "#9e9e9e" }}>---</span>
                          : row.items.map(item => `${item.title} (x${item.qty})`).join(', ')
                    }
                  </TableCell>

                    <TableCell sx={styles.bodyCell}>
                      <span
                        style={{
                          color:
                            row.status === "PENDING_PAYMENT"
                              ? "#f28c38"
                              : row.status === "PAID"
                                ? "#1aa260"
                                : "#e53935",
                          fontWeight: 600,
                        }}
                      >
                        {row.status === 'PAID' ? 'Thành công' : row.status === 'PENDING_PAYMENT' ? 'Đang xử lý' : 'Đã hủy'}
                      </span>
                    </TableCell>
                    <TableCell sx={styles.bodyCell}>{dayjs(row.createdAt).format('DD/MM/YYYY HH:mm')}</TableCell>
                    <TableCell sx={styles.bodyCell}>{row.total.toLocaleString('vi-VN')} VND</TableCell>
                    <TableCell sx={styles.bodyCell}>{row.userName}</TableCell>
                  </TableRow>
                ))
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
              onChange={(e) => onPageSizeChange?.(e.target.value)}
              sx={{
                height: 40,
                minWidth: 96,
                borderRadius: "12px",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff", borderWidth: 1.4 },
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
            onChange={(_, newPage) => onPageChange?.(newPage)}
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

const styles = {
  headCell: { fontWeight: 600, fontSize: 14, color: "#1a3b7c" },
  bodyCell: { fontSize: 14, color: "#2b3a55" },
};
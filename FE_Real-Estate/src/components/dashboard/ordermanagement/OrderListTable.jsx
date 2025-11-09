// src/components/dashboard/ordermanagement/OrderListTable.jsx
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Select,
  MenuItem,
  Pagination,
  PaginationItem,
} from "@mui/material";
import { useMemo } from "react";
import dayjs from "dayjs";

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
      className="min-w-0"
    >
      <Box sx={{ p: 2 }}>
        {/* Wrapper cho phép KÉO NGANG trên mobile */}
        <Box sx={{ width: "100%", overflowX: "auto" }} className="no-scrollbar">
          <TableContainer
            sx={{
              minWidth: 720, // ép bề ngang để xuất hiện kéo ngang
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid #eef2f9",
            }}
          >
            <Table stickyHeader size="small">
              <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
                <TableRow
                  sx={{
                    "& th": {
                      whiteSpace: "nowrap",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#1a3b7c",
                    },
                  }}
                >
                  <TableCell>Mã đơn hàng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell>Số tiền</TableCell>
                  <TableCell>Tạo bởi</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 6, color: "#7a8aa1", backgroundColor: "#fff" }}
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
                        cursor: "pointer",
                        "& td": {
                          transition: "background-color 140ms ease",
                          whiteSpace: "nowrap",
                          fontSize: 14,
                          color: "#2b3a55",
                        },
                        "&:hover td": { backgroundColor: HOVER_BG },
                      }}
                      onClick={() => onRowClick?.(row)}
                    >
                      <TableCell>{row.orderId}</TableCell>
                      <TableCell>
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
                          {row.status === "PAID"
                            ? "Thành công"
                            : row.status === "PENDING_PAYMENT"
                              ? "Đang xử lý"
                              : "Đã hủy"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {dayjs(row.createdAt).format("DD/MM/YYYY HH:mm")}
                      </TableCell>
                      <TableCell>
                        {Number(row.total || 0).toLocaleString("vi-VN")} VND
                      </TableCell>
                      <TableCell>{row.userName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Footer: page-size + pagination (xếp dọc trên mobile) */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
          className="min-w-0"
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Select
              size="small"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(e.target.value)}
              sx={{
                height: 36,
                ".MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
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
            <Typography fontSize={13} color="#7a8aa1" noWrap>
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
                  ".MuiPaginationItem-previousNext": {
                    borderRadius: "8px",
                    border: "1px solid #e5e9f5",
                    bgcolor: "#fff",
                    "&:hover": { bgcolor: "#f5f8ff" },
                  },
                }}
              />
            )}
            sx={{
              width: { xs: "100%", sm: "auto" },
              display: "flex",
              justifyContent: { xs: "center", sm: "flex-end" },
              "& .MuiPagination-ul": { gap: "4px" },
              "& .MuiButtonBase-root": { WebkitTapHighlightColor: "transparent" },
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}

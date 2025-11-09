// src/components/dashboard/transactionsmanagement/TransactionTable.jsx
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

const HOVER_BG = "#eaf1ff";

// ===== Helpers =====
const toDateSafe = (isoString) => {
  if (!isoString) return null;
  let s = String(isoString).replace(" ", "T");
  s = s.replace(/\.(\d{3})\d+/, ".$1"); // giữ 3 số mili
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const formatDateTimeVI = (isoString) => {
  const d = toDateSafe(isoString);
  if (!d) return isoString || "-";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
};

export default function TransactionTable({
  data = [],
  page = 1,
  pageSize = 50,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "12px",
        border: "1px solid #e8edf6",
        boxShadow: "0 6px 18px rgba(13,47,97,0.06)",
        overflow: "hidden",
        background: "#fff",
      }}
      className="min-w-0"
    >
      {/* Wrapper cho phép kéo ngang trên mobile */}
      <Box sx={{ width: "100%", overflowX: "auto" }} className="no-scrollbar">
        <TableContainer
          sx={{
            minWidth: 880, // ép bề ngang để có vùng kéo; điều chỉnh tùy số cột
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
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
                <TableCell>ID</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Loại giao dịch</TableCell>
                <TableCell>Số tiền</TableCell>
                <TableCell>Mã giao dịch</TableCell>
                <TableCell>Lý do</TableCell>
                <TableCell>Ngày tạo</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#7a8aa1" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => onRowClick?.(row)}
                    sx={{
                      cursor: "pointer",
                      "& td": {
                        transition: "background-color 120ms ease",
                        whiteSpace: "nowrap",
                        fontSize: 14,
                        color: "#2b3a55",
                      },
                      "&:hover td": { backgroundColor: HOVER_BG },
                    }}
                  >
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            row.status === "Đang xử lý"
                              ? "#f28c38"
                              : row.status === "Thành công"
                                ? "#1aa260"
                                : "#e53935",
                        }}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>
                      {typeof row.amount === "number"
                        ? row.amount.toLocaleString("vi-VN")
                        : row.amount || "-"}
                    </TableCell>
                    <TableCell>{row.transactionCode}</TableCell>
                    <TableCell>{row.reason || "-"}</TableCell>
                    <TableCell>{formatDateTimeVI(row.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Footer: responsive (xếp dọc trên mobile) */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
        className="min-w-0"
      >
        <Box display="flex" alignItems="center" gap={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Select
            size="small"
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(e.target.value)}
            sx={{
              height: 40,
              minWidth: 90,
              borderRadius: "8px",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#3059ff",
                borderWidth: 1.4,
              },
            }}
          >
            {[50, 20, 100].map((v) => (
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
                outline: "none",
                "&:focus,&.Mui-focusVisible": { outline: "none", boxShadow: "none" },
                height: 40,
                minWidth: 40,
                px: 1.5,
                borderRadius: "12px",
                fontSize: 13,
                fontWeight: 700,
                "&.MuiPaginationItem-root": { border: "1px solid #e5e7eb" },
                "&.Mui-selected": {
                  backgroundColor: "#415a8c",
                  color: "#fff",
                  borderColor: "transparent",
                  "&:hover": { backgroundColor: "#415a8c" },
                },
                "&.MuiPaginationItem-previousNext": {
                  backgroundColor: "#edeef2",
                  color: "#6b7280",
                  border: "none",
                  "&:hover": { backgroundColor: "#e2e5ea" },
                  "&.Mui-disabled": { opacity: 0.6 },
                },
              }}
            />
          )}
          sx={{
            width: { xs: "100%", sm: "auto" },
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-end" },
            "& .MuiPagination-ul": { gap: "8px" },
            "& .MuiButtonBase-root": { WebkitTapHighlightColor: "transparent" },
          }}
        />
      </Box>
    </Paper>
  );
}

const s = {
  head: { fontWeight: 700, fontSize: 14, color: "#1a3b7c" },
  body: { fontSize: 14, color: "#2b3a55" },
};

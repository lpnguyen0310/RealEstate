// src/components/dashboard/transactionsmanagement/TransactionTable.jsx
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, Typography, Select, MenuItem, Pagination, PaginationItem
} from "@mui/material";

const HOVER_BG = "#eaf1ff";

// ===== Helpers =====
// Chuẩn hoá ISO có microseconds -> milliseconds (3 số) để Date parse ổn định
const toDateSafe = (isoString) => {
  if (!isoString) return null;
  let s = String(isoString).replace(" ", "T");         // phòng trường hợp có khoảng trắng
  s = s.replace(/\.(\d{3})\d+/, ".$1");                // giữ 3 số mili, bỏ phần dư
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
    >
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
            <TableRow>
              <TableCell sx={s.head}>ID</TableCell>
              <TableCell sx={s.head}>Trạng thái</TableCell>
              <TableCell sx={s.head}>Loại giao dịch</TableCell>
              <TableCell sx={s.head}>Số tiền</TableCell>
              <TableCell sx={s.head}>Mã giao dịch</TableCell>
              <TableCell sx={s.head}>Lý do</TableCell>
              <TableCell sx={s.head}>Ngày tạo</TableCell>
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
                    "& td": { transition: "background-color 120ms ease" },
                    "&:hover td": { backgroundColor: HOVER_BG },
                  }}
                >
                  <TableCell sx={s.body}>{row.id}</TableCell>

                  <TableCell sx={s.body}>
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

                  <TableCell sx={s.body}>{row.type}</TableCell>
                  <TableCell sx={s.body}>{row.amount}</TableCell>

                  {/* Dùng đúng key trả về từ API */}
                  <TableCell sx={s.body}>{row.transactionCode}</TableCell>

                  <TableCell sx={s.body}>{row.reason || "-"}</TableCell>

                  {/* Format datetime theo vi-VN */}
                  <TableCell sx={s.body}>{formatDateTimeVI(row.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
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

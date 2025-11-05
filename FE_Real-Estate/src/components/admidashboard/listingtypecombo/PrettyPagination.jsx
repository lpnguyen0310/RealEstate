import { Pagination } from "@mui/material";
import { Stack, Typography, FormControl, Select, MenuItem } from "@mui/material";

function PrettyPagination({
    page,            
    rowsPerPage,
    count,
    onPageChange,    // (newPage) => void  // newPage cũng 0-based
    onRowsPerPageChange, // (newRpp) => void
    rowsPerPageOptions = [5, 10, 20],
}) {
    const totalPages = Math.max(1, Math.ceil((count || 0) / (rowsPerPage || 1)));
    const start = count === 0 ? 0 : page * rowsPerPage + 1;
    const end = Math.min(count, (page + 1) * rowsPerPage);

    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{
                px: 2,
                py: 1.25,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
            }}
        >
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Hiển thị <b>{start}</b>–<b>{end}</b> trên <b>{count}</b>
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Rows:</Typography>
                <FormControl size="small">
                    <Select
                        value={rowsPerPage}
                        onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
                        sx={{ minWidth: 76, borderRadius: 2 }}
                    >
                        {rowsPerPageOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Pagination
                    page={page + 1}                 // Pagination là 1-based
                    count={totalPages}
                    onChange={(_, p1) => onPageChange(p1 - 1)}
                    variant="outlined"
                    shape="rounded"
                    size="small"
                    sx={{
                        "& .MuiPaginationItem-root": {
                            borderRadius: 2,
                        },
                    }}
                />
            </Stack>
        </Stack>
    );
}
export default PrettyPagination;
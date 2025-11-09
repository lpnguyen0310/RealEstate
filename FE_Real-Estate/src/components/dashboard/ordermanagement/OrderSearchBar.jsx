// src/components/dashboard/ordermanagement/TxSearchBar.jsx
import { Stack, Paper, TextField, Button } from "@mui/material";
import { Search, Download } from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function TxSearchBar({
    orderCode,
    onOrderCodeChange,
    date,
    onDateChange,
    onSearch,
    onExport,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: "12px",
                border: "1px solid #e8edf6",
                boxShadow: "0 6px 18px rgba(13,47,97,0.06)",
                backgroundColor: "#fff",
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ width: "100%" }}
            >
                {/* Mã đơn */}
                <TextField
                    label="Tìm kiếm theo mã đơn hàng"
                    variant="outlined"
                    size="small"
                    value={orderCode}
                    onChange={(e) => onOrderCodeChange?.(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
                    InputLabelProps={{ sx: { fontSize: 13, color: "#8a93a7", top: 3 } }}
                    InputProps={{
                        sx: {
                            height: 40,
                            borderRadius: "8px",
                            fontSize: 13,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#3059ff",
                                borderWidth: 1.4,
                            },
                        },
                    }}
                    sx={{ flex: { sm: 3 }, minWidth: 0, width: { xs: "100%", sm: "auto" } }}
                />

                {/* Ngày tạo */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Tìm kiếm theo ngày tạo"
                        value={date}
                        onChange={(v) => onDateChange?.(v)}
                        slotProps={{
                            textField: {
                                size: "small",
                                variant: "outlined",
                                onKeyDown: (e) => e.key === "Enter" && onSearch?.(),
                                InputLabelProps: {
                                    sx: { top: 3, fontSize: 13, color: "#8a93a7" },
                                },
                                sx: {
                                    flex: { sm: 1.2 },
                                    minWidth: { xs: "100%", sm: 180 },
                                    width: { xs: "100%", sm: "auto" },
                                    height: 40,
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
                                },
                            },
                        }}
                    />
                </LocalizationProvider>

                {/* Nút tìm kiếm */}
                <Button
                    variant="contained"
                    startIcon={<Search />}
                    onClick={onSearch}
                    sx={{
                        height: 40,
                        px: 1.5,
                        minWidth: 128,
                        flexShrink: 0,
                        borderRadius: "8px",
                        backgroundColor: "#0f2f63",
                        fontSize: 13,
                        textTransform: "none",
                        width: { xs: "100%", sm: "auto" },
                        "&:hover": { backgroundColor: "#0c2550" },
                    }}
                >
                    Tìm Kiếm
                </Button>

                {/* Nút export */}
                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={onExport}
                    sx={{
                        height: 40,
                        px: 3,
                        minWidth: 112,
                        flexShrink: 0,
                        borderRadius: "8px",
                        borderColor: "#d6e1ff",
                        color: "#0f2f63",
                        fontSize: 13,
                        textTransform: "none",
                        width: { xs: "100%", sm: "auto" },
                        "&:hover": { borderColor: "#3059ff", backgroundColor: "#f5f8ff" },
                    }}
                >
                    Excel
                </Button>
            </Stack>
        </Paper>
    );
}

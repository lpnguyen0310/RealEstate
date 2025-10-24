import React from "react";
import {
    Paper, Stack, TextField, InputAdornment, Select, MenuItem,
    Button, IconButton, Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { STATUS_COLOR } from "./constants";

export default function FiltersBar({
    q, setQ, status, setStatus, method, setMethod, sort, setSort, onSearch, loading,
}) {
    return (
        <Paper elevation={0} sx={{
            p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider",
            background: "linear-gradient(180deg, rgba(246,248,250,0.8) 0%, rgba(255,255,255,0.8) 100%)",
            backdropFilter: "blur(6px)",
        }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="stretch">
                <TextField
                    size="small" placeholder="Tìm theo mã đơn / khách / email…"
                    value={q} onChange={(e) => setQ(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        )
                    }}
                    sx={{ minWidth: 280, flex: 1 }}
                />
                <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}>
                    <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                    {Object.keys(STATUS_COLOR).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
                <Select size="small" value={method} onChange={(e) => setMethod(e.target.value)} sx={{ minWidth: 140 }}>
                    <MenuItem value="ALL">Tất cả phương thức</MenuItem>
                    {["COD", "VNPAY", "STRIPE", "BANK_QR", "ZALOPAY"].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
                <Select size="small" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 170 }}>
                    <MenuItem value="createdAt,DESC">Mới nhất</MenuItem>
                    <MenuItem value="createdAt,ASC">Cũ nhất</MenuItem>
                    <MenuItem value="amount,DESC">Số tiền ↓</MenuItem>
                    <MenuItem value="amount,ASC">Số tiền ↑</MenuItem>
                </Select>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Button onClick={onSearch} variant="contained" color="primary"
                        startIcon={<FilterAltOutlinedIcon />} disabled={loading} sx={{ borderRadius: 2 }}>
                        Lọc
                    </Button>
                    <Tooltip title="Xuất CSV (theo bộ lọc)">
                        <span><IconButton disabled={loading}><FileDownloadOutlinedIcon /></IconButton></span>
                    </Tooltip>
                </Stack>
            </Stack>
        </Paper>
    );
}

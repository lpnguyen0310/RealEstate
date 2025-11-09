import React, { useMemo, useState, forwardRef } from "react";
import {
    Paper, Stack, TextField, InputAdornment, Button, IconButton, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
    useMediaQuery, Badge, Slide
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { STATUS_COLOR } from "./constants";

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function FiltersBar({
    q, setQ, status, setStatus, method, setMethod, sort, setSort, onSearch, loading,
}) {
    const [open, setOpen] = useState(false);
    const [tmpStatus, setTmpStatus] = useState(status ?? "ALL");
    const [tmpMethod, setTmpMethod] = useState(method ?? "ALL");
    const [tmpSort, setTmpSort] = useState(sort ?? "createdAt,DESC");

    const isDirty = useMemo(() => {
        const def = { status: "ALL", method: "ALL", sort: "createdAt,DESC" };
        return (status ?? def.status) !== def.status
            || (method ?? def.method) !== def.method
            || (sort ?? def.sort) !== def.sort;
    }, [status, method, sort]);

    const handleOpen = () => {
        setTmpStatus(status ?? "ALL");
        setTmpMethod(method ?? "ALL");
        setTmpSort(sort ?? "createdAt,DESC");
        setOpen(true);
    };
    const handleClose = () => setOpen(false);
    const handleReset = () => {
        setTmpStatus("ALL");
        setTmpMethod("ALL");
        setTmpSort("createdAt,DESC");
    };
    const handleApply = () => {
        setStatus?.(tmpStatus);
        setMethod?.(tmpMethod);
        setSort?.(tmpSort);
        setOpen(false);
        onSearch?.();
    };

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    background: "linear-gradient(180deg, rgba(246,248,250,0.8) 0%, rgba(255,255,255,0.8) 100%)",
                    backdropFilter: "blur(6px)",
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo mã đơn / khách / email…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: { xs: 220, sm: 280 }, flex: 1 }}
                    />

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Bộ lọc nâng cao">
                            <span>
                                <IconButton onClick={handleOpen} disabled={loading}>
                                    <Badge
                                        color="secondary"
                                        variant="dot"
                                        invisible={!isDirty}
                                        overlap="circular"
                                    >
                                        <FilterAltOutlinedIcon />
                                    </Badge>
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Xuất CSV (theo bộ lọc)">
                            <span>
                                <IconButton disabled={loading}>
                                    <FileDownloadOutlinedIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Paper>

            {/* ===== Bottom Sheet (nửa màn hình) ===== */}
            <Dialog
                open={open}
                onClose={handleClose}
                TransitionComponent={Transition}
                keepMounted
                PaperProps={{
                    sx: {
                        m: 0,
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "50vh", // chỉ chiếm nửa màn hình
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                <DialogTitle>Bộ lọc</DialogTitle>
                <DialogContent dividers sx={{ flex: 1, overflowY: "auto" }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Select
                            size="small"
                            value={tmpStatus}
                            onChange={(e) => setTmpStatus(e.target.value)}
                        >
                            <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                            {Object.keys(STATUS_COLOR).map((s) => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </Select>

                        <Select
                            size="small"
                            value={tmpMethod}
                            onChange={(e) => setTmpMethod(e.target.value)}
                        >
                            <MenuItem value="ALL">Tất cả phương thức</MenuItem>
                            {["COD", "VNPAY", "STRIPE", "BANK_QR", "ZALOPAY"].map((m) => (
                                <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                        </Select>

                        <Select
                            size="small"
                            value={tmpSort}
                            onChange={(e) => setTmpSort(e.target.value)}
                        >
                            <MenuItem value="createdAt,DESC">Mới nhất</MenuItem>
                            <MenuItem value="createdAt,ASC">Cũ nhất</MenuItem>
                            <MenuItem value="amount,DESC">Số tiền ↓</MenuItem>
                            <MenuItem value="amount,ASC">Số tiền ↑</MenuItem>
                        </Select>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: "1px solid #eee" }}>
                    <Button onClick={handleReset} color="inherit">Đặt lại</Button>
                    <Button onClick={handleApply} variant="contained">Áp dụng</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

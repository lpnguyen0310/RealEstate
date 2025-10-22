// src/components/admidashboard/user/FiltersBar.jsx
import { Paper, Stack, TextField, Select, MenuItem, Button } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export default function FiltersBar({ q, setQ, role, setRole, status, setStatus, onReset }) {
    return (
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: "14px", border: "1px solid #e8edf6", bgcolor: "#fff" }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <TextField
                    size="small"
                    label="Tìm tên, email, SĐT…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    sx={{ width: 340 }}
                />
                <Select size="small" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 180 }}>
                    <MenuItem value="ALL">Tất cả vai trò</MenuItem>
                    <MenuItem value="USER">USER</MenuItem>
                    <MenuItem value="AGENT">AGENT</MenuItem>
                    <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
                {/* ✅ Chỉ còn ACTIVE / LOCKED */}
                <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 200 }}>
                    <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                    <MenuItem value="LOCKED">LOCKED</MenuItem>
                </Select>
                <Button startIcon={<RestartAltIcon />} onClick={onReset}>Xóa lọc</Button>
            </Stack>
        </Paper>
    );
}

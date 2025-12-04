import { Paper, Stack, TextField, Select, MenuItem, Button } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export default function FiltersBar({
    q,
    setQ,
    role,
    setRole,
    status,
    setStatus,
    request,        // NEW
    setRequest,     // NEW
    onReset,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.5, sm: 2 },
                mb: { xs: 1.5, sm: 2 },
                borderRadius: "14px",
                border: "1px solid #e8edf6",
                bgcolor: "#fff",
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                flexWrap="wrap"
                useFlexGap
            >
                <TextField
                    size="small"
                    label="Tìm tên, email, SĐT…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    sx={{ width: { xs: "100%", sm: 320, md: 360 } }}
                />

                <Select
                    size="small"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    sx={{ minWidth: { xs: "100%", sm: 180 }, width: { xs: "100%", sm: "auto" } }}
                >
                    <MenuItem value="ALL">Tất cả vai trò</MenuItem>
                    <MenuItem value="USER">USER</MenuItem>
                    <MenuItem value="AGENT">AGENT</MenuItem>
                    <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>

                <Select
                    size="small"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    sx={{ minWidth: { xs: "100%", sm: 200 }, width: { xs: "100%", sm: "auto" } }}
                >
                    <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                    <MenuItem value="LOCKED">LOCKED</MenuItem>
                </Select>

                {/* NEW: filter loại yêu cầu */}
                <Select
                    size="small"
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    sx={{ minWidth: { xs: "100%", sm: 220 }, width: { xs: "100%", sm: "auto" } }}
                >
                    <MenuItem value="ALL">Tất cả yêu cầu</MenuItem>
                    <MenuItem value="LOCK_REQUESTED">Tài khoản yêu cầu khóa</MenuItem>
                    <MenuItem value="DELETE_REQUESTED">Tài khoản yêu cầu xóa</MenuItem>
                </Select>

                <Button
                    startIcon={<RestartAltIcon />}
                    onClick={onReset}
                    sx={{
                        ml: { xs: 0, sm: "auto" },
                        alignSelf: { xs: "stretch", sm: "center" },
                        height: 36,
                    }}
                >
                    Xóa lọc
                </Button>
            </Stack>
        </Paper>
    );
}

// src/components/admidashboard/user/UserDetailDrawer.jsx
import { Drawer, Box, Stack, Avatar, Typography, Divider, Chip, Button } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import { ROLE_COLOR, STATUS_COLOR } from "./constants";
import { initials } from "../../../utils/validators";

function Row({ label, value }) {
    return (
        <Stack direction="row" justifyContent="space-between" gap={2}>
            <Typography sx={{ color: "#6b7280" }}>{label}</Typography>
            <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
        </Stack>
    );
}

export default function UserDetailDrawer({
    open,
    onClose,
    detail,
    fmtDate,
    onLock,
    onUnlock,
    onApproveDelete,
    onRejectDelete,
}) {
    if (!detail) return null;

    const isLocked = detail.status === "LOCKED";

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 520 } }}>
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", fontWeight: 700, width: 48, height: 48 }}>
                        {initials(detail.fullName)}
                    </Avatar>
                    <Box>
                        <Typography fontWeight={700}>{detail.fullName}</Typography>
                        <Typography fontSize={13} color="#7a8aa1">{detail.email}</Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Info */}
                <Stack spacing={1}>
                    <Row label="ID" value={detail.id} />
                    <Row label="SĐT" value={detail.phone || "-"} />
                    <Row
                        label="Vai trò"
                        value={<Chip label={detail.role} color={ROLE_COLOR[detail.role]} size="small" />}
                    />
                    <Row
                        label="Trạng thái"
                        value={<Chip label={detail.displayStatus || detail.status}
                            color={STATUS_COLOR[detail.displayStatus || detail.status]}
                            size="small" />}
                    />
                    <Row
                        label="Yêu cầu xóa"
                        value={
                            detail.deleteRequested
                                ? <Chip label="Đã yêu cầu" color="error" variant="outlined" size="small" />
                                : <Chip label="Không" variant="outlined" size="small" />
                        }
                    />
                    <Row label="Tin đăng" value={detail.postsCount} />
                    <Row label="Ngày tạo" value={fmtDate(detail.createdAt)} />
                    <Row label="Số dư ví" value={`${(detail.balance ?? 0).toLocaleString()} đ`} />
                    <Row label="Địa chỉ" value={detail.address || "-"} />
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Actions */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {!isLocked ? (
                        <Button
                            color="error"
                            startIcon={<LockOutlinedIcon />}
                            onClick={() => { onLock(detail.id); onClose(); }}
                        >
                            Khóa
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<LockOpenOutlinedIcon />}
                            onClick={() => { onUnlock(detail.id); onClose(); }}
                        >
                            Mở khóa
                        </Button>
                    )}

                    {detail.deleteRequested && (
                        <>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => { onApproveDelete(detail.id); onClose(); }}
                            >
                                Xóa vĩnh viễn
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => { onRejectDelete(detail.id); onClose(); }}
                            >
                                Từ chối yêu cầu
                            </Button>
                        </>
                    )}
                </Stack>
            </Box>
        </Drawer>
    );
}

import {
    Drawer, Box, Stack, Avatar, Typography, Divider, Chip, Button, Card, CardContent, Grid, Select, MenuItem, TextField
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import { STATUS_LABEL, STATUS_CHIP_COLOR, LISTING_TYPES } from "./constants";
import ImageViewer from "./ImageViewer";

function Row({ label, value }) {
    return (
        <Stack direction="row" justifyContent="space-between" gap={2}>
            <Typography sx={{ color: "#6b7280" }}>{label}</Typography>
            <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
        </Stack>
    );
}

export default function PostDetailDrawer({
    open, onClose, detail, decision, setDecision, money, fmtDate, onApprove, onReject,
}) {
    if (!detail) return null;

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 860 } }}>
            <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", fontWeight: 700, width: 48, height: 48 }}>
                        <ArticleOutlinedIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700}>{detail.title}</Typography>
                        <Typography fontSize={13} color="#7a8aa1">{detail.id} • {STATUS_LABEL[detail.status]}</Typography>
                    </Box>
                    <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} onClick={() => window.open(`/posts/${detail.id}`, "_blank")}>
                        Mở trên FE
                    </Button>
                </Stack>
                <Divider sx={{ my: 1.5 }} />

                <ImageViewer images={detail.images} />

                <Card sx={{ borderRadius: 2, mt: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={6}><Row label="Giá" value={money(detail.price)} /></Grid>
                            <Grid item xs={12} sm={6}><Row label="Diện tích" value={`${detail.area ?? "-"} m²`} /></Grid>
                            <Grid item xs={12} sm={6}>
                                <Row label="Loại tin" value={<Chip label={detail.listingType || "NORMAL"}
                                    color={detail.listingType === "VIP" ? "secondary" : detail.listingType === "PREMIUM" ? "warning" : "info"} size="small" />} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Row label="Trạng thái" value={<Chip label={STATUS_LABEL[detail.status]} color={STATUS_CHIP_COLOR[detail.status]} size="small" />} />
                            </Grid>
                            <Grid item xs={12}><Row label="Địa chỉ" value={detail.displayAddress || "-"} /></Grid>
                            <Grid item xs={12}><Row label="Mô tả" value={detail.description || "-"} /></Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Divider sx={{ my: 2 }}>Quyết định duyệt</Divider>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
                    <Select size="small" value={decision.listingType} onChange={(e) => setDecision((s) => ({ ...s, listingType: e.target.value }))} sx={{ width: 160 }}>
                        {LISTING_TYPES.map((v) => <MenuItem key={v} value={v}>{v === "NORMAL" ? "Thường" : v}</MenuItem>)}
                    </Select>
                    <Select size="small" value={decision.durationDays} onChange={(e) => setDecision((s) => ({ ...s, durationDays: e.target.value }))} sx={{ width: 140 }}>
                        {[10, 15, 20, 30].map((d) => <MenuItem key={d} value={d}>{d} ngày</MenuItem>)}
                    </Select>
                    <TextField size="small" placeholder="Ghi chú duyệt / lý do từ chối" value={decision.reason}
                        onChange={(e) => setDecision((s) => ({ ...s, reason: e.target.value }))} sx={{ width: 420 }} multiline minRows={2} maxRows={4} />
                    <Button variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={() => { onApprove(detail.id); onClose(); }}>
                        Duyệt
                    </Button>
                    <Button color="error" variant="outlined" startIcon={<HighlightOffOutlinedIcon />} onClick={() => {
                        if (window.confirm("Từ chối tin này?")) { onReject(detail.id); onClose(); }
                    }}>
                        Từ chối
                    </Button>
                </Stack>

                <Divider sx={{ my: 2 }}>Lịch sử</Divider>
                <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1}>
                            {(detail.audit || []).map((i, idx) => (
                                <Typography key={idx} fontSize={14}>
                                    <strong>{i.at}</strong> • <em>{i.by}</em>: {i.message || i.type}
                                </Typography>
                            ))}
                            {!(detail.audit || []).length && <Typography color="text.secondary">Chưa có lịch sử</Typography>}
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Drawer>
    );
}

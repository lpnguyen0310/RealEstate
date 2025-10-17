import {
    Box,
    TextField,
    Typography,
    Card,
    CardContent,
    Divider,
} from "@mui/material";

export default function TitlePostSection({ formData, onChange,errors = {} }) {
    const inputRootSx = {
        borderRadius: "10px",
        height: 40,
        "& fieldset": { borderColor: "#cfd6e4" },
        "&:hover fieldset": { borderColor: "#b8c0d4" },
        "&.Mui-focused fieldset": { borderColor: "#9aa8c7" },
    };

    return (
        <Card
            variant="outlined"
            sx={{ borderRadius: "14px", borderColor: "#e1e5ee", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f223a", fontSize: "18px", mb: 1.5 }}>
                    Chi tiết tin đăng
                </Typography>
                <Divider sx={{ borderColor: "#000", mb: 2 }} />

                <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                        label="Tiêu đề tin đăng"
                        required
                        fullWidth
                        size="small"
                        value={formData.title}
                        onChange={(e) => onChange("title", e.target.value)}
                        placeholder="Nhập tiêu đề tin đăng"
                        error={Boolean(errors.title)}
                        helperText={errors.title}
                        InputProps={{ sx: inputRootSx }}
                    />
                    <TextField
                        label="Mô tả tin đăng"
                        required
                        fullWidth
                        multiline
                        minRows={4}
                        value={formData.description}
                        onChange={(e) => onChange("description", e.target.value)}
                        placeholder="Nhập mô tả chi tiết cho tin đăng..."
                        error={Boolean(errors.description)}
                        helperText={errors.description}
                        InputProps={{ sx: { ...inputRootSx, height: "auto" } }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

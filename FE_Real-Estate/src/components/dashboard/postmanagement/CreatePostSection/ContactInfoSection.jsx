import { Box, Card, CardContent, Divider, Typography, TextField } from "@mui/material";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneDigits = (s = "") => s.replace(/\D/g, "").slice(0, 11); // 10–11 số là phổ biến VN

export default function ContactInfoSection({
    value = { name: "", phone: "", email: "", zalo: "" },
    onChange,
}) {
    const setField = (k, v) => onChange?.({ ...value, [k]: v });

    const errors = {
        name: value.name?.trim() === "",
        phone: !!value.phone && (value.phone.length < 9 || value.phone.length > 11),
        email: !!value.email && !emailRegex.test(value.email),
        zalo: !!value.zalo && (value.zalo.length < 9 || value.zalo.length > 11),
    };

    const inputSx = {
        borderRadius: "10px",
        height: 40,
        "& fieldset": { borderColor: "#e1e5ee" },
        "&:hover fieldset": { borderColor: "#c7cfe0" },
        "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
    };

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: "16px",
                borderColor: "#e1e5ee",
                boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f223a", fontSize: 18 }}>
                    Thông tin liên hệ
                </Typography>
                <Divider sx={{ borderColor: "#0f223a", my: 1.2 }} />

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 1.5,
                    }}
                >
                    {/* Tên liên hệ */}
                    <TextField
                        required
                        label="Tên liên hệ *"
                        size="small"
                        value={value.name}
                        onChange={(e) => setField("name", e.target.value)}
                        error={errors.name}
                        helperText={errors.name ? "Vui lòng nhập tên liên hệ" : " "}
                        InputProps={{ sx: inputSx }}
                    />

                    {/* SĐT liên hệ */}
                    <TextField
                        required
                        label="Số điện thoại liên hệ *"
                        size="small"
                        value={value.phone}
                        onChange={(e) => setField("phone", phoneDigits(e.target.value))}
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        error={errors.phone}
                        helperText={errors.phone ? "Số điện thoại 9–11 số" : " "}
                        InputProps={{ sx: inputSx }}
                    />

                    {/* Email liên hệ */}
                    <TextField
                        required
                        label="Email liên hệ *"
                        size="small"
                        value={value.email}
                        onChange={(e) => setField("email", e.target.value.trim())}
                        error={errors.email}
                        helperText={errors.email ? "Email không hợp lệ" : " "}
                        InputProps={{ sx: inputSx }}
                    />

                    {/* SĐT Zalo */}
                    <TextField
                        required
                        label="Số điện thoại Zalo *"
                        size="small"
                        value={value.zalo}
                        onChange={(e) => setField("zalo", phoneDigits(e.target.value))}
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        error={errors.zalo}
                        helperText={errors.zalo ? "Số Zalo 9–11 số" : " "}
                        InputProps={{ sx: inputSx }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

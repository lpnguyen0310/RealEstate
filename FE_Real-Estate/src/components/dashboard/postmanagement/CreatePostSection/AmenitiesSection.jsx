import {
    Box,
    Card,
    CardContent,
    Divider,
    Typography,
    Checkbox,
    FormControlLabel,
    Button,
} from "@mui/material";

const AMENITIES = [
    "Cho nuôi thú cưng",
    "Công viên",
    "Hồ bơi",
    "Phòng Gym",
    "Rạp chiếu phim",
    "Siêu thị",
    "Khu giải trí",
    "Trường học",
    "Bệnh viện",
    "Bãi đậu xe",
    "Thang máy",
    "Bảo vệ 24/7",
    "Sân chơi trẻ em",
    "Sân vườn",
    "Khu BBQ",
];

export default function AmenitiesSection({
    value = [],                   // mảng các tiện ích đã chọn (string[])
    onChange,                     // (next: string[]) => void
}) {
    const toggle = (label) => {
        const set = new Set(value);
        set.has(label) ? set.delete(label) : set.add(label);
        onChange?.(Array.from(set));
    };

    const selectAll = () => onChange?.(AMENITIES.slice(0));
    const clearAll = () => onChange?.([]);

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
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f223a", fontSize: 18 }}>
                        Tiện ích
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button size="small" variant="text" onClick={selectAll}>Chọn tất cả</Button>
                        <Button size="small" variant="text" onClick={clearAll}>Bỏ chọn</Button>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: "#0f223a", my: 1.2 }} />

                {/* Lưới checkbox – gọn, đẹp, responsive */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr 1fr",   // 2 cột mobile
                            sm: "1fr 1fr 1fr", // 3 cột tablet
                            md: "1fr 1fr 1fr 1fr", // 4 cột desktop
                        },
                        gap: 1,
                        rowGap: 1,
                    }}
                >
                    {AMENITIES.map((label) => (
                        <FormControlLabel
                            key={label}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={value.includes(label)}
                                    onChange={() => toggle(label)}
                                    sx={{
                                        color: "#94a3b8",
                                        "&.Mui-checked": { color: "#3b5bfd" },
                                    }}
                                />
                            }
                            label={label}
                            sx={{
                                m: 0,
                                px: 0.5,
                                borderRadius: "10px",
                                "& .MuiFormControlLabel-label": { color: "#2b3445" },
                            }}
                        />
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
}

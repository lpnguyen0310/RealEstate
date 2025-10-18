import React from "react";
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
import useAmenities from "@/hooks/useAmenities"; // ✅ dùng hook riêng

export default function AmenitiesSection({ value = [], onChange }) {
    const { data: amenities, loading, error } = useAmenities();

    const toggle = (id) => {
        const set = new Set(value);
        set.has(id) ? set.delete(id) : set.add(id);
        onChange?.(Array.from(set));
    };

    const selectAll = () => onChange?.(amenities.map((a) => a.id));
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
                {/* Header */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "#0f223a", fontSize: 18 }}
                    >
                        Tiện ích
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            size="small"
                            variant="text"
                            onClick={selectAll}
                            disabled={loading || !amenities.length}
                        >
                            Chọn tất cả
                        </Button>
                        <Button
                            size="small"
                            variant="text"
                            onClick={clearAll}
                            disabled={loading || !value.length}
                        >
                            Bỏ chọn
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: "#0f223a", my: 1.2 }} />

                {/* Body */}
                {loading ? (
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                        Đang tải danh sách tiện ích...
                    </Typography>
                ) : error ? (
                    <Typography variant="body2" sx={{ color: "#ef4444" }}>
                        Lỗi tải dữ liệu tiện ích.
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr 1fr",
                                sm: "1fr 1fr 1fr",
                                md: "1fr 1fr 1fr 1fr",
                            },
                            gap: 1,
                        }}
                    >
                        {amenities.map((a) => (
                            <FormControlLabel
                                key={a.id}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={value.includes(a.id)}
                                        onChange={() => toggle(a.id)}
                                        sx={{
                                            color: "#94a3b8",
                                            "&.Mui-checked": { color: "#3b5bfd" },
                                        }}
                                    />
                                }
                                label={a.name}
                                sx={{
                                    m: 0,
                                    px: 0.5,
                                    borderRadius: "10px",
                                    "& .MuiFormControlLabel-label": { color: "#2b3445" },
                                }}
                            />
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

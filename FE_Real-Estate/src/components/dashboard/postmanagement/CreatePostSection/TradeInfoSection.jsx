// src/components/post-create/CreatePostSection/TradeInfoSection.jsx
import React from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    FormControl,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    FormHelperText,
} from "@mui/material";
import useCategories from "@/hooks/useCategories";

// Menu gọn cho Select
const COMPACT_MENU_PROPS = {
    PaperProps: {
        sx: { borderRadius: 1.25, boxShadow: "0 8px 24px rgba(15,23,42,.12)", maxHeight: 360 },
    },
    MenuListProps: {
        dense: true,
        sx: {
            py: 0,
            "& .MuiMenuItem-root": { fontSize: 14, lineHeight: 1.25, minHeight: "unset", px: 1.25, py: 0.5 },
        },
    },
};

export default function TradeInfoSection({ formData, onChange, errors }) {
    const { data: categories, loading } = useCategories();

    const inputRootSx = {
        borderRadius: "10px",
        height: 40,
        "& fieldset": { borderColor: "#cfd6e4" },
        "&:hover fieldset": { borderColor: "#b8c0d4" },
        "&.Mui-focused fieldset": { borderColor: "#9aa8c7" },
    };

    // propertyType (BE): "sell" | "rent"
    const propertyType = formData.propertyType ?? "sell";
    // priceType (BE): "SELL_PRICE" | "RENT_PRICE"
    const priceType = formData.priceType ?? (propertyType === "sell" ? "SELL_PRICE" : "RENT_PRICE");

    const handleSwitchPropertyType = (_e, v) => {
        if (!v) return;
        // cập nhật đúng enum BE
        onChange("propertyType", v); // "sell" | "rent"
        onChange("priceType", v === "sell" ? "SELL_PRICE" : "RENT_PRICE");
    };

    return (
        <Card
            variant="outlined"
            sx={{ borderRadius: "14px", borderColor: "#e1e5ee", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f223a", fontSize: "18px", mb: 1.5 }}>
                    Thông tin giao dịch
                </Typography>
                <Divider sx={{ borderColor: "#000", mb: 2 }} />

                {/* Loại giao dịch (map thẳng BE: sell/rent) */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>
                        Loại giao dịch
                    </Typography>

                    <ToggleButtonGroup
                        exclusive
                        value={propertyType} // "sell" | "rent"
                        onChange={handleSwitchPropertyType}
                        size="small"
                        sx={{
                            bgcolor: "#eef2ff",
                            borderRadius: "999px",
                            p: "4px",
                            "& .MuiToggleButton-root": {
                                textTransform: "none",
                                border: "none",
                                px: 2.5,
                                py: 0.75,
                                borderRadius: "999px",
                                color: "#2f3a4a",
                            },
                            "& .Mui-selected": {
                                bgcolor: "#3b5bfd",
                                color: "#fff",
                                "&:hover": { bgcolor: "#2f49cc" },
                            },
                        }}
                    >
                        <ToggleButton value="sell">Bán</ToggleButton>
                        <ToggleButton value="rent">Cho thuê</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Lưới 2 cột */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" },
                        columnGap: 2,
                        rowGap: 1.5,
                    }}
                >
                    {/* Danh mục */}
                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500, alignSelf: "center" }}>
                        Danh mục <span style={{ color: "red" }}>*</span>
                    </Typography>

                    <FormControl
                        fullWidth
                        size="small"
                        error={!!errors?.categoryId}
                        sx={{ "& .MuiOutlinedInput-root": inputRootSx, "& .MuiSelect-select": { py: "8px !important" } }}
                    >
                        <Select
                            value={formData.categoryId ?? ""}
                            onChange={(e) => onChange("categoryId", e.target.value)}
                            displayEmpty
                            renderValue={(val) =>
                                val ? (categories.find((c) => c.id === val)?.name ?? "") : <span style={{ color: "#94a3b8" }}>Chọn Danh Mục</span>
                            }
                            disabled={loading}
                            MenuProps={COMPACT_MENU_PROPS}
                        >
                            <MenuItem disabled value="">
                                <em>Chọn Danh Mục</em>
                            </MenuItem>
                            {categories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors?.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
                    </FormControl>

                    {/* Loại giá: dùng enum BE */}
                    <FormControl
                        size="small"
                        sx={{
                            minWidth: 140,
                            "& .MuiOutlinedInput-root": inputRootSx,
                            "& .MuiSelect-select": { py: "8px !important" },
                            gridColumn: { xs: "1 / -1", sm: "1 / 2" },
                        }}
                    >
                        <Select
                            value={priceType}
                            onChange={(e) => onChange("priceType", e.target.value)} // "SELL_PRICE" | "RENT_PRICE"
                            MenuProps={COMPACT_MENU_PROPS}
                        >
                            <MenuItem value="SELL_PRICE">Giá bán</MenuItem>
                            <MenuItem value="RENT_PRICE">Giá thuê</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Ô nhập giá */}
                    <TextField
                        required
                        label={priceType === "SELL_PRICE" ? "Giá bán" : "Giá thuê"}
                        fullWidth
                        size="small"
                        value={formData.price ?? ""}
                        onChange={(e) => onChange("price", e.target.value.replace(/\D/g, ""))}
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" sx={{ color: "#64748b", fontWeight: 500, pr: "10px" }}>
                                    đ
                                </InputAdornment>
                            ),
                            sx: inputRootSx,
                        }}
                        error={!!errors?.price}
                        helperText={errors?.price}
                        sx={{ gridColumn: { xs: "1 / -1", sm: "2 / 3" } }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

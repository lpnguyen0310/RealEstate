import {Box,Typography,Card,CardContent,Divider,ToggleButtonGroup,ToggleButton,FormControl,Select,MenuItem,TextField,InputAdornment,
} from "@mui/material";

const PROPERTY_TYPES = [
    { value: "apartment", label: "Căn hộ" },
    { value: "house", label: "Nhà riêng" },
    { value: "villa", label: "Biệt thự" },
    { value: "land", label: "Đất" },
    { value: "office", label: "Văn phòng" },
];

export default function TradeInfoSection({ formData, setFormData }) {
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
                    Thông tin giao dịch
                </Typography>
                <Divider sx={{ borderColor: "#000", mb: 2 }} />

                {/* Hàng: label + pill */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>
                        Loại giao dịch
                    </Typography>

                    <ToggleButtonGroup
                        exclusive
                        value={formData.tradeType}
                        onChange={(_e, v) => {
                            if (!v) return;
                            setFormData((p) => ({
                                ...p,
                                tradeType: v,
                                priceType: v === "sell" ? "sellPrice" : "rentPrice",
                            }));
                        }}
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

                {/* GRID 2 cột: trái = label/Select; phải = input */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" },
                        columnGap: 2,
                        rowGap: 1.5,
                    }}
                >
                    {/* Hàng 1: Label + Select Loại BĐS */}
                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500, alignSelf: "center" }}>
                        Loại bất động sản <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <FormControl
                        fullWidth
                        size="small"
                        sx={{ "& .MuiOutlinedInput-root": inputRootSx, "& .MuiSelect-select": { py: "8px !important" } }}
                    >
                        <Select
                            value={formData.propertyType}
                            onChange={(e) => setFormData((p) => ({ ...p, propertyType: e.target.value }))}
                            displayEmpty
                            renderValue={(val) =>
                                val
                                    ? PROPERTY_TYPES.find((t) => t.value === val)?.label
                                    : <span style={{ color: "#94a3b8" }}>Chọn Loại Bất Động Sản</span>
                            }
                        >
                            <MenuItem disabled value="">
                                <em>Chọn Loại Bất Động Sản</em>
                            </MenuItem>
                            {PROPERTY_TYPES.map((t) => (
                                <MenuItem key={t.value} value={t.value}>
                                    {t.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Hàng 2: Select giá (trái) + Input giá (phải, floating label) */}
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
                            value={formData.priceType}
                            onChange={(e) => setFormData((p) => ({ ...p, priceType: e.target.value }))}
                        >
                            <MenuItem value="sellPrice">Giá bán</MenuItem>
                            <MenuItem value="rentPrice">Giá thuê</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        required
                        label={formData.priceType === "sellPrice" ? "Giá bán" : "Giá thuê"} // floating label
                        fullWidth
                        size="small"
                        value={formData.price}
                        onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" sx={{ color: "#64748b", fontWeight: 500, pr: "10px" }}>
                                    đ
                                </InputAdornment>
                            ),
                            sx: inputRootSx,
                        }}
                        sx={{ gridColumn: { xs: "1 / -1", sm: "2 / 3" } }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

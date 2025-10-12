import {
    Box,
    Card,
    CardContent,
    Divider,
    Typography,
    FormControl,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    Link,
} from "@mui/material";

const range = (n) => Array.from({ length: n + 1 }, (_, i) => i);

export default function PropertyDetailSection({
    formData,
    setFormData,
    provinces = [],
    districts = [],
    wards = [],
    balconyDirs = ["Đông", "Tây", "Nam", "Bắc", "Đông-Nam", "Đông-Bắc", "Tây-Nam", "Tây-Bắc"],
}) {
    const F = (name) => ({
        value: formData[name] ?? "",
        onChange: (e) => setFormData((p) => ({ ...p, [name]: e.target.value })),
    });

    const inputRootSx = {
        borderRadius: "10px",
        height: 40,
        backgroundColor: "#fff",
        "& fieldset": { borderColor: "#e1e5ee" },
        "&:hover fieldset": { borderColor: "#c7cfe0" },
        "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
    };

    const selectSx = {
        "& .MuiOutlinedInput-root": inputRootSx,
        "& .MuiSelect-select": { py: "8px !important", color: "#1e293b" },
    };

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: "14px",
                borderColor: "#e1e5ee",
                boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
                transition: "box-shadow .2s ease",
                "&:hover": { boxShadow: "0 4px 16px rgba(15,23,42,0.08)" },
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f223a", fontSize: "18px", mb: 1.5 }}>
                    Thông tin bất động sản
                </Typography>
                <Divider sx={{ borderColor: "#000", mb: 2 }} />

                {/* ===== Thông tin chung ===== */}
                <Typography sx={{ fontWeight: 600, color: "#475569", mb: 1 }}>Thông tin chung</Typography>

                <TextField
                    label="Chọn nhanh địa chỉ"
                    fullWidth
                    size="small"
                    {...F("quickAddress")}
                    InputProps={{ sx: inputRootSx }}
                    sx={{ mb: 1.5 }}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
                    <FormControl size="small" sx={selectSx}>
                        <Select displayEmpty {...F("provinceId")}>
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>Tỉnh/Thành phố *</span>
                            </MenuItem>
                            {provinces.map((p) => (
                                <MenuItem key={p.id ?? p.value} value={p.id ?? p.value}>
                                    {p.name ?? p.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={selectSx}>
                        <Select displayEmpty {...F("districtId")}>
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>Quận/Huyện *</span>
                            </MenuItem>
                            {districts.map((d) => (
                                <MenuItem key={d.id ?? d.value} value={d.id ?? d.value}>
                                    {d.name ?? d.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={selectSx}>
                        <Select displayEmpty {...F("wardId")}>
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>Phường/Xã *</span>
                            </MenuItem>
                            {wards.map((w) => (
                                <MenuItem key={w.id ?? w.value} value={w.id ?? w.value}>
                                    {w.name ?? w.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Hộp gợi ý địa chỉ */}
                <Box sx={{ mt: 1.8, p: 1.6, borderRadius: "12px", border: "1px solid #e6ebf4", bgcolor: "#f9fbff" }}>
                    <Typography sx={{ fontSize: 13, color: "#64748b", mb: 1 }}>
                        Chọn chính xác địa chỉ mới để tăng gấp 3 cơ hội thu hút khách hàng.
                    </Typography>
                    <FormControl fullWidth size="small" sx={selectSx}>
                        <Select displayEmpty {...F("suggestedAddress")}>
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>Địa chỉ đề xuất *</span>
                            </MenuItem>
                            {(formData.addressSuggestions ?? []).map((s, idx) => (
                                <MenuItem key={idx} value={s}>
                                    {s}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 1.8 }}>
                    <FormControl size="small" sx={selectSx}>
                        <Select displayEmpty {...F("streetName")}>
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>Đường</span>
                            </MenuItem>
                            {(formData.streetOptions ?? []).map((s, i) => (
                                <MenuItem key={i} value={s}>
                                    {s}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField label="Số nhà" size="small" {...F("houseNumber")} InputProps={{ sx: inputRootSx }} />
                </Box>

                <Box sx={{ mt: 1.8 }}>
                    <TextField
                        label="Địa chỉ hiển thị *"
                        fullWidth
                        multiline
                        minRows={3}
                        size="small"
                        {...F("displayAddress")}
                        InputProps={{ sx: { ...inputRootSx, height: "auto" } }}
                    />
                    <Box sx={{ textAlign: "right", mt: 0.5 }}>
                        <Link component="button" type="button" sx={{ fontSize: 13, color: "#5b72ff", textDecoration: "none" }}>
                            Chỉnh Sửa Địa Chỉ Hiển Thị
                        </Link>
                    </Box>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 1.5 }}>
                    <TextField label="Phân khu" size="small" {...F("subdivision")} InputProps={{ sx: inputRootSx }} />
                    <TextField label="Block" size="small" {...F("block")} InputProps={{ sx: inputRootSx }} />
                    <TextField label="Tầng" size="small" {...F("floor")} InputProps={{ sx: inputRootSx }} />
                    <TextField label="Mã căn hộ" size="small" {...F("apartmentCode")} InputProps={{ sx: inputRootSx }} />
                </Box>

                {/* ===== Thông tin chi tiết ===== */}
                <Typography sx={{ fontWeight: 600, color: "#475569", mt: 2, mb: 1 }}>
                    Thông tin chi tiết
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                    <FormControl size="small" sx={selectSx}>
                        <Select displayEmpty {...F("houseDirection")}>
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>Hướng nhà</span>
                            </MenuItem>
                            {balconyDirs.map((d) => (
                                <MenuItem key={d} value={d}>
                                    {d}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Rộng"
                        size="small"
                        {...F("width")}
                        InputProps={{
                            sx: inputRootSx,
                            endAdornment: <InputAdornment position="end">m</InputAdornment>,
                            inputMode: "numeric",
                        }}
                    />

                    <TextField
                        label="Dài"
                        size="small"
                        {...F("length")}
                        InputProps={{
                            sx: inputRootSx,
                            endAdornment: <InputAdornment position="end">m</InputAdornment>,
                            inputMode: "numeric",
                        }}
                    />

                    <TextField
                        required
                        label="Diện tích đất *"
                        size="small"
                        {...F("landArea")}
                        InputProps={{
                            sx: inputRootSx,
                            endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                            inputMode: "numeric",
                        }}
                    />

                    <TextField
                        label="Diện tích sử dụng"
                        size="small"
                        {...F("usableArea")}
                        InputProps={{
                            sx: inputRootSx,
                            endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                            inputMode: "numeric",
                        }}
                    />

                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <TextField label="Số tầng" size="small" {...F("floors")} InputProps={{ sx: inputRootSx, inputMode: "numeric" }} />
                        <Link
                            component="button"
                            type="button"
                            sx={{ fontSize: 12.5, color: "#5b72ff", mt: 0.5, alignSelf: "flex-start", textDecoration: "none" }}
                        >
                            Vì sao cần nhập đúng số tầng ?
                        </Link>
                    </Box>
                </Box>

                {/* ===== Nhóm: Phòng tắm & Phòng ngủ (trái) + Vị trí (phải) ===== */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        columnGap: 2.5,
                        rowGap: 2,
                        mt: 1,
                    }}
                >
                    {/* Cột trái: 2 hàng */}
                    <Box sx={{ display: "grid", gridAutoRows: "min-content", rowGap: 2 }}>
                        <TextField
                            select
                            label="Số phòng tắm"
                            size="small"
                            value={formData.bathrooms ?? 0}
                            onChange={(e) => setFormData((p) => ({ ...p, bathrooms: Number(e.target.value) }))}
                            SelectProps={{ displayEmpty: false }}
                            sx={{ "& .MuiOutlinedInput-root": inputRootSx }}
                        >
                            {range(10).map((n) => (
                                <MenuItem key={n} value={n}>{n}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Số phòng ngủ"
                            size="small"
                            value={formData.bedrooms ?? 0}
                            onChange={(e) => setFormData((p) => ({ ...p, bedrooms: Number(e.target.value) }))}
                            SelectProps={{ displayEmpty: false }}
                            sx={{ "& .MuiOutlinedInput-root": inputRootSx }}
                        >
                            {range(10).map((n) => (
                                <MenuItem key={n} value={n}>{n}</MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    {/* Cột phải: Vị trí */}
                    <TextField
                        select
                        label="Vị trí"
                        size="small"
                        value={formData.position ?? ""}
                        onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                        sx={{
                            "& .MuiOutlinedInput-root": inputRootSx,
                            alignSelf: "start",
                        }}
                    >
                        {["Mặt tiền", "Góc 2 mặt tiền", "Hẻm xe hơi", "Hẻm nhỏ", "Nội bộ", "Khu dân cư"].map((p) => (
                            <MenuItem key={p} value={p}>{p}</MenuItem>
                        ))}
                    </TextField>
                </Box>
            </CardContent>
        </Card>
    );
}

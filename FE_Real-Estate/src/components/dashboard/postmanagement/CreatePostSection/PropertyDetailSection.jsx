// PropertyDetailSection.jsx
import React from "react";
import {
    Box, Card, CardContent, Divider, Typography, FormControl,
    Select, MenuItem, TextField, InputAdornment, Link,
    FormHelperText, FormControlLabel, Radio,
} from "@mui/material";

const range = (n) => Array.from({ length: n + 1 }, (_, i) => i);

export default function PropertyDetailSection({
    formData,
    setFormData,
    provinces = [],
    districts = [],
    wards = [],
    balconyDirs = ["Đông", "Tây", "Nam", "Bắc", "Đông-Nam", "Đông-Bắc", "Tây-Nam", "Tây-Bắc"],
    onChange,
    errors = {},
    loadingDistricts = false,
    loadingWards = false,
}) {
    const F = (name) => ({
        value: formData[name] ?? "",
        onChange: (e) => {
            const v = e.target.value;
            setFormData((p) => ({ ...p, [name]: v }));
            onChange?.(name, v);
        },
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

    const isProvinceChosen = !!formData.provinceId;
    const isDistrictChosen = !!formData.districtId;

    const handleProvinceChange = (e) => {
        const provinceId = e.target.value;
        setFormData((p) => ({ ...p, provinceId, districtId: "", wardId: "" }));
        onChange?.("provinceId", provinceId);
    };

    const handleDistrictChange = (e) => {
        const districtId = e.target.value;
        setFormData((p) => ({ ...p, districtId, wardId: "" }));
        onChange?.("districtId", districtId);
    };

    const smallMenuProps = {
        PaperProps: {
            sx: {
                maxHeight: 280,        // giới hạn chiều cao menu
                borderRadius: 2,       // bo góc nhẹ
                boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            },
        },
        MenuListProps: {
            dense: true,             // item cao thấp hơn
            sx: { py: 0 },           // bỏ padding trên/dưới danh sách
        },
        anchorOrigin: { vertical: "bottom", horizontal: "left" },
        transformOrigin: { vertical: "top", horizontal: "left" },
    };

    // 👇 style chung cho MenuItem (gọn hơn)
    const itemSx = { minHeight: 32, py: 0.5, fontSize: 14 };

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

                {/* Province / District / Ward */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
                    {/* Province */}
                    <FormControl size="small" sx={selectSx} error={!!errors.provinceId}>
                        <Select
                            displayEmpty
                            value={formData.provinceId ?? ""}
                            onChange={handleProvinceChange}
                            MenuProps={smallMenuProps}            // 👈 áp vào đây
                        >
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>Tỉnh/Thành phố *</span>
                            </MenuItem>
                            {provinces.map((p) => (
                                <MenuItem key={p.id ?? p.value} value={p.id ?? p.value} sx={itemSx}>
                                    {p.name ?? p.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {!!errors.provinceId && <FormHelperText>{errors.provinceId}</FormHelperText>}
                    </FormControl>

                    <FormControl size="small" sx={selectSx} error={!!errors.districtId} disabled={!isProvinceChosen}>
                        <Select
                            displayEmpty
                            value={formData.districtId ?? ""}
                            onChange={handleDistrictChange}
                            MenuProps={smallMenuProps}            // 👈
                        >
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>
                                    {isProvinceChosen ? (loadingDistricts ? "Đang tải Quận/Huyện..." : "Quận/Huyện *") : "Chọn Tỉnh/TP trước"}
                                </span>
                            </MenuItem>
                            {!loadingDistricts && districts.map((d) => (
                                <MenuItem key={d.id ?? d.value} value={d.id ?? d.value} sx={itemSx}>
                                    {d.name ?? d.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {!!errors.districtId && <FormHelperText>{errors.districtId}</FormHelperText>}
                    </FormControl>

                    {/* Ward */}
                    <FormControl size="small" sx={selectSx} error={!!errors.wardId} disabled={!isDistrictChosen}>
                        <Select
                            displayEmpty
                            value={formData.wardId ?? ""}
                            onChange={(e) => { const wardId = e.target.value; setFormData(p => ({ ...p, wardId })); onChange?.("wardId", wardId); }}
                            MenuProps={smallMenuProps}            // 👈
                        >
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>
                                    {isDistrictChosen ? (loadingWards ? "Đang tải Phường/Xã..." : "Phường/Xã *") : "Chọn Quận/Huyện trước"}
                                </span>
                            </MenuItem>
                            {!loadingWards && wards.map((w) => (
                                <MenuItem key={w.id ?? w.value} value={w.id ?? w.value} sx={itemSx}>
                                    {w.name ?? w.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {!!errors.wardId && <FormHelperText>{errors.wardId}</FormHelperText>}
                    </FormControl>
                </Box>

                {/* Hộp gợi ý địa chỉ */}
                <Box sx={{ mt: 1.8, p: 1.6, borderRadius: "12px", border: "1px solid #e6ebf4", bgcolor: "#f9fbff" }}>
                    <Typography sx={{ fontSize: 13, color: "#64748b", mb: 1 }}>
                        Chọn chính xác địa chỉ mới để tăng gấp 3 cơ hội thu hút khách hàng.
                    </Typography>
                    <FormControl fullWidth size="small" sx={selectSx} error={!!errors.suggestedAddress}>
                        <Select displayEmpty {...F("suggestedAddress")}>
                            <MenuItem disabled value="">
                                <span style={{ color: "#94a3b8" }}>Địa chỉ đề xuất *</span>
                            </MenuItem>
                            {(formData.addressSuggestions ?? []).map((s, idx) => (
                                <MenuItem key={idx} value={s}>{s}</MenuItem>
                            ))}
                        </Select>
                        {!!errors.suggestedAddress && <FormHelperText>{errors.suggestedAddress}</FormHelperText>}
                    </FormControl>
                </Box>

                {/* Đường + số nhà */}
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

                {/* Địa chỉ hiển thị */}
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

                {/* Các field khác giữ nguyên */}
                {/* <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 1.5 }}>
                    <TextField label="Phân khu" size="small" {...F("subdivision")} InputProps={{ sx: inputRootSx }} />
                    <TextField label="Block" size="small" {...F("block")} InputProps={{ sx: inputRootSx }} />
                    <TextField label="Tầng" size="small" {...F("floor")} InputProps={{ sx: inputRootSx }} />
                    <TextField label="Mã căn hộ" size="small" {...F("apartmentCode")} InputProps={{ sx: inputRootSx }} />
                </Box> */}

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
                        error={!!errors.landArea}
                        helperText={errors.landArea || ""}
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



                {/* Vị trí + Pháp lý */}
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
                        required
                        label="Vị trí *"
                        size="small"
                        value={formData.position ?? ""}
                        onChange={(e) => {
                            setFormData((p) => ({ ...p, position: e.target.value }));
                            onChange?.("position", e.target.value);
                        }}
                        error={!!errors.position}
                        helperText={errors.position || ""}
                        sx={{ "& .MuiOutlinedInput-root": inputRootSx, alignSelf: "start" }}
                    >
                        {["Mặt tiền", "Góc 2 mặt tiền", "Hẻm xe hơi", "Hẻm nhỏ", "Nội bộ", "Khu dân cư"].map((p) => (
                            <MenuItem key={p} value={p}>{p}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                <Typography sx={{ fontWeight: 600, color: "#475569", mt: 2.5, mb: 1 }}>
                    Giấy tờ pháp lý <span style={{ color: "#ef4444" }}>*</span>
                </Typography>

                <FormControl error={!!errors.legalDocument} component="fieldset" sx={{ width: "100%" }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 1.5,
                        }}
                    >
                        {["Sổ đỏ", "Sổ hồng", "HĐ mua bán", "Khác"].map((opt) => {
                            const selected = formData.legalDocument === opt;
                            const hasErr = !!errors.legalDocument;
                            return (
                                <Box
                                    key={opt}
                                    onClick={() => {
                                        setFormData((p) => ({ ...p, legalDocument: opt }));
                                        onChange?.("legalDocument", opt);
                                    }}
                                    sx={{
                                        cursor: "pointer",
                                        borderRadius: "10px",
                                        height: 40,
                                        display: "flex",
                                        alignItems: "center",
                                        px: 2,
                                        border: "1px solid",
                                        borderColor: selected ? "#3b82f6" : (hasErr ? "#ef4444" : "#e1e5ee"),
                                        backgroundColor: selected ? "rgba(59,130,246,0.06)" : "#fff",
                                        transition: "all 0.15s ease",
                                        "&:hover": { borderColor: hasErr ? "#ef4444" : "#c7cfe0" },
                                    }}
                                    role="radio"
                                    aria-checked={selected}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setFormData((p) => ({ ...p, legalDocument: opt }));
                                            onChange?.("legalDocument", opt);
                                        }
                                    }}
                                >
                                    <FormControlLabel
                                        value={opt}
                                        control={<Radio size="small" checked={selected} />}
                                        label={opt}
                                        sx={{ m: 0, flex: 1, "& .MuiFormControlLabel-label": { color: "#0f223a" } }}
                                    />
                                </Box>
                            );
                        })}
                    </Box>

                    {!!errors.legalDocument && (
                        <FormHelperText sx={{ mt: 1 }}>{errors.legalDocument}</FormHelperText>
                    )}
                </FormControl>
            </CardContent>
        </Card>
    );
}

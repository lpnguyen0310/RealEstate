import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import ComboCard from "./ComboCard";
import { COMBOS } from "@/data/Dashboard/pricingData";

export default function ComboSection({ onBuy }) {
  return (
    <Box sx={{ mt: 4 }}>
      <Box
        sx={{
          bgcolor: "#b9ccff",
          border: "1px solid #9fb9ff",
          borderRadius: 1,
          p: 2,
        }}
      >
        {/* Header inline */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            bgcolor: "#fff",
            px: 2,
            py: 1,
            borderRadius: 1,
            border: "1px solid #e5e7eb",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={900} sx={{ color: "#0f2a66" }}>
            Bảng giá combo
          </Typography>
          <Chip
            label="Giá hời"
            size="small"
            sx={{
              bgcolor: "#f59e0b",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 1,
              height: 24,
              px: 1.2,
            }}
          />
        </Box>

        {/* 4 cột: 3 combo + 1 trống */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          {COMBOS.map((c) => (
            <ComboCard key={c.key} combo={c} onBuy={onBuy} />
          ))}
          <Box
            sx={{
              height: "100%",
              aspectRatio: "3 / 4",
              minHeight: 360,
              bgcolor: "transparent",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

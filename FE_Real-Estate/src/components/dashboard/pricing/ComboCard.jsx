import React from "react";
import { Box, Card, CardContent, Typography, Divider, Button } from "@mui/material";
import { money } from "@/utils/money";

export default function ComboCard({ combo, onBuy }) {
  return (
    <Box sx={{ height: "100%", aspectRatio: "3 / 4", minHeight: 360 }}>
      <Card
        sx={{
          height: "100%",
          display: "grid",
          gridTemplateRows: "auto 1fr auto", // header, body, footer
          bgcolor: "#f1f6ff",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            background: "linear-gradient(180deg,#6aa1ff 0%,#3657d8 100%)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          {combo.tab}
        </Box>

        {/* BODY */}
        <CardContent
          sx={{
            px: 3,
            py: 2,
            display: "grid",
            alignContent: "start",
            gap: 1.25,
          }}
        >
          <Box textAlign="center">
            <Typography fontWeight={900}>{combo.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {combo.sub}
            </Typography>
          </Box>

          <Divider />

          <Box textAlign="center">
            <Typography
              variant="body2"
              sx={{ textDecoration: "line-through", color: "#334155", opacity: 0.8 }}
            >
              Giá gốc: {money(combo.origin)} VND
            </Typography>
            <Typography sx={{ color: "#16a34a", fontWeight: 900, fontSize: 22 }}>
              {money(combo.price)} VND
            </Typography>
          </Box>

          <Divider />

          <Box
            sx={{
              justifySelf: "center",
              px: 1.5,
              py: 0.6,
              bgcolor: "#eaf4ff",
              border: "1px solid #d7e7ff",
              borderRadius: 2,
              fontSize: 12,
              color: "#3b82f6",
              boxShadow: "0 4px 12px rgba(30,64,175,.15)",
            }}
          >
            {combo.saveText}
          </Box>
        </CardContent>

        {/* FOOTER */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => onBuy(combo)} fullWidth>
            Mua ngay
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

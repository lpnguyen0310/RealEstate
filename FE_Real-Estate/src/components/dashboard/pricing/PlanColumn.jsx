import React from "react";
import { Box, Card, CardContent, Typography, Chip, Button, Stack } from "@mui/material";
import { Badge } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { money } from "@/utils/money";

function StatButton({ text, note, bg }) {
  return (
    <Stack
      alignItems="center"
      spacing={0.3}
      sx={{ bgcolor: bg, color: "#fff", borderRadius: 2, py: 1.1, boxShadow: "0 6px 16px rgba(0,0,0,.15)" }}
    >
      <Typography sx={{ fontWeight: 800, lineHeight: 1 }}>{text}</Typography>
      <Typography variant="caption" sx={{ opacity: 0.95 }}>{note}</Typography>
    </Stack>
  );
}

function PreviewGrid({ tone = "#e6edff" }) {
  return (
    <Box
      sx={{
        p: 1.2,
        bgcolor: "#fff",
        border: "1px solid #e7eaf0",
        borderRadius: 2,
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gridTemplateRows: "repeat(2,48px)",
        gap: 1,
      }}
    >
      <Box sx={{ gridColumn: "span 2", borderRadius: 1, bgcolor: tone }} />
      <Box sx={{ borderRadius: 1, bgcolor: tone }} />
      <Box sx={{ borderRadius: 1, bgcolor: tone }} />
      <Box sx={{ borderRadius: 1, bgcolor: "#eef2ff" }} />
      <Box sx={{ borderRadius: 1, bgcolor: "#eef2ff" }} />
      <Box sx={{ gridColumn: "span 2", borderRadius: 1, bgcolor: "#eef2ff" }} />
    </Box>
  );
}

export default function PlanColumn({ plan, onPrimary, onSecondary }) {
  return (
    <Card
      sx={{
        overflow: "visible",
        bgcolor:
          plan.key === "premium" ? "#ffece3" : plan.key === "free" ? "#e8efff" : "#f1f6ff",
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ribbon */}
      {plan.ribbon?.mui && (
        <Chip
          icon={plan.ribbon.icon}
          color="warning"
          size="small"
          label={plan.ribbon.text}
          sx={{ position: "absolute", top: 8, left: 12, fontWeight: 700 }}
        />
      )}
      {plan.ribbon?.antd && (
        <Badge.Ribbon text={plan.ribbon.text} color="orange">
          <Box sx={{ position: "absolute", top: -9999 }} />
        </Badge.Ribbon>
      )}

      <CardContent sx={{ pt: 5, display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack alignItems="center" spacing={0.5}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>{plan.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {plan.key === "free" ? plan.subtitle : (
              <>
                <b>{money(plan.price)}</b> {plan.unit}
              </>
            )}
          </Typography>

          <Box sx={{ mt: 1, width: "88%" }}>
            <StatButton text={plan.statText} note={plan.statNote} bg={plan.statBg} />
          </Box>

          <Box
            sx={{
              mt: 1.5,
              width: "88%",
              bgcolor: "#f4f7ff",
              border: "1px solid #e0e7ff",
              borderRadius: 2,
              p: 1.2,
            }}
          >
            <PreviewGrid />
          </Box>

          {/* CTA */}
          <Stack direction="row" spacing={1.2} sx={{ mt: 1.2 }}>
            <Button
              size="small"
              variant={plan.key === "free" ? "contained" : "outlined"}
              onClick={() => onPrimary(plan)}
            >
              {plan.primary}
            </Button>
            {plan.secondary && (
              <Button
                size="small"
                variant="contained"
                onClick={() => onSecondary(plan)}
                startIcon={<ShoppingCartOutlined />}
              >
                {plan.secondary}
              </Button>
            )}
          </Stack>
        </Stack>

        {/* feature pills */}
        <Stack spacing={1.1} sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#334155" }}>
            {plan.placement}
          </Typography>
          {[
            plan.duration,
            plan.gallery,
            plan.reviewTime,
            plan.contactVisibility,
            plan.ranking,
          ].map((txt, i) => (
            <Box
              key={i}
              sx={{
                display: "inline-block",
                bgcolor: "#fff",
                borderRadius: 2,
                px: 2,
                py: 1,
                border: "1px solid #dbe2f0",
                fontSize: 14,
                color: "#1f2937",
                fontWeight: 600,
              }}
            >
              {txt}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

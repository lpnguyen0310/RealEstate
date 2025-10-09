import React, { useState } from "react";
import { Box, Grid, Card, CardContent, Stack, Typography, ThemeProvider } from "@mui/material";
import { Modal, Segmented, message } from "antd";
import theme from "../../theme/uiTheme";
import { PLANS, LEFT_LABELS } from "@/data/Dashboard/pricingData";
import {PlanColumn,ComboSection} from "../../components/dashboard/pricing";
import { money } from "@/utils/money";

export default function PricingPage() {
  const [comboVisible, setComboVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [combo, setCombo] = useState("10 tin");

  const handlePrimary = (plan) => {
    if (plan.key === "free") {
      message.success("Đi đến trang đăng tin Thường (demo)");
    } else {
      setSelected(plan);
      setComboVisible(true);
    }
  };

  const handleSecondary = (plan) => {
    message.success(`Mua ngay 1 ${plan.title} (demo)`);
  };

  const payCombo = () => {
    setComboVisible(false);
    message.success(`Đã mua combo ${combo} cho ${selected?.title} (demo)`);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", py: 4 }}>
        <Box sx={{ maxWidth: 1440, mx: "auto", px: 2 }}>
          <Box sx={{ bgcolor: "#b9ccff", borderRadius: 1, p: 2, border: "1px solid #9fb9ff" }}>
            <Grid container spacing={2}>
              {/* Cột nhãn bên trái (đặt ở đáy cột) */}
              <Grid item xs={12} md={3} sx={{ display: "flex" }}>
                <Card
                  sx={{
                    bgcolor: "#b9ccff",
                    border: "none",
                    boxShadow: "none",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ mt: "auto", pb: 0 }}>
                    <Stack spacing={1.2}>
                      {LEFT_LABELS.map((i) => (
                        <Box key={i.key}>
                          <Box
                            sx={{
                              display: "inline-block",
                              bgcolor: "#fff",
                              borderRadius: 2,
                              px: 2,
                              py: 1,
                              border: "1px solid #d6e0ff",
                              minWidth: 160,
                            }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                              {i.label}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* 3 cột Plan */}
              <Grid item xs={12} md={9}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 2,
                    alignItems: "stretch",
                  }}
                >
                  <PlanColumn plan={PLANS[0]} onPrimary={handlePrimary} />
                  <PlanColumn plan={PLANS[1]} onPrimary={handlePrimary} onSecondary={handleSecondary} />
                  <PlanColumn plan={PLANS[2]} onPrimary={handlePrimary} onSecondary={handleSecondary} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Modal chọn combo (dùng cho gói VIP/Premium) */}
        <Modal
          title={`Chọn combo cho ${selected?.title || ""}`}
          open={comboVisible}
          onCancel={() => setComboVisible(false)}
          onOk={payCombo}
          okText="Thanh toán"
          cancelText="Đóng"
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            Chọn gói:
          </Typography>
          <Segmented block value={combo} onChange={setCombo} options={["10 tin", "20 tin", "50 tin"]} />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Tạm tính (demo):{" "}
              <b>
                {selected
                  ? (() => {
                      const qty = combo === "10 tin" ? 10 : combo === "20 tin" ? 20 : 50;
                      return `${money(Math.round(selected.price * qty * 0.95))} VND`;
                    })()
                  : "0 VND"}
              </b>
            </Typography>
          </Box>
        </Modal>
      </Box>

      {/* ===== BẢNG GIÁ COMBO ===== */}
      <Box sx={{ maxWidth: 1440, mx: "auto", px: 2 }}>
        <ComboSection
          onBuy={(combo) => {
            Modal.confirm({
              title: `Xác nhận mua ${combo.tab}`,
              content: (
                <Typography variant="body2">
                  Bạn sẽ mua <b>{combo.title}</b> – <i>{combo.sub}</i> với giá <b>{money(combo.price)} VND</b>.
                </Typography>
              ),
              okText: "Thanh toán",
              cancelText: "Hủy",
              onOk: () => message.success(`Đã mua ${combo.tab} (${money(combo.price)} VND)`),
            });
          }}
        />
      </Box>
    </ThemeProvider>
  );
}

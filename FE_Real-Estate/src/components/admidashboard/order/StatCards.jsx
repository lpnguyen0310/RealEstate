import React from "react";
import { Paper, Stack, Avatar, Box, Typography } from "@mui/material";
import QueryBuilderOutlinedIcon from "@mui/icons-material/QueryBuilderOutlined";
import ArrowOutwardOutlinedIcon from "@mui/icons-material/ArrowOutwardOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { fmtVND } from "@/utils/validators";

export default function StatCards({ stats }) {
    const cards = [
        { title: "Tổng đơn hôm nay", value: stats.todayOrders, icon: <QueryBuilderOutlinedIcon />, hint: `${stats.todayPaid} đã thanh toán` },
        { title: "Doanh thu hôm nay", value: fmtVND(stats.todayRevenue), icon: <ArrowOutwardOutlinedIcon />, hint: `Trung bình ${fmtVND(stats.avgTicket)}/đơn` },
        { title: "Đơn đang xử lý", value: stats.processing, icon: <LocalShippingOutlinedIcon />, hint: `${stats.pending} chờ thanh toán` },
    ];
    return (
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {cards.map((c, i) => (
                <Paper key={i} elevation={0} sx={{
                    p: 2.5, flex: 1, borderRadius: 3, border: "1px solid", borderColor: "divider",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(247,250,255,0.92) 100%)",
                }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar variant="rounded" sx={{ width: 42, height: 42, bgcolor: "primary.main", color: "primary.contrastText" }}>
                            {c.icon}
                        </Avatar>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{c.title}</Typography>
                            <Typography variant="h5" fontWeight={800}>{c.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{c.hint}</Typography>
                        </Box>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
}

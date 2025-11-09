import React from "react";
import { Paper, Stack, Avatar, Box, Typography } from "@mui/material";
import QueryBuilderOutlinedIcon from "@mui/icons-material/QueryBuilderOutlined";
import ArrowOutwardOutlinedIcon from "@mui/icons-material/ArrowOutwardOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { fmtVND } from "@/utils/validators";

export default function StatCards({ stats = {} }) {
    const safe = {
        todayOrders: stats.todayOrders ?? 0,
        todayPaid: stats.todayPaid ?? 0,
        todayRevenue: stats.todayRevenue ?? 0,
        avgTicket: stats.avgTicket ?? 0,
        processing: stats.processing ?? 0,
        pending: stats.pending ?? 0,
    };

    const cards = [
        {
            title: "Tổng đơn hôm nay",
            value: safe.todayOrders,
            icon: <QueryBuilderOutlinedIcon />,
            hint: `${safe.todayPaid} đã thanh toán`,
        },
        {
            title: "Doanh thu hôm nay",
            value: fmtVND(safe.todayRevenue),
            icon: <ArrowOutwardOutlinedIcon />,
            hint: `Trung bình ${fmtVND(safe.avgTicket)}/đơn`,
        },
        {
            title: "Đơn đang xử lý",
            value: safe.processing,
            icon: <LocalShippingOutlinedIcon />,
            hint: `${safe.pending} chờ thanh toán`,
        },
    ];

    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1.25, sm: 1.5, md: 2 }}
            sx={{ mb: { xs: 1, sm: 1.5 } }}
        >
            {cards.map((c, i) => (
                <Paper
                    key={i}
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 2.5 },
                        flex: 1,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(247,250,255,0.92) 100%)",
                        minHeight: { xs: 84, sm: 96 },
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 42,
                                height: 42,
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                flex: "0 0 auto",
                            }}
                        >
                            {c.icon}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ lineHeight: 1.15, mb: 0.25 }}
                            >
                                {c.title}
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight={800}
                                sx={{ fontSize: { xs: 20, sm: 22, md: 24 }, lineHeight: 1.2 }}
                            >
                                {c.value}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.25 }}
                            >
                                {c.hint}
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
}

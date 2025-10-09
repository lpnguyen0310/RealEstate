import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import notfoundImg from "@/assets/404notfound.jpg";

export default function DashboardNotFound() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                position: "relative",
                width: "1440",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff", // tránh viền đen 2 bên
            }}
        >
            {/* Ảnh nền */}
            <Box
                component="img"
                src={notfoundImg}
                alt="404 Not Found"
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contains", // full màn hình
                    opacity: 1, // ảnh rõ nét, không bị mờ
                }}
            />

            {/* Overlay chữ */}
            <Box
                sx={{
                    position: "absolute",
                    textAlign: "center",
                    color: "#0d3f67",
                    backgroundColor: "rgba(255, 255, 255, 0.85)", // trắng nhẹ để nổi chữ
                    borderRadius: "12px",
                    px: 5,
                    py: 4,
                    boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
                }}
            >
                <Typography variant="h4" fontWeight="bold" mb={1}>
                    404 - Trang không tồn tại
                </Typography>
                <Typography variant="body1" mb={3}>
                    Trang bạn đang tìm không tồn tại trong khu vực Dashboard.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/dashboard")}
                    sx={{ px: 4, py: 1.2, fontWeight: 600 }}
                >
                    Quay lại Dashboard
                </Button>
            </Box>
        </Box>
    );
}

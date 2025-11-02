import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Stack, Typography, CircularProgress, Box, Chip, Paper
} from "@mui/material";
import { format } from "date-fns"; // Giả sử bạn dùng date-fns
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";

const REPORT_REASON_LABELS = {
  "ADDRESS": "Địa chỉ BĐS",
  "INFO": "Sai thông tin (giá, diện tích...)",
  "IMAGES": "Ảnh sai sự thật",
  "DUPLICATE": "Tin trùng lặp",
  "NO_CONTACT": "Không liên lạc được",
  "FAKE": "Tin không có thật",
  "SOLD": "BĐS đã bán",
};

// Hàm helper để render ảnh
const renderImages = (imageUrls = []) => {
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        (Không có ảnh minh chứng)
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={1} sx={{ overflowX: "auto", py: 1 }}>
      {imageUrls.map((url, index) => (
        <Box
          key={index}
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            flexShrink: 0,
            width: 80,
            height: 80,
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #e0e0e0",
            "& img": { width: "100%", height: "100%", objectFit: "cover" },
          }}
        >
          <img src={url} alt={`Minh chứng ${index + 1}`} />
        </Box>
      ))}
    </Stack>
  );
};

export default function ReportDetailsModal({
  open,
  loading,
  postId,
  reports = [],
  onClose,
  onLockPost,      // Hàm xử lý khi Admin gỡ bài
  onDismissReports, // Hàm xử lý khi Admin bỏ qua báo cáo
  onSendWarning,
}) {

  const handleLock = () => {
    // Bạn có thể muốn thêm 1 confirm nữa ở đây
    onLockPost(postId);
    onClose();
  };

  const handleDismiss = () => {
    // Bạn có thể muốn thêm 1 confirm nữa ở đây
    onDismissReports(postId);
    onClose();
  };

  const handleWarning = () => {
    onSendWarning(postId);
    onClose(); // Tự động đóng modal chi tiết
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FeedbackOutlinedIcon color="error" />
        Chi tiết Báo cáo cho Tin #{postId}
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#f9fafb" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {reports.length === 0 ? (
              <Typography>Không tìm thấy báo cáo nào.</Typography>
            ) : (
              reports.map((report) => (
                <Paper key={report.id} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                  <Box sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      {/* --- Phần Lý do --- */}
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {report.reasons?.map((reasonKey) => ( // 'reasonKey' giờ là "FAKE"
                            <Chip 
                            key={reasonKey} 
                            // Dùng object để dịch, nếu không có thì dùng chính key đó
                            label={REPORT_REASON_LABELS[reasonKey] || reasonKey} 
                            color="error" 
                            size="small" 
                            variant="outlined" 
                            />
                        ))}
                        </Stack>
                      
                      {/* --- Phần Nội dung --- */}
                      <Typography variant="body2" sx={{ fontStyle: "italic", color: "#111827" }}>
                        "{report.details || "Không có phản hồi chi tiết."}"
                      </Typography>
                      
                      {/* --- Phần Ảnh --- */}
                      {renderImages(report.imageUrls)}

                      {/* --- Phần Thông tin meta --- */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Bởi: <strong>{report.reporterEmail || "N/A"}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.createdAt ? format(new Date(report.createdAt), "HH:mm dd/MM/yyyy") : ""}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              ))
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Box>
           {/* Nút hành động chính */}
           <Button onClick={handleLock} color="error" variant="contained" disabled={loading || reports.length === 0}>
             Gỡ bài đăng này
           </Button>
           <Button onClick={handleWarning} color="primary" variant="outlined" sx={{ ml: 1.5 }} disabled={loading || reports.length === 0}>
             Gửi cảnh báo
           </Button>
           <Button onClick={handleDismiss} color="inherit" variant="outlined" sx={{ ml: 1.5 }} disabled={loading || reports.length === 0}>
             Bỏ qua
           </Button>
        </Box>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
import React, { useState, useCallback } from "react"; // Thêm useState và useCallback
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Stack, Typography, CircularProgress, Box, Chip, Paper,
  Checkbox, FormControlLabel // Thêm Checkbox và FormControlLabel
} from "@mui/material";
import { format } from "date-fns";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import DeleteIcon from "@mui/icons-material/Delete"; // Icon cho nút xóa

const REPORT_REASON_LABELS = {
  "ADDRESS": "Địa chỉ BĐS",
  "INFO": "Sai thông tin (giá, diện tích...)",
  "IMAGES": "Ảnh sai sự thật",
  "DUPLICATE": "Tin trùng lặp",
  "NO_CONTACT": "Không liên lạc được",
  "FAKE": "Tin không có thật",
  "SOLD": "BĐS đã bán",
};

// Hàm helper để render ảnh (giữ nguyên)
const renderImages = (imageUrls = []) => {
    // ... (logic renderImages giữ nguyên)
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

export default function ReportDetailsModalUpdated({
  open,
  loading,
  postId,
  reports = [], // Giả sử mỗi report có 1 'id' duy nhất
  onClose,
  onLockPost,      
  onDeleteReports, // Đổi tên từ onDismissReports -> onDeleteReports
  onSendWarning,
}) {
  // 1. Thêm State để theo dõi các báo cáo được chọn
  const [selectedReports, setSelectedReports] = useState([]);

  // Hàm xử lý chọn/bỏ chọn từng báo cáo
  const handleSelectReport = useCallback((reportId) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        return [...prev, reportId];
      }
    });
  }, []);

  // Hàm xử lý chọn/bỏ chọn TẤT CẢ báo cáo
  const handleSelectAll = useCallback(() => {
    if (selectedReports.length === reports.length && reports.length > 0) {
      setSelectedReports([]); // Bỏ chọn tất cả
    } else {
      setSelectedReports(reports.map(r => r.id)); // Chọn tất cả
    }
  }, [reports, selectedReports.length]);


  const handleLock = () => {
    onLockPost(postId);
    onClose();
  };

  // 3. Cập nhật hàm xử lý Xóa (trước đây là Bỏ qua)
  const handleDelete = () => {
    if (selectedReports.length === 0) return;
    // Truyền postId và danh sách ID của các reports cần xóa
    onDeleteReports(postId, selectedReports); 
    onClose();
  };

  const handleWarning = () => {
    onSendWarning(postId);
    onClose();
  };

  const isAnyReportSelected = selectedReports.length > 0;
  const isAllReportsSelected = reports.length > 0 && selectedReports.length === reports.length;


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth> {/* Tăng maxWidth để có chỗ cho checkbox */}
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
            {reports.length > 0 && (
                <Box sx={{ borderBottom: "1px solid #e0e0e0", pb: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox 
                                checked={isAllReportsSelected} 
                                onChange={handleSelectAll}
                                disabled={reports.length === 0}
                            />
                        }
                        label={`Chọn tất cả (${selectedReports.length}/${reports.length} báo cáo)`}
                    />
                </Box>
            )}

            {reports.length === 0 ? (
              <Typography>Không tìm thấy báo cáo nào.</Typography>
            ) : (
              reports.map((report) => (
                <Paper 
                  key={report.id} 
                  elevation={0} 
                  sx={{ 
                    border: isAnyReportSelected && selectedReports.includes(report.id) ? "2px solid #3f51b5" : "1px solid #e5e7eb", // Đổi màu border khi được chọn
                    borderRadius: "8px" 
                  }}
                >
                  <Stack direction="row" spacing={0} alignItems="flex-start">
                    {/* Checkbox bên trái */}
                    <Box sx={{ pt: 2, pl: 1, pr: 1 }}>
                        <Checkbox 
                            checked={selectedReports.includes(report.id)} 
                            onChange={() => handleSelectReport(report.id)}
                            size="small"
                        />
                    </Box>

                    {/* Nội dung báo cáo */}
                    <Box sx={{ p: 2, flexGrow: 1 }}>
                      <Stack spacing={1.5}>
                        {/* --- Phần Lý do --- */}
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {report.reasons?.map((reasonKey) => (
                              <Chip 
                              key={reasonKey} 
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
                  </Stack>
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
            
            {/* 4. Nút XÓA/BỎ QUA các báo cáo đã chọn */}
            <Button 
                onClick={handleDelete} 
                color="warning" 
                variant="contained" 
                startIcon={<DeleteIcon />} 
                sx={{ ml: 1.5 }} 
                disabled={loading || !isAnyReportSelected}
            >
                Xóa {selectedReports.length > 0 ? `(${selectedReports.length})` : ''} báo cáo đã chọn
            </Button>
        </Box>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
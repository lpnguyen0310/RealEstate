import { useState } from "react";
// 1. THÊM LẠI: Import 'axios' để dùng cho customRequest
import axios from "axios"; 
import {
  Modal,
  Button,
  Form,
  Input,
  Checkbox,
  message,
  Upload,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { getUploadSignature } from "@/api/cloudinary";
import { useCreateReportMutation } from "@/services/reportApiSlice";

const REPORT_REASONS = [
  { value: "ADDRESS", label: "Địa chỉ của bất động sản" },
  { value: "INFO", label: "Các thông tin về: giá, diện tích, mô tả ...." },
  { value: "IMAGES", label: "Ảnh" },
  { value: "DUPLICATE", label: "Trùng với tin rao khác" },
  { value: "NO_CONTACT", label: "Không liên lạc được" },
  { value: "FAKE", label: "Tin không có thật" },
  { value: "SOLD", label: "Bất động sản đã bán" },
];

export default function ReportModal({ postId, visible, onCancel }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [createReport, { isLoading }] = useCreateReportMutation();

  // 2. CẬP NHẬT: Hàm handleCloudinaryUpload
  const handleCloudinaryUpload = async ({ file, onSuccess, onError }) => {
    try {
      // getUploadSignature giờ trả về các trường theo file cloudinary.js
      const { timestamp, signature, apiKey, folder, cloudName } =
        await getUploadSignature("report_proofs");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);
      formData.append("use_filename", "true");
      formData.append("unique_filename", "false");

      // Tự xây dựng uploadUrl dựa trên cloudName
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      // Dùng axios (đã import lại) để POST
      const response = await axios.post(uploadUrl, formData);
      onSuccess(response.data); // Trả về { secure_url, ... }
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      message.error("Upload ảnh minh chứng thất bại!");
      onError(error);
    }
  };

  // Hàm handleFileChange (Không thay đổi)
  const handleFileChange = ({ file, fileList: newFileList }) => {
    setFileList(newFileList);

    if (file.status === "done") {
      const updatedList = newFileList.map((f) => {
        if (f.uid === file.uid) {
          // 'response' chính là response.data từ handleCloudinaryUpload
          return { ...f, url: file.response.secure_url };
        }
        return f;
      });
      setFileList(updatedList);
    } else if (file.status === "error") {
      message.error(`${file.name} upload thất bại.`);
    }
  };

  // Hàm handleSubmit (Không thay đổi)
  const handleSubmit = async (values) => {
    const uploadingFiles = fileList.filter((f) => f.status === "uploading");
    if (uploadingFiles.length > 0) {
      message.warning("Vui lòng chờ ảnh minh chứng upload xong!");
      return;
    }

    const imageUrls = fileList
      .filter((f) => f.status === "done" && f.url)
      .map((f) => f.url);

    const reasons = values.reasons || [];
    const details = values.details || "";
    if (reasons.length === 0 && !details) {
      message.warning("Vui lòng chọn ít nhất một lý do hoặc nhập phản hồi.");
      return;
    }

    const payload = {
      postId,
      reasons,
      details,
      imageUrls,
    };

    try {
      await createReport(payload).unwrap();
      message.success("Cảm ơn bạn! Báo cáo của bạn đã được gửi đi.");
      form.resetFields();
      setFileList([]);
      onCancel();
    } catch (err) {
      console.error("Gửi báo cáo thất bại:", err);
      const errorMessage = err.data?.message || "Gửi báo cáo thất bại.";
      message.error(errorMessage);
    }
  };

  // handleCancel (Không thay đổi)
  const handleCancel = () => {
    if (isLoading) return;
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  // uploadButton (Không thay đổi)
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh</div>
    </div>
  );

  return (
    <Modal
      title="Báo cáo tin rao có thông tin không đúng"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleCancel} disabled={isLoading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isLoading}
          onClick={() => form.submit()}
          className="bg-red-600 hover:bg-red-700"
        >
          Gửi
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        {/* ... (Các Form.Item khác không thay đổi) ... */}
        <Form.Item
          name="reasons"
          label="Chọn lý do báo cáo (có thể chọn nhiều):"
          className="mb-4"
        >
          <Checkbox.Group>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((r) => (
                <Checkbox key={r.value} value={r.value}>
                  {r.label}
                </Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item name="details" label="Phản hồi khác">
          <Input.TextArea rows={3} placeholder="Nhập nội dung..." />
        </Form.Item>

        <Form.Item label="Ảnh minh chứng (tối đa 3)">
          <Upload
            accept="image/png, image/jpeg"
            customRequest={handleCloudinaryUpload}
            listType="picture-card"
            fileList={fileList}
            onChange={handleFileChange}
          >
            {fileList.length >= 3 ? null : uploadButton}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
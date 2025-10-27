import React, { useMemo, useState, useEffect } from "react";
import { Card, Form, Input, Button, Upload, Space, Typography, Divider, Select } from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Item } = Form;
const MAX_PHONES = 5;

// Bỏ onChanged vì không cần nữa
export default function EditInfoForm({ initialData, onSubmit, onUploadAvatar }) {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false); // State để quản lý loading của Upload

  // (useMemo tính initialValues giữ nguyên)
  const initialValues = useMemo(() => {
    if (!initialData) return {};
    const profile = initialData; // Dữ liệu profile nằm ngay cấp đầu
    return {
      fullName: initialData.fullName,
      personalTaxCode: profile?.personalTaxCode,
      email: initialData.email,
      __mainPhone: initialData.phone,
      phones: profile?.additionalPhones || [],
      buyerName: profile?.buyerName || initialData.fullName,
      invoiceEmail: profile?.invoiceEmail || initialData.email,
      companyName: profile?.companyName,
      companyTaxCode: profile?.companyTaxCode,
      cccd: profile?.citizenId,
      dvqhns: profile?.dvqhns,
      passport: profile?.passport,
      address: profile?.address || "VN",
    };
  }, [initialData]);

  // useEffect để cập nhật form khi data tải xong (giữ nguyên)
  useEffect(() => {
    if (initialData) {
      form.resetFields(); // Reset trước khi set
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, initialData, form]);

  // --- HÀM TRUNG GIAN ĐỂ GỌI UPLOAD TỪ CHA ---
  // customRequest của antd Upload sẽ gọi hàm này
  const customUploadRequest = async ({ file, onSuccess, onError }) => {
    setUploading(true); // Bắt đầu loading (cho UI của Upload)
    try {
      // Gọi hàm onUploadAvatar (từ AccountManagement)
      await onUploadAvatar?.(file);
      onSuccess?.("ok"); // Báo cho antd Upload là thành công
    } catch (error) {
      onError?.(error); // Báo cho antd Upload là thất bại
    } finally {
      setUploading(false); // Kết thúc loading (cho UI của Upload)
    }
  };

  // --- COMPONENT UPLOAD AVATAR (HIỂN THỊ ẢNH) ---
  const RenderUploadAvatar = () => {
    const currentAvatarUrl = initialData?.avatar; // Lấy URL avatar từ Redux data

    return (
      <Upload
        name="avatar"
        listType="picture-circle"
        className="avatar-uploader"
        showUploadList={false}
        customRequest={customUploadRequest}
        disabled={uploading}
      >
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Avatar"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div style={{ textAlign: "center" }}>
            {uploading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>{uploading ? "Đang tải..." : "Tải ảnh"}</div>
          </div>
        )}
      </Upload>
    );
  };

  // Hàm submit form (text)
  const handleFinish = (values) => {
    const payload = {
      fullName: values.fullName,
      email: values.email,
      personalTaxCode: values.personalTaxCode,
      additionalPhones: (values.phones || []).filter(Boolean),
      buyerName: values.buyerName,
      invoiceEmail: values.invoiceEmail,
      companyName: values.companyName,
      companyTaxCode: values.companyTaxCode,
      address: values.address,
      dvqhns: values.dvqhns,
      citizenId: values.cccd,
      passport: values.passport,
    };
    return onSubmit?.(payload);
  };

  return (
    <div className="max-w-[700px]">
      <Card variant="borderless">
        <Title level={5} className="!mt-0">
          Thông tin cá nhân
        </Title>

        <div className="my-4 flex justify-center">
          <RenderUploadAvatar />
        </div>

        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Item
              label="Họ và tên"
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input />
            </Item>
            <Item label="Mã số thuế cá nhân" name="personalTaxCode">
              <Input />
            </Item>
          </div>

          <Divider />

          <Title level={5}>Thông tin liên hệ</Title>
          <div className="grid grid-cols-1 gap-4">
            <Item label="Số điện thoại chính" name="__mainPhone">
              <Input disabled />
            </Item>

            {/* Số điện thoại phụ */}
            <div>
              <Form.List name="phones">
                {(fields, { add, remove }) => (
                  <>
                    <Space className="mb-2" size={8} align="center">
                      <Text>Thêm số điện thoại ({1 + fields.length}/{MAX_PHONES})</Text>
                      {fields.length < MAX_PHONES - 1 && (
                        <Button type="link" icon={<PlusOutlined />} onClick={() => add("")}>
                          Thêm
                        </Button>
                      )}
                    </Space>

                    <div className="space-y-2">
                      {fields.map((field) => (
                        <Space key={field.key} align="start">
                          <Form.Item
                            {...field}
                            rules={[{ max: 20, message: "Số quá dài" }]}
                          >
                            <Input
                              placeholder="Số điện thoại phụ"
                              style={{ width: 320 }}
                            />
                          </Form.Item>
                          <Button type="text" danger onClick={() => remove(field.name)}>
                            Xoá
                          </Button>
                        </Space>
                      ))}
                    </div>
                  </>
                )}
              </Form.List>
            </div>

            {/* Email + xác thực */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-end gap-3">
              <Form.Item
                label="Email"
                name="email"
                className="!mb-0"
                rules={[{ type: "email", message: "Email không hợp lệ" }]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
              <Form.Item className="!mb-0">
                <Button className="h-[40px]" onClick={() => window?.alert?.("Chức năng xác thực (demo).")}>
                  Xác thực
                </Button>
              </Form.Item>
            </div>
          </div>

          <Divider />

          <Title level={5}>Thông tin xuất hoá đơn</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Item label="Họ tên người mua hàng" name="buyerName">
              <Input />
            </Item>
            <Item
              label="Email nhận hoá đơn"
              name="invoiceEmail"
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
            >
              <Input />
            </Item>
            <Item label="Tên đơn vị (Tên công ty)" name="companyName" className="md:col-span-2">
              <Input />
            </Item>
            <Item label="Mã số thuế" name="companyTaxCode">
              <Input />
            </Item>
            <Item label="Căn cước công dân" name="cccd">
              <Input />
            </Item>
            <Item label="Mã số ĐVQHNS" name="dvqhns">
              <Input />
            </Item>
            <Item label="Số hộ chiếu" name="passport">
              <Input />
            </Item>
            <Item label="Địa chỉ" name="address" className="md:col-span-2">
              <Select
                options={[
                  { label: "Việt Nam", value: "VN" },
                  { label: "Hoa Kỳ", value: "US" },
                  { label: "Nhật Bản", value: "JP" },
                  { label: "Khác", value: "OTHER" },
                ]}
              />
            </Item>
          </div>

          <div className="text-sm text-gray-600 space-y-1 mt-2">
            <div>• Xuất hoá đơn trong ngày cho tất cả giao dịch nộp tiền.</div>
            <div>• Vui lòng nhập chính xác, bạn chịu trách nhiệm về thông tin cung cấp.</div>
            <div>• Thắc mắc hoá đơn: 1900 1881 (trước 18h).</div>
          </div>

          {/* Submit ẩn */}
          <button type="submit" id="edit-info-submit" style={{ display: "none" }} />
        </Form>
      </Card>
    </div>
  );
}

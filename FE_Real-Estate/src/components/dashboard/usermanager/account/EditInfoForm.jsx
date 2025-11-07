// src/components/dashboard/usermanager/account/EditInfoForm.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Card, Form, Input, Button, Upload, Space, Typography, Divider, Select } from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Item } = Form;
const MAX_PHONES = 5;

export default function EditInfoForm({ initialData, onSubmit, onUploadAvatar }) {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const initialValues = useMemo(() => {
    if (!initialData) return {};
    const p = initialData;
    return {
      fullName: p.fullName,
      personalTaxCode: p.personalTaxCode,
      email: p.email,
      __mainPhone: p.phone,
      phones: p.additionalPhones || [],
      buyerName: p.buyerName || p.fullName,
      invoiceEmail: p.invoiceEmail || p.email,
      companyName: p.companyName,
      companyTaxCode: p.companyTaxCode,
      cccd: p.citizenId,
      dvqhns: p.dvqhns,
      passport: p.passport,
      address: p.address || "VN",
    };
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      form.resetFields();
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, initialData, form]);

  const customUploadRequest = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      await onUploadAvatar?.(file);
      onSuccess?.("ok");
    } catch (e) {
      onError?.(e);
    } finally {
      setUploading(false);
    }
  };

  const RenderUploadAvatar = () => {
    const currentAvatarUrl = initialData?.avatar;
    const box = { width: 128, height: 128 };

    return (
      <Upload
        name="avatar"
        listType="picture-circle"
        showUploadList={false}
        customRequest={customUploadRequest}
        disabled={uploading}
        style={box}
      >
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Avatar"
            style={{ ...box, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ textAlign: "center", width: box.width }}>
            {uploading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>{uploading ? "Đang tải..." : "Tải ảnh"}</div>
          </div>
        )}
      </Upload>
    );
  };

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
    // Giữ mép thẳng với phần nội dung bên phải, không quá hẹp
    <div className="w-full max-w-[960px] mx-auto">
      <Card variant="borderless" className="!shadow-none">
        {/* Header */}
        <div className="mb-4">
          <Title level={5} className="!mt-0 !mb-1">Thông tin cá nhân</Title>
          <Text type="secondary">Điền đầy đủ để hoàn thiện hồ sơ của bạn.</Text>
        </div>

        {/* Avatar center, cách đều trên dưới */}
        <div className="flex justify-center py-2">
          <RenderUploadAvatar />
        </div>

        <Form layout="vertical" form={form} onFinish={handleFinish}>
          {/* ==== HÀNG 1: Họ tên / Mã số thuế ==== */}
          <div className="grid grid-cols-12 gap-x-6 gap-y-4">
            <Item
              className="col-span-12 md:col-span-6"
              label="Họ và tên"
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input />
            </Item>

            <Item className="col-span-12 md:col-span-6" label="Mã số thuế cá nhân" name="personalTaxCode">
              <Input />
            </Item>
          </div>

          <Divider className="!my-6" />

          {/* ==== THÔNG TIN LIÊN HỆ ==== */}
          <Title level={5} className="!mb-3">Thông tin liên hệ</Title>
          <div className="grid grid-cols-12 gap-x-6 gap-y-4">
            <Item className="col-span-12" label="Số điện thoại chính" name="__mainPhone">
              <Input disabled />
            </Item>

            {/* Phones phụ: full width, item cùng mép */}
            <div className="col-span-12">
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
                        <div key={field.key} className="flex items-start gap-2">
                          <Form.Item {...field} className="!mb-0" rules={[{ max: 20, message: "Số quá dài" }]}>
                            <Input placeholder="Số điện thoại phụ" className="w-[320px] max-w-full" />
                          </Form.Item>
                          <Button type="text" danger onClick={() => remove(field.name)}>Xoá</Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Form.List>
            </div>

            {/* Email + nút xác thực: canh hàng, mép phải thẳng */}
            <Form.Item
              className="col-span-12 md:col-span-9 !mb-0"
              label="Email"
              name="email"
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>
            <Form.Item className="col-span-12 md:col-span-3 !mb-0 md:flex md:items-end">
              <Button className="h-[40px] w-full md:w-auto" onClick={() => window?.alert?.("Chức năng xác thực (demo).")}>
                Xác thực
              </Button>
            </Form.Item>
          </div>

          <Divider className="!my-6" />

          {/* ==== THÔNG TIN XUẤT HOÁ ĐƠN ==== */}
          <Title level={5} className="!mb-3">Thông tin xuất hoá đơn</Title>
          <div className="grid grid-cols-12 gap-x-6 gap-y-4">
            <Item className="col-span-12 md:col-span-6" label="Họ tên người mua hàng" name="buyerName">
              <Input />
            </Item>

            <Item
              className="col-span-12 md:col-span-6"
              label="Email nhận hoá đơn"
              name="invoiceEmail"
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
            >
              <Input />
            </Item>

            <Item className="col-span-12" label="Tên đơn vị (Tên công ty)" name="companyName">
              <Input />
            </Item>

            <Item className="col-span-12 md:col-span-6" label="Mã số thuế" name="companyTaxCode">
              <Input />
            </Item>
            <Item className="col-span-12 md:col-span-6" label="Căn cước công dân" name="cccd">
              <Input />
            </Item>

            <Item className="col-span-12 md:col-span-6" label="Mã số ĐVQHNS" name="dvqhns">
              <Input />
            </Item>
            <Item className="col-span-12 md:col-span-6" label="Số hộ chiếu" name="passport">
              <Input />
            </Item>

            <Item className="col-span-12" label="Địa chỉ" name="address">
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

          {/* Notes */}
          <div className="text-sm text-gray-600 space-y-1 mt-3">
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

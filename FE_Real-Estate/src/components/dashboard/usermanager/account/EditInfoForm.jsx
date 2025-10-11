import React, { useMemo, useState } from "react";
import { Card, Form, Input, Button, Upload, Space, Typography, Divider, Select, message, } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Item } = Form;
const MAX_PHONES = 5;

export default function EditInfoForm({ initialData, onSubmit, onUploadAvatar }) {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  // Map dữ liệu user -> initialValues cho Form
  const initialValues = useMemo(() => {
    const fullName =
      initialData?.fullName ||
      `${initialData?.firstName ?? ""} ${initialData?.lastName ?? ""}`.trim() ||
      initialData?.username ||
      initialData?.email ||
      "Người dùng";

    const email = initialData?.email || "";
    const mainPhone =
      initialData?.phone || initialData?.phoneNumber || initialData?.mobile || "";

    const phones =
      initialData?.additionalPhones || initialData?.otherPhones || [];

    return {
      fullName,
      personalTaxCode: initialData?.personalTaxCode,
      email,
      __mainPhone: mainPhone,         // chỉ để hiển thị (disabled)
      phones,                         // Form.List
      // invoice
      buyerName: fullName,
      invoiceEmail: email,
      companyName: initialData?.invoice?.companyName,
      companyTaxCode: initialData?.invoice?.companyTaxCode,
      cccd: initialData?.identity?.cccd,
      dvqhns: initialData?.invoice?.dvqhns,
      passport: initialData?.identity?.passport,
      address: initialData?.invoice?.addressCode || "VN",
    };
  }, [initialData]);

  const handleUploadChange = async ({ file }) => {
    if (!file) return;
    setUploading(true);
    try {
      // Nếu có API upload thật, gọi onUploadAvatar(file) ở đây
      // await onUploadAvatar?.(file);
      await new Promise((r) => setTimeout(r, 600)); // mock
      message.success("Tải ảnh thành công (demo).");
    } catch {
      message.error("Tải ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const UploadAvatar = (
    <Upload
      name="avatar"
      showUploadList={false}
      beforeUpload={() => false} // không upload tự động
      onChange={handleUploadChange}
      className="mx-auto"
    >
      <div
        className="mx-auto rounded-full border border-dashed border-gray-300 w-[140px] h-[140px] grid place-items-center cursor-pointer"
        style={{ background: "#fafafa" }}
      >
        <Space direction="vertical" align="center" size={6}>
          <UploadOutlined />
          <Text type="secondary">{uploading ? "Đang tải..." : "Tải ảnh"}</Text>
        </Space>
      </div>
    </Upload>
  );

  const handleFinish = (values) => {
    // Chuẩn hoá payload theo BE của bạn
    const payload = {
      fullName: values.fullName,
      personalTaxCode: values.personalTaxCode,
      email: values.email,
      mainPhone: initialValues.__mainPhone, // số chính đang để readonly
      additionalPhones: (values.phones || []).filter(Boolean),
      invoice: {
        buyerName: values.buyerName,
        invoiceEmail: values.invoiceEmail,
        companyName: values.companyName,
        companyTaxCode: values.companyTaxCode,
        addressCode: values.address,
        dvqhns: values.dvqhns,
      },
      identity: {
        cccd: values.cccd,
        passport: values.passport,
      },
    };

    onSubmit?.(payload);
    message.success("Đã lưu thay đổi (demo).");
  };

  return (
    <div className="max-w-[700px]">
      <Card bordered={false}>
        <Title level={5} className="!mt-0">Thông tin cá nhân</Title>
        <div className="my-4">{UploadAvatar}</div>

        <Form
          layout="vertical"
          form={form}
          initialValues={initialValues}
          onFinish={handleFinish}
        >
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
                      <Text>
                        Thêm số điện thoại ({1 + fields.length}/{MAX_PHONES})
                      </Text>
                      {fields.length < MAX_PHONES - 1 && (
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
                          onClick={() => add("")}
                        >
                          Thêm
                        </Button>
                      )}
                    </Space>

                    <div className="space-y-2">
                      {fields.map((field) => (
                        <Space key={field.key} align="start">
                          <Form.Item
                            {...field}
                            rules={[
                              { max: 20, message: "Số quá dài" },
                            ]}
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
                <Button className="h-[40px]" onClick={() => message.info("Chức năng xác thực (demo).")}>
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

          {/* Submit ẩn để nút "Lưu thay đổi" bên ngoài có thể trigger */}
          <button type="submit" id="edit-info-submit" style={{ display: "none" }} />
        </Form>
      </Card>
    </div>
  );
}

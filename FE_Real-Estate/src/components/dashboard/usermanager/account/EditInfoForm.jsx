import React, { useState } from "react";
import { Card, Form, Input, Button, Upload, Space, Typography, Divider, Select, message } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Item } = Form;
const MAX_PHONES = 5;

export default function EditInfoForm() {
  const [uploading, setUploading] = useState(false);
  const [mainPhone] = useState("0943899717");
  const [phones, setPhones] = useState([""]);

  const addPhone = () => phones.length < MAX_PHONES - 1 && setPhones((a) => [...a, ""]);
  const changePhone = (val, i) => setPhones((a) => a.map((v, idx) => (idx === i ? val : v)));
  const removePhone = (i) => setPhones((a) => a.filter((_, idx) => idx !== i));

  const UploadAvatar = (
    <Upload
      name="avatar"
      showUploadList={false}
      beforeUpload={() => false}
      onChange={({ file }) => {
        if (!file) return;
        setUploading(true);
        setTimeout(() => {
          setUploading(false);
          message.success("Tải ảnh thành công (mock).");
        }, 600);
      }}
      className="mx-auto"
    >
      <div className="mx-auto rounded-full border border-dashed border-gray-300 w-[140px] h-[140px] grid place-items-center cursor-pointer" style={{ background: "#fafafa" }}>
        <Space direction="vertical" align="center" size={6}>
          <UploadOutlined />
          <Text type="secondary">{uploading ? "Đang tải..." : "Tải ảnh"}</Text>
        </Space>
      </div>
    </Upload>
  );

  return (
    <div className="max-w-[700px]">
      <Card bordered={false}>
        <Title level={5} className="!mt-0">Thông tin cá nhân</Title>
        <div className="my-4">{UploadAvatar}</div>

        <Form layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Item label="Họ và tên" name="fullName" initialValue="user4706412"><Input /></Item>
            <Item label="Mã số thuế cá nhân" name="personalTaxCode"><Input /></Item>
          </div>

          <Divider />

          <Title level={5}>Thông tin liên hệ</Title>
          <div className="grid grid-cols-1 gap-4">
            <Item label="Số điện thoại chính"><Input value={mainPhone} disabled /></Item>

            <div>
              <Space className="mb-2" size={8} align="center">
                <Text>Thêm số điện thoại ({1 + phones.length}/{MAX_PHONES})</Text>
                {phones.length < MAX_PHONES - 1 && (
                  <Button type="link" icon={<PlusOutlined />} onClick={addPhone}>Thêm</Button>
                )}
              </Space>

              <div className="space-y-2">
                {phones.map((p, idx) => (
                  <Space key={idx} align="start">
                    <Input placeholder="Số điện thoại phụ" value={p} onChange={(e) => changePhone(e.target.value, idx)} style={{ width: 320 }} />
                    <Button type="text" danger onClick={() => removePhone(idx)}>Xoá</Button>
                  </Space>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-end gap-3">
              <Form.Item label="Email" name="email" className="!mb-0"><Input placeholder="Nhập email" /></Form.Item>
              <Form.Item className="!mb-0"><Button className="h-[40px]">Xác thực</Button></Form.Item>
            </div>
          </div>

          <Divider />

          <Title level={5}>Thông tin xuất hoá đơn</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Item label="Họ tên người mua hàng" name="buyerName" initialValue="user4706412"><Input /></Item>
            <Item label="Email nhận hoá đơn" name="invoiceEmail"><Input /></Item>
            <Item label="Tên đơn vị (Tên công ty)" name="companyName" className="md:col-span-2"><Input /></Item>
            <Item label="Mã số thuế" name="companyTaxCode"><Input /></Item>
            <Item label="Căn cước công dân" name="cccd"><Input /></Item>
            <Item label="Mã số ĐVQHNS" name="dvqhns"><Input /></Item>
            <Item label="Số hộ chiếu" name="passport"><Input /></Item>
            <Item label="Địa chỉ" name="address" initialValue="Việt Nam" className="md:col-span-2">
              <Select options={[{ label: "Việt Nam", value: "VN" }, { label: "Hoa Kỳ", value: "US" }, { label: "Nhật Bản", value: "JP" }, { label: "Khác", value: "OTHER" }]} />
            </Item>
          </div>

          <div className="text-sm text-gray-600 space-y-1 mt-2">
            <div>• Xuất hoá đơn trong ngày cho tất cả giao dịch nộp tiền.</div>
            <div>• Vui lòng nhập chính xác, bạn chịu trách nhiệm về thông tin cung cấp.</div>
            <div>• Thắc mắc hoá đơn: 1900 1881 (trước 18h).</div>
          </div>
        </Form>
      </Card>
    </div>
  );
}

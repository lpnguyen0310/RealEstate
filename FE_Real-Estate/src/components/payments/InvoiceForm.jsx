import React from "react";
import { Form, Input, Select, Typography } from "antd";

const { Item } = Form;
const { Text } = Typography;

/**
 * InvoiceForm
 * Props:
 *  - initialValues?: object
 *  - onChange?: (values) => void     // gọi mỗi khi đổi dữ liệu
 */
export default function InvoiceForm({ initialValues, onChange }) {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        buyerName: "user4706412",
        address: "VN",
        ...initialValues,
      }}
      onValuesChange={(_, all) => onChange?.(all)}
      className="mt-2"
    >
      {/* Họ tên + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Item
          label="Họ tên người mua hàng"
          name="buyerName"
          rules={[{ required: true, message: "Nhập họ tên người mua hàng" }]}
        >
          <Input placeholder="Nguyễn Văn A" />
        </Item>

        <Item
          label="Email nhận hóa đơn"
          name="invoiceEmail"
          rules={[
            { required: true, message: "Nhập email nhận hóa đơn" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="email@domain.com" />
        </Item>

        <Item
          label="Tên đơn vị (Tên công ty)"
          name="companyName"
          className="md:col-span-2"
        >
          <Input placeholder="Công ty TNHH ABC" />
        </Item>

        <Item
          label="Mã số thuế"
          name="companyTaxCode"
          rules={[
            {
              pattern: /^\d{10}(\d{3})?$/,
              message: "Mã số thuế gồm 10 hoặc 13 chữ số",
            },
          ]}
        >
          <Input placeholder="VD: 0312345678" maxLength={13} />
        </Item>

        <Item label="Mã số ĐVQHNS" name="dvqhns">
          <Input placeholder="(nếu có)" />
        </Item>

        <Item
          label="Căn cước công dân"
          name="cccd"
          rules={[
            { pattern: /^\d{9,12}$/, message: "CCCD gồm 9–12 chữ số" },
          ]}
        >
          <Input placeholder="VD: 0790xxxxxxx" maxLength={12} />
        </Item>

        <Item label="Số hộ chiếu" name="passport">
          <Input placeholder="(nếu có)" />
        </Item>

        <Item
          label="Địa chỉ"
          name="address"
          className="md:col-span-2"
          rules={[{ required: true, message: "Chọn địa chỉ" }]}
        >
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

      {/* Ghi chú */}
      <div className="text-sm text-gray-600 space-y-1 mt-2">
        <div>• Hóa đơn điện tử sẽ được gửi về Email nhận hóa đơn.</div>
        <div>• Vui lòng nhập đầy đủ, chính xác – bạn chịu trách nhiệm về thông tin đã cung cấp.</div>
        <div>• Hóa đơn GTGT sẽ được xuất trong ngày cho tất cả các giao dịch nộp tiền.</div>
        <div>• Nội dung dịch vụ thể hiện trên hóa đơn là Phí dịch vụ quảng cáo trên website.</div>
      </div>
    </Form>
  );
}

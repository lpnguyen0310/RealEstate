import { useState } from "react";
import {
  Tabs, Form, Input, Button, Upload, Card, Space, Typography, Select, Divider, message, Affix,Collapse
} from "antd";
import { PlusOutlined, UploadOutlined, SaveOutlined,LockOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Item } = Form;

const MAX_PHONES = 5;

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState("edit");
  const [mainPhone] = useState("0943899717");
  const [phones, setPhones] = useState([""]); // thêm số phụ
  const [uploading, setUploading] = useState(false);

  const addPhone = () => {
    if (phones.length >= MAX_PHONES - 1) return;
    setPhones((arr) => [...arr, ""]);
  };
  const changePhone = (val, idx) => {
    setPhones((arr) => arr.map((v, i) => (i === idx ? val : v)));
  };
  const removePhone = (idx) => {
    setPhones((arr) => arr.filter((_, i) => i !== idx));
  };

  const onSave = () => {
    message.success("Đã lưu thay đổi (demo).");
  };

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

  const EditInfo = (
    <div className="max-w-[700px]">
      <Card bordered={false}>
        <Title level={5} style={{ marginTop: 0 }}>Thông tin cá nhân</Title>
        <div className="my-4">{UploadAvatar}</div>

        <Form layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Item label="Họ và tên" name="fullName" initialValue="user4706412">
              <Input placeholder="Nhập họ và tên" />
            </Item>
            <Item label="Mã số thuế cá nhân" name="personalTaxCode">
              <Input placeholder="Nhập MST cá nhân" />
            </Item>
          </div>

          <Divider />

          <Title level={5}>Thông tin liên hệ</Title>
          <div className="grid grid-cols-1 gap-4">
            <Item label="Số điện thoại chính">
              <Input value={mainPhone} disabled />
            </Item>

            <div>
              <Space className="mb-2" size={8} align="center">
                <Text>Thêm số điện thoại ({1 + phones.length}/{MAX_PHONES})</Text>
                {phones.length < MAX_PHONES - 1 && (
                  <Button type="link" icon={<PlusOutlined />} onClick={addPhone}>
                    Thêm
                  </Button>
                )}
              </Space>

              <div className="space-y-2">
                {phones.map((p, idx) => (
                  <Space key={idx} align="start">
                    <Input
                      placeholder="Số điện thoại phụ"
                      value={p}
                      onChange={(e) => changePhone(e.target.value, idx)}
                      style={{ width: 320 }}
                    />
                    <Button type="text" danger onClick={() => removePhone(idx)}>
                      Xoá
                    </Button>
                  </Space>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-end gap-3">
                <Form.Item label="Email" name="email" className="!mb-0">
                    <Input placeholder="Nhập email" />
                </Form.Item>

                <Form.Item className="!mb-0">
                    <Button className="h-[40px]">Xác thực</Button>
                </Form.Item>
            </div>

          </div>

          <Divider />

          <Title level={5}>Thông tin xuất hoá đơn</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Item label="Họ tên người mua hàng" name="buyerName" initialValue="user4706412">
              <Input />
            </Item>
            <Item label="Email nhận hoá đơn" name="invoiceEmail">
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
            <Item label="Địa chỉ" name="address" initialValue="Việt Nam" className="md:col-span-2">
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
            <div>• Hóa đơn GTGT sẽ được xuất trong ngày và cho tất cả các giao dịch nộp tiền.</div>
            <div>• Vui lòng nhập đầy đủ, chính xác – bạn chịu trách nhiệm về thông tin đã cung cấp.</div>
            <div>• Mọi thắc mắc về hoá đơn vui lòng liên hệ hotline 1900 1881 trước 18h.</div>
          </div>
        </Form>
      </Card>
    </div>
  );

  const AccountSettings = (
  <div className="max-w-[700px] mx-auto">
    <Card
      bordered={false}
      styles={{
        body: { padding:"5px 24px", borderRadius: 12 },
      }}
    >
      {/* H1 của section con */}
      <Title level={5} className="!mt-0 !mb-4 !text-[23px] !leading-6 !font-semibold">
        Đổi mật khẩu
      </Title>

      <Form
        layout="vertical"
        onFinish={() => message.success("Đã lưu mật khẩu (demo)")}
        className="space-y-0"
      >
        {/* Hàng 1: input + link bên phải */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-end gap-3">
          <Form.Item
            className="!mb-0"
            label={<span className="text-[14px] font-medium text-gray-700">Mật khẩu hiện tại</span>}
            name="oldPassword"
            rules={[{ required: true, message: "Nhập mật khẩu hiện tại" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" size="middle" />
          </Form.Item>

          <a className="text-[14px] text-red-500 md:self-end md:mb-[6px]">
            Bạn quên mật khẩu?
          </a>
        </div>

        {/* Hàng 2: mật khẩu mới */}
        <Form.Item
          className="!mb-0 mt-4"
          label={<span className="text-[14px] font-medium text-gray-700">Mật khẩu mới</span>}
          name="newPassword"
          rules={[
            { required: true, message: "Nhập mật khẩu mới" },
            { min: 8, message: "Ít nhất 8 ký tự" },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu mới" size="middle" />
        </Form.Item>

        {/* Hàng 3: nhập lại + nút Lưu cùng hàng */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-end gap-3 mt-4">
          <Form.Item
            className="!mb-0"
            label={<span className="text-[14px] font-medium text-gray-700">Nhập lại mật khẩu mới</span>}
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Nhập lại mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  if (!v || getFieldValue("newPassword") === v) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu nhập lại không khớp"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" size="middle" />
          </Form.Item>

          <Form.Item className="!mb-0">
            <Button
              type="primary"
              danger
              htmlType="submit"
              className="h-10 w-[128px] rounded-md font-semibold"
            >
              Lưu thay đổi
            </Button>
          </Form.Item>
        </div>

        {/* ghi chú tiêu chí mật khẩu */}
        <ul className="text-[13px] text-gray-500 mt-3 space-y-1 list-disc pl-5">
          <li>Mật khẩu tối thiểu 8 ký tự</li>
          <li>Chứa ít nhất 1 ký tự viết hoa</li>
          <li>Chứa ít nhất 1 ký tự số</li>
        </ul>
      </Form>

      <Divider className="!my-6" />

      {/* Accordion: caret ở CUỐI & lề/padding đồng nhất */}
      <Collapse
        bordered={false}
        expandIconPosition="end"
        className="bg-transparent account-collapse [&_.ant-collapse-header]:!px-0
                    [&_.ant-collapse-content-box]:!px-0"
        items={[
          {
            key: "lock",
            label: <span className="text-[23px] font-semibold">Yêu cầu khóa tài khoản</span>,
            children: (
              <div className="space-y-3">
                <Form layout="vertical" onFinish={() => message.success("Đã gửi yêu cầu khóa (demo)")} >
                  <div className="flex gap-3 md:items-end">
                    <Form.Item
                      label={<span className="text-[14px] font-medium text-gray-700">Nhập mật khẩu hiện tại</span>}
                      name="lockPassword"
                      className="flex-1 !mb-0"
                      rules={[{ required: true, message: "Nhập mật khẩu" }]}
                    >
                      <Input.Password placeholder="••••••••" size="middle" />
                    </Form.Item>
                    <Form.Item className="!mb-0">
                      <Button type="primary" danger icon={<LockOutlined />} htmlType="submit" className="h-10 rounded-md font-semibold">
                        Khóa tài khoản
                      </Button>
                    </Form.Item>
                  </div>
                </Form>

                <div className="text-[13px] text-gray-600">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Quý khách sẽ không thể đăng nhập lại vào tài khoản này sau khi khóa.</li>
                    <li>Các tin đăng đang hiển thị của quý khách sẽ tiếp tục được hiển thị tới hết thời gian đăng tin đã chọn.</li>
                    <li>Số dư tiền (nếu có) trong các tài khoản của quý khách sẽ không được hoàn lại.</li>
                    <li>Tài khoản dịch vụ của quý khách chỉ có thể được khóa khi không còn số dư nợ.</li>
                    <li>Số điện thoại chính đăng ký tài khoản này và các số điện thoại đăng tin của quý khách sẽ không thể được sử dụng lại để đăng ký tài khoản mới.</li>
                    <li>Trong trường hợp bạn muốn sử dụng lại số điện thoại chính này, vui lòng liên hệ CSKH 1900.1881 để được hỗ trợ.</li>
                  </ul>
                </div>
              </div>
            ),
          },
          {
            key: "delete",
            label: <span className="text-[23px] font-semibold">Yêu cầu xóa tài khoản</span>,
            children: (
              <div className="space-y-3">
                <Text className="text-[14px] text-gray-700 block">
                    Gửi yêu cầu xóa toàn bộ thông tin của tài khoản. Sau khi xử lý, dữ liệu sẽ được xóa và không thể hoàn tác.
                </Text>

                <Button
                    danger
                    icon={<DeleteOutlined />}
                    className="h-10 rounded-md font-semibold w-full md:w-auto"
                    onClick={() => message.warning("Đã gửi yêu cầu xóa (demo)")}
                >
                    Yêu cầu xóa tài khoản
                </Button>
                </div>
            ),
          },
        ]}
      />
    </Card>
  </div>
);




  const ProBroker = (
    <div className="max-w-[700px]">
      <Card bordered={false}>
        <Title level={5} style={{ marginTop: 0 }}>Đăng ký Môi giới chuyên nghiệp</Title>
        <Text type="secondary">(Trang trống demo – bạn sẽ thêm nội dung sau.)</Text>
      </Card>
    </div>
  );

  return (
    <section className="w-full max-w-[700px] mx-auto px-4 md:px-6">
        <Title level={3} className="!mt-0">Quản lý tài khoản</Title>

        <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
            { key: "edit", label: "Chỉnh sửa thông tin", children: EditInfo },
            { key: "settings", label: "Cài đặt tài khoản", children: AccountSettings },
            { key: "pro", label: <Space>Đăng ký Môi giới chuyên nghiệp <span className="text-red-500 text-xs ml-1">Mới</span></Space>, children: ProBroker },
        ]}
        />

        {activeTab === "edit" && (
        <Affix offsetBottom={24}>
            <div className="w-full flex justify-end">
            <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                onClick={onSave}
            >
                Lưu thay đổi
            </Button>
            </div>
        </Affix>
        )}
    </section>
    );


}

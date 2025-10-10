// components/payments/AtmGatewayMock.jsx
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, Form, Input, Button, Typography, Space, Divider, Alert } from "antd";

const { Title, Text, Link } = Typography;

const fmtVND = (n) =>
  (n ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VND";

export default function AtmGatewayMock({
  amount = 0,
  orderId,                       // optional: nếu không truyền sẽ tự tạo
  merchantName = "CÔNG TY CỔ PHẦN PROPERTYGURU VIỆT NAM",
  bankName = "Techcombank",      // hiển thị dòng “Thanh toán qua Ngân hàng …”
  expireSeconds = 15 * 60,       // 15:00
  onVerify = () => {},           // callback khi bấm “Xác thực”
  onCancel = () => {},           // callback khi bấm “Hủy”
}) {
  const [left, setLeft] = useState(expireSeconds);
  const [submitting, setSubmitting] = useState(false);
  const genOrderId = useMemo(
    () => orderId ?? Math.floor(1e6 + Math.random() * 9e6),
    [orderId]
  );

  // đếm ngược
  useEffect(() => {
    setLeft(expireSeconds);
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [expireSeconds]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields();
      setSubmitting(true);
      // mô phỏng gọi gateway
      setTimeout(() => {
        setSubmitting(false);
        onVerify({
          orderId: genOrderId,
          amount,
          cardMasked: maskCard(vals.cardNumber),
          holder: vals.holder,
          exp: vals.expiry,
          bankName,
        });
      }, 800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-8">
        <Space size={8} align="center">
          <img src="https://sandbox.vnpayment.vn/paymentv2/images/logo-vi.png" alt="VNPAY" height={28} />
          <Text type="secondary">Cổng thanh toán</Text>
        </Space>
        <div className="text-sm">
          Giao dịch hết hạn sau{" "}
          <span className="inline-flex items-center justify-center bg-black text-white rounded px-2 py-[1px] font-semibold">
            {mm}
          </span>{" "}
          :{" "}
          <span className="inline-flex items-center justify-center bg-black text-white rounded px-2 py-[1px] font-semibold">
            {ss}
          </span>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left: Order info */}
        <Col xs={24} md={10}>
          <Card bordered>
            <Title level={5} style={{ marginTop: 0 }}>
              Thông tin đơn hàng
            </Title>
            <div className="space-y-2">
              <Row>
                <Col flex="auto">Số tiền thanh toán</Col>
                <Col>
                  <span className="text-blue-600 font-semibold">
                    {fmtVND(amount)}
                  </span>
                </Col>
              </Row>
              <Row>
                <Col flex="auto">Giá trị đơn hàng</Col>
                <Col>{fmtVND(amount)}</Col>
              </Row>
              <Row>
                <Col flex="auto">Phí giao dịch</Col>
                <Col>0 VND</Col>
              </Row>
              <Divider className="my-3" />
              <Row>
                <Col flex="auto">Mã đơn hàng</Col>
                <Col>{genOrderId}</Col>
              </Row>
              <Row>
                <Col flex="auto">Nhà cung cấp</Col>
                <Col style={{ textAlign: "right" }}>
                  <div style={{ maxWidth: 200 }}>{merchantName}</div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        {/* Right: Form card */}
        <Col xs={24} md={14}>
          <Card bordered>
            <Title level={5} style={{ marginTop: 0 }}>
              Thanh toán qua Ngân hàng {bankName}
            </Title>

            <div className="mb-2">
              <Space size={16}>
                <Link strong>Thẻ nội địa</Link>
                {/* Tab khác có thể bổ sung sau */}
              </Space>
            </div>

            <Form layout="vertical" form={form} autoComplete="off">
              <Form.Item
                label="Số thẻ"
                name="cardNumber"
                rules={[
                  { required: true, message: "Vui lòng nhập số thẻ" },
                  { pattern: /^\d{12,19}$/, message: "Số thẻ 12–19 chữ số" },
                ]}
              >
                <Input placeholder="Nhập số thẻ" maxLength={19} />
              </Form.Item>

              <Form.Item
                label="Tên chủ thẻ (không dấu)"
                name="holder"
                rules={[{ required: true, message: "Vui lòng nhập tên chủ thẻ" }]}
              >
                <Input placeholder="NGUYEN VAN A" />
              </Form.Item>

              <Form.Item
                label="Ngày hết hạn"
                name="expiry"
                rules={[
                  { required: true, message: "Vui lòng nhập MM/YY" },
                  { pattern: /^(0[1-9]|1[0-2])\/\d{2}$/, message: "Định dạng MM/YY" },
                ]}
              >
                <Input placeholder="MM/YY" maxLength={5} />
              </Form.Item>

              <Form.Item label="Mã khuyến mại" name="promo">
                <Input placeholder="Chọn hoặc nhập mã" />
              </Form.Item>

              <div className="mb-3">
                <Alert
                  type="info"
                  message={
                    <span>
                      Bằng việc tiếp tục, bạn đồng ý với{" "}
                      <Link>Điều kiện sử dụng dịch vụ</Link>.
                    </span>
                  }
                  showIcon
                />
              </div>

              <Space style={{ width: "100%", justifyContent: "end" }}>
                <Button onClick={onCancel}>Hủy</Button>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  Xác thực
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function maskCard(n = "") {
  const s = n.replace(/\s+/g, "");
  if (s.length < 8) return "****";
  return s.slice(0, 4) + " **** **** " + s.slice(-4);
}

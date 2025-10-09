// components/payments/TopUpForm.jsx
import React, { useMemo, useState } from "react";
import {
  Tabs,
  Card,
  InputNumber,
  Button,
  Typography,
  Space,
  Collapse,
  Checkbox,
} from "antd";
import {
  QrcodeOutlined,
  BankOutlined,
  CreditCardOutlined,
  MobileOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import InvoiceForm from "@/components/payments/InvoiceForm";
import TransferBankInfo from "@/components/payments/TransferBankInfo";
import AtmBankPicker from "@/components/payments/AtmBankPicker";

const { Link } = Typography;

const fmtVND = (n) =>
  (n ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ";

export default function TopUpForm({
  onContinue = () => {},
  quickOptions = [
    { amount: 500_000 },
    { amount: 1_000_000 },
    { amount: 2_000_000, bonus: 37_037 },
    { amount: 3_000_000, bonus: 55_556 },
    { amount: 5_000_000, bonus: 231_481 },
    { amount: 10_000_000, bonus: 462_963 },
  ],
  minPromoHint = "Nạp từ 2.000.000 đ để được nhận khuyến mãi",
  invoiceContent, // optional override
  atmBanks = [
    // bạn thay logoSrc bằng ảnh thật của bạn
    { id: "vcb",  name: "Vietcombank",  logoSrc: "/banks/vcb.png" },
    { id: "tech", name: "Techcombank",  logoSrc: "/banks/tech.png" },
    { id: "acb",  name: "ACB",          logoSrc: "/banks/acb.png" },
    { id: "bidv", name: "BIDV",         logoSrc: "/banks/bidv.png" },
    { id: "vtb",  name: "VietinBank",   logoSrc: "/banks/vtb.png" },
    { id: "vpb",  name: "VPBank",       logoSrc: "/banks/vpb.png" },
    { id: "scb",  name: "SCB",          logoSrc: "/banks/scb.png" },
    { id: "mb",   name: "MB Bank",      logoSrc: "/banks/mb.png"  },
  ],
}) {
  const [amount, setAmount] = useState(null);
  const [method, setMethod] = useState("qr");
  const [invoiceValues, setInvoiceValues] = useState({});
  const [accepted, setAccepted] = useState(false);
  const [selectedAtmBank, setSelectedAtmBank] = useState(null);

  // Điều kiện bật nút Tiếp tục:
  // - bắt buộc đã tick đồng ý
  // - transfer: chỉ cần tick
  // - atm: phải có amount > 0 và đã chọn ngân hàng
  // - còn lại: amount > 0
  const canContinue = useMemo(() => {
    if (!accepted) return false;
    if (method === "transfer") return true;
    if (method === "atm") return (amount ?? 0) > 0 && !!selectedAtmBank;
    return (amount ?? 0) > 0;
  }, [method, amount, accepted, selectedAtmBank]);

  const tabs = [
    { key: "qr",          label: <Space><QrcodeOutlined />QR code</Space> },
    { key: "transfer",    label: <Space><BankOutlined />Chuyển khoản</Space> },
    { key: "atm",         label: <Space><CreditCardOutlined />Thẻ ATM nội địa</Space> },
    { key: "visa",        label: <Space><CreditCardOutlined />Thẻ quốc tế</Space> },
    { key: "momo",        label: <Space><MobileOutlined />Ví MoMo</Space> },
    { key: "installment", label: <Space><ShoppingOutlined />Trả góp qua thẻ tín dụng</Space> },
  ];

  const invoiceNode =
    invoiceContent ?? <InvoiceForm onChange={(vals) => setInvoiceValues(vals)} />;

  return (
    <section className="w-full">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-0">
        {/* Tabs phương thức */}
        <div className="px-4 pt-3">
          <Tabs
            activeKey={method}
            onChange={(k) => {
              setMethod(k);
              if (k !== "atm") setSelectedAtmBank(null);
            }}
            items={tabs.map((t) => ({ key: t.key, label: t.label }))}
            className="topup-tabs"
          />
        </div>

        {/* Nội dung */}
        <div className="px-4 pb-4">
          <Card
            bordered={false}
            className="bg-white rounded-xl border border-gray-100"
            bodyStyle={{ padding: 16 }}
          >
            {/* ===== Khối nhập số tiền + chọn nhanh (HIỆN CHO MỌI TAB TRỪ 'transfer') ===== */}
            {method !== "transfer" && (
              <>
                {/* Nhập số tiền */}
                <div className="mb-3">
                  <div className="text-[13px] font-medium text-gray-700 mb-1">
                    Nhập số tiền bạn muốn nạp (đ) <span className="text-red-500">*</span>
                  </div>
                  <InputNumber
                    value={amount}
                    onChange={setAmount}
                    size="large"
                    className="w-full"
                    placeholder={minPromoHint}
                    min={0}
                    step={1000}
                    formatter={(v) =>
                      `${(v || "")
                        .toString()
                        .replace(/\D/g, "")
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
                    }
                    parser={(v) => Number((v || "0").replace(/\./g, ""))}
                  />
                </div>

                {/* Chọn nhanh */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13px] text-gray-600">Hoặc chọn nhanh</div>
                  <Link className="text-red-500 text-[13px]">Xem tất cả ưu đãi</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {quickOptions.map((opt, i) => {
                    const active = amount === opt.amount;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAmount(opt.amount)}
                        className={`rounded-xl border text-left p-3 transition ${
                          active
                            ? "border-red-400 ring-2 ring-red-100"
                            : "border-gray-200 hover:border-gray-300"
                        } bg-white`}
                      >
                        <div className="font-semibold">{fmtVND(opt.amount)}</div>
                        {opt.bonus ? (
                          <div className="text-[12px] mt-1">
                            Tặng:{" "}
                            <span className="text-green-600 font-semibold">
                              {fmtVND(opt.bonus)}
                            </span>
                          </div>
                        ) : (
                          <div className="h-[18px]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ===== Panel riêng theo tab ===== */}
            {method === "transfer" && (
              <div className="mt-1">
                <TransferBankInfo
                  bank={{
                    name: "Vietcombank",
                    subtitle: "Ngân hàng TMCP Ngoại thương Việt Nam",
                    color: "#8b1010",
                  }}
                  accountNumber="BDSVN047064126"
                  recipientName="CTCP PROPERTYGURU VIETNAM - user4706412"
                  onCopy={async (val) => {
                    try { await navigator.clipboard.writeText(val); } catch {}
                  }}
                  tiers={[
                    { label: "Dưới 2 triệu", note: "+0% giá trị" },
                    { label: "Từ 2 triệu - dưới 4 triệu", note: "+2% giá trị" },
                    { label: "Từ 4 triệu - dưới 12 triệu", note: "+5% giá trị" },
                  ]}
                />
              </div>
            )}

            {method === "atm" && (
              <div className="mt-4">
                <AtmBankPicker
                  banks={atmBanks}
                  selectedId={selectedAtmBank}
                  onChange={setSelectedAtmBank}
                />
              </div>
            )}

            {/* Xuất hóa đơn */}
            <div className="mt-4">
              <Collapse
                bordered={false}
                expandIconPosition="end"
                items={[
                  {
                    key: "invoice",
                    label: <span className="font-medium">Xuất hóa đơn cho giao dịch</span>,
                    children: <div className="pt-1">{invoiceNode}</div>,
                  },
                ]}
                className="[&_.ant-collapse-header]:!px-3 [&_.ant-collapse-content-box]:!px-3 bg-gray-50 rounded-xl"
              />
            </div>

            {/* Thời hạn sử dụng tiền + checkbox đồng ý */}
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/60 p-4">
              <div className="text-[14px] text-gray-700">
                Thời hạn sử dụng tiền trong tài khoản trên Batdongsan.com.vn như sau:
              </div>
              <ul className="list-disc pl-5 mt-1 text-[14px]">
                <li>
                  <span className="font-semibold">Tài khoản chính:</span> 12 tháng
                </li>
                <li>
                  <span className="font-semibold">Tài khoản khuyến mãi:</span> Tối đa 6 tháng
                </li>
              </ul>
              <div className="text-[14px] mt-1">
                Thông tin chi tiết xem tại{" "}
                <a href="#" className="text-red-500 hover:underline">
                  Thời hạn sử dụng tiền và quy định về tiền trong tài khoản
                </a>
              </div>

              <div className="mt-3">
                <Checkbox
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                >
                  Tôi đã đọc và đồng ý
                </Checkbox>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-[14px]">
              Hotline <a className="text-red-500 font-semibold">1900 1881</a>
            </div>
            <Button
              type="primary"
              danger
              size="large"
              disabled={!canContinue}
              onClick={() =>
                onContinue(amount, method, invoiceValues, { selectedAtmBank })
              }
              className="rounded-md px-6"
            >
              Tiếp tục
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

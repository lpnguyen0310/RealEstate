import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MockCardForm from "../../components/dashboard/purchagemangement/Checkout/CheckoutForm";

export default function CheckoutPage() {
    const [sp] = useSearchParams();
    const orderId = sp.get("orderId") || "N/A";
    const amount = useMemo(() => {
        const n = Number(sp.get("amount") || 0);
        return Number.isFinite(n) ? n : 0;
    }, [sp]);

    const [method, setMethod] = useState("atm");

    return (
        <div className="bg-[#f5f8ff]">
            {/* Container: giữ nguyên, không thêm px/py */}
            <div
                className="
          max-w-[1400px]
          grid grid-cols-12 gap-6
          lg:grid-cols-[300px_minmax(0,1fr)_340px]
        "
            >
                {/* LEFT: phương thức (STICKY, top-0) */}
                <div className="col-span-12 lg:col-auto lg:sticky lg:top-0 self-start">
                    <div className="bg-white rounded-2xl border border-[#e5ecfb] shadow-sm overflow-hidden">
                        <h3 className="px-4 py-3 font-semibold text-[#0f2f63] border-b border-[#eaeef8]">
                            Chọn phương thức thanh toán
                        </h3>
                        <div className="flex flex-col divide-y divide-[#f2f5fb]">
                            {[
                                { id: "atm", label: "Thẻ ATM", icon: "💳", logo: "/images/napas.svg" },
                                { id: "credit", label: "Thẻ tín dụng", icon: "💰", logo: "/images/visa.svg" },
                                { id: "wallet", label: "Ví điện tử", icon: "💸", logo: "/images/momo.svg" },
                                { id: "bank", label: "Chuyển khoản", icon: "🏦", logo: "/images/vietqr.svg" },
                                { id: "qrpay", label: "QR Pay", icon: "🔲", logo: "/images/vnpay.svg" },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMethod(m.id)}
                                    className={`flex items-center justify-between px-4 py-3 text-left transition ${method === m.id
                                            ? "bg-[#eef4ff] text-[#1a3b7c] font-medium"
                                            : "hover:bg-[#f7faff] text-[#637089]"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span>{m.icon}</span>
                                        {m.label}
                                    </div>
                                    {m.logo && (
                                        <img src={m.logo} alt="" className="h-5 object-contain opacity-80" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MIDDLE: form */}
                <div className="col-span-12 lg:col-auto self-start">
                    <div className="rounded-2xl border border-[#e5ecfb] bg-white/80 shadow-md backdrop-blur p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="h-8 w-8 rounded-lg bg-[#0f2f63] text-white flex items-center justify-center text-lg">
                                💳
                            </div>
                            <h2 className="text-[20px] font-semibold text-[#0f2f63]">
                                {method === "atm" && "Thanh toán bằng Thẻ ATM (Napas)"}
                                {method === "credit" && "Thanh toán bằng Thẻ tín dụng / ghi nợ"}
                                {method === "wallet" && "Thanh toán qua Ví điện tử"}
                                {method === "bank" && "Chuyển khoản ngân hàng"}
                                {method === "qrpay" && "Thanh toán QR Code"}
                            </h2>
                        </div>

                        {(method === "atm" || method === "credit") ? (
                            <MockCardForm orderId={orderId} amount={amount} />
                        ) : (
                            <div className="p-6 flex flex-col items-center justify-center text-[#637089]">
                                {method === "wallet" && (
                                    <>
                                        <img src="/images/momo.svg" className="h-10 mb-2" />
                                        <p>Thanh toán bằng ví MoMo/ZaloPay (Mock)</p>
                                    </>
                                )}
                                {method === "bank" && (
                                    <>
                                        <img src="/images/vietqr.svg" className="h-12 mb-2" />
                                        <p>Quét mã QR hoặc chuyển khoản thủ công</p>
                                    </>
                                )}
                                {method === "qrpay" && (
                                    <>
                                        <img src="/images/vnpay.svg" className="h-12 mb-2" />
                                        <p>Quét mã VNPAY QR để hoàn tất thanh toán</p>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex items-center gap-2 text-[12px] text-[#6b7a90]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#eef4ff]">
                                🔒
                            </span>
                            Bảo mật PCI DSS – Không lưu thông tin thẻ.
                        </div>
                    </div>
                </div>

                {/* RIGHT: đơn hàng (STICKY, top-0) */}
                <div className="col-span-12 lg:col-auto lg:sticky lg:top-0 self-start">
                    <div className="rounded-2xl border border-[#e5ecfb] bg-[#fefefe] shadow-md p-5">
                        <h3 className="text-[17px] font-semibold text-[#0f2f63] mb-3">
                            Thông tin đơn hàng
                        </h3>

                        <div className="text-sm text-[#637089] mb-1">Mã đơn hàng</div>
                        <div className="font-mono text-[#0f2f63] text-base">{orderId}</div>

                        <div className="my-3 border-t border-dashed border-[#e3e9f6]" />

                        <div className="text-sm text-[#637089] mb-1">Giá trị thanh toán</div>
                        <div className="text-[22px] font-bold text-[#d43f3a]">
                            {amount.toLocaleString("vi-VN")} VNĐ
                        </div>

                        <div className="mt-5 rounded-xl bg-[#fff5f5] border border-[#ffd8d8] p-3 text-[#d43f3a] text-sm">
                            ⚠️ Vui lòng không đóng cửa sổ này trong quá trình nhập OTP.
                        </div>

                        <div className="mt-5 text-xs text-[#6b7a90]">
                            Sau khi xác thực, bạn sẽ được chuyển lại trang mua hàng.
                        </div>

                        <div className="mt-6 flex justify-center gap-2">
                            <img src="/images/visa.svg" className="h-5" />
                            <img src="/images/mastercard.svg" className="h-5" />
                            <img src="/images/napas.svg" className="h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

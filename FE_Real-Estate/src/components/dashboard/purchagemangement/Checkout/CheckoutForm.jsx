import { useMemo, useState } from "react";

/* Helpers */
const digits = (s = "") => s.replace(/\D+/g, "");
const luhn = (num) => {
    const s = digits(num);
    let sum = 0, dbl = false;
    for (let i = s.length - 1; i >= 0; i--) {
        let d = +s[i];
        if (dbl) { d *= 2; if (d > 9) d -= 9; }
        sum += d; dbl = !dbl;
    }
    return s.length >= 12 && sum % 10 === 0;
};
const fmtCard = v => digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
const fmtMMYY = v => {
    const s = digits(v).slice(0, 4);
    return s.length <= 2 ? s : s.slice(0, 2) + "/" + s.slice(2);
};
const validMMYY = (mmYY) => {
    if (!/^\d{2}\/\d{2}$/.test(mmYY)) return false;
    const [mm, yy] = mmYY.split("/").map(Number);
    if (mm < 1 || mm > 12) return false;
    const now = new Date(), cy = now.getFullYear() % 100, cm = now.getMonth() + 1;
    return yy > cy || (yy === cy && mm >= cm);
};

export default function MockCardForm({ orderId, amount }) {
    const [name, setName] = useState("");
    const [card, setCard] = useState("");
    const [exp, setExp] = useState("");
    const [cvc, setCvc] = useState("");
    const [agree, setAgree] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState("");

    const ok = useMemo(() => (
        name.trim().length >= 2 && luhn(card) && validMMYY(exp) && /^\d{3,4}$/.test(cvc) && agree && !processing
    ), [name, card, exp, cvc, agree, processing]);

    const submit = async (e) => {
        e.preventDefault();
        if (!ok) return;
        setToast("");
        setProcessing(true);
        await new Promise(r => setTimeout(r, 1000)); // mock
        setProcessing(false);
        setToast(`Thanh toán (mock) thành công! #${orderId} • ${amount.toLocaleString("vi-VN")} VNĐ`);
    };

    const brandHint = useMemo(() => {
        const first = digits(card)[0];
        if (!first) return "Nhập số thẻ 16–19 số";
        return ({
            "4": "Visa",
            "5": "Mastercard",
            "3": "Amex/JCB"
        })[first] || "Thẻ nội địa / khác";
    }, [card]);

    const last4 = useMemo(() => {
        const s = digits(card);
        return s.length >= 4 ? s.slice(-4) : "••••";
    }, [card]);

    return (
        <form onSubmit={submit} className="grid grid-cols-12 gap-6">
            {/* Card preview */}
            <div className="col-span-12">
                <div className="relative overflow-hidden rounded-2xl border border-[#e5ecfb] bg-gradient-to-br from-[#1a3b7c] via-[#274a9c] to-[#1a3b7c] text-white p-5 shadow-[0_14px_32px_rgba(22,54,109,0.25)]">
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <div className="flex items-center justify-between">
                        <div className="text-sm opacity-80">{brandHint}</div>
                        <div className="text-xs opacity-80">MOCK • PCI SAFE</div>
                    </div>
                    <div className="mt-5 tracking-widest text-xl font-medium">
                        {card || "1234 5678 9012 3456"}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="opacity-90">
                            <div className="opacity-70">Card Holder</div>
                            <div className="font-medium">{name || "NGUYEN VAN A"}</div>
                        </div>
                        <div className="opacity-90 text-right">
                            <div className="opacity-70">Expires</div>
                            <div className="font-medium">{exp || "MM/YY"}</div>
                        </div>
                    </div>
                    <div className="mt-4 text-xs opacity-80">•••• •••• •••• {last4}</div>
                </div>
            </div>

            {/* Form fields */}
            <div className="col-span-12">
                <label className="block text-sm text-[#637089] mb-1">Tên chủ thẻ</label>
                <input
                    className="w-full h-12 rounded-xl border border-[#dbe4f6] bg-white px-3 outline-none ring-0 focus:border-[#2e62ff] focus:shadow-[0_0_0_4px_rgba(46,98,255,0.10)] transition"
                    placeholder="NGUYEN VAN A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="col-span-12">
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm text-[#637089]">Số thẻ</label>
                    <span className="text-xs text-[#8a97b3]">{brandHint}</span>
                </div>
                <input
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="w-full h-12 rounded-xl border border-[#dbe4f6] bg-white px-3 outline-none focus:border-[#2e62ff] focus:shadow-[0_0_0_4px_rgba(46,98,255,0.10)] transition"
                    placeholder="1234 5678 9012 3456"
                    value={card}
                    onChange={(e) => setCard(fmtCard(e.target.value))}
                />
                {!luhn(card) && digits(card).length > 0 && (
                    <p className="mt-1 text-xs text-[#d43f3a]">Số thẻ chưa hợp lệ (kiểm tra lại).</p>
                )}
            </div>

            <div className="col-span-6">
                <label className="block text-sm text-[#637089] mb-1">MM/YY</label>
                <input
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    className="w-full h-12 rounded-xl border border-[#dbe4f6] bg-white px-3 outline-none focus:border-[#2e62ff] focus:shadow-[0_0_0_4px_rgba(46,98,255,0.10)] transition"
                    placeholder="MM/YY"
                    value={exp}
                    onChange={(e) => setExp(fmtMMYY(e.target.value))}
                />
                {exp && !validMMYY(exp) && (
                    <p className="mt-1 text-xs text-[#d43f3a]">Ngày hết hạn không hợp lệ.</p>
                )}
            </div>

            <div className="col-span-6">
                <label className="block text-sm text-[#637089] mb-1">CVC</label>
                <input
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className="w-full h-12 rounded-xl border border-[#dbe4f6] bg-white px-3 outline-none focus:border-[#2e62ff] focus:shadow-[0_0_0_4px_rgba(46,98,255,0.10)] transition"
                    placeholder="CVC"
                    value={cvc}
                    onChange={(e) => setCvc(digits(e.target.value).slice(0, 4))}
                />
                {cvc && !/^\d{3,4}$/.test(cvc) && (
                    <p className="mt-1 text-xs text-[#d43f3a]">CVC phải có 3–4 số.</p>
                )}
            </div>

            <div className="col-span-12">
                <label className="flex items-start gap-2 text-sm text-[#6B7A90]">
                    <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-0.5"
                    />
                    Tôi đồng ý với <a className="text-[#2e62ff] hover:underline" href="#">điều khoản</a> & <a className="text-[#2e62ff] hover:underline" href="#">chính sách</a>.
                </label>
            </div>

            {toast && (
                <div className="col-span-12">
                    <div className="rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3">
                        {toast}
                    </div>
                </div>
            )}

            <div className="col-span-12">
                <button
                    type="submit"
                    disabled={!ok}
                    className={`w-full h-12 rounded-xl text-white font-semibold transition ${ok
                            ? "bg-[#0f2f63] hover:bg-[#0c2550] shadow-[0_10px_20px_rgba(13,47,97,0.18)]"
                            : "bg-[#9fb0cc] cursor-not-allowed"
                        }`}
                >
                    {processing ? "Đang xử lý…" : `Thanh toán ${amount.toLocaleString("vi-VN")} VNĐ`}
                </button>
            </div>
        </form>
    );
}

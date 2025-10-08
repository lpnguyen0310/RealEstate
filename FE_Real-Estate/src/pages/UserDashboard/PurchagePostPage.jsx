import { useMemo, useState } from "react";
import { SINGLE, COMBOS, ALL_ITEMS } from "@/data/PurchagePostData/PurchageData";
import { fmtVND as fmt, calcTotal } from "@/utils/countToToal";
import { SingleCard, ComboCard, PaymentCard } from "../../components/dashboard/purchagemangement";

export default function PurchagePostPage() {
    const [qty, setQty] = useState({}); // { id: number }
    const setItem = (id, v) => setQty((s) => ({ ...s, [id]: v }));
    const total = useMemo(() => calcTotal(qty, SINGLE, COMBOS), [qty]);

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* LEFT */}
            <div className="col-span-8">
                <div className="bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] p-6">
                    {/* --- MUA TIN LẺ --- */}
                    <h2 className="font-semibold text-[#1a3b7c] text-[16px] mb-4">Mua tin lẻ</h2>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {SINGLE.map((it) => (
                            <SingleCard
                                key={it.id}
                                item={it}
                                value={qty[it.id] || 0}
                                onChange={(v) => setItem(it.id, v)}
                            />
                        ))}
                    </div>

                    {/* --- MUA THEO COMBO --- */}
                    <h2 className="font-semibold text-[#1a3b7c] text-[16px] mb-4">Mua theo Combo</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {COMBOS.map((it) => (
                            <ComboCard
                                key={it.id}
                                item={it}
                                value={qty[it.id] || 0}
                                onChange={(v) => setItem(it.id, v)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: THANH TOÁN */}
            <div className="col-span-4">
                <PaymentCard
                    qty={qty}
                    allItems={ALL_ITEMS}
                    total={total}
                    fmt={fmt}
                    onPay={() => console.log("pay click", { qty, total })}
                />
            </div>
        </div>
    );
}

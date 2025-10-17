// src/pages/UserDashboard/PurchagePostPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadPricing } from "@/store/pricingSlice";
import { fmtVND as fmt, calcTotal } from "@/utils/countToToal";
import { SingleCard, ComboCard, PaymentCard } from "@/components/dashboard/purchagemangement";

export default function PurchagePostPage() {
  const dispatch = useDispatch();
  const { SINGLE, COMBOS, ALL_ITEMS, loading, error } = useSelector((s) => s.pricing);

  const [qty, setQty] = useState({});
  const setItem = (id, v) => setQty((s) => ({ ...s, [id]: v }));

  useEffect(() => { dispatch(loadPricing()); }, [dispatch]);

  const total = useMemo(() => calcTotal(qty, SINGLE, COMBOS), [qty, SINGLE, COMBOS]);

  if (loading) return <div className="p-6">Đang tải bảng giá…</div>;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8">
        <div className="bg-white rounded-2xl border border-[#e8edf6] shadow-[0_10px_30px_rgba(13,47,97,0.06)] p-6">
          <h2 className="font-semibold text-[#1a3b7c] text-[16px] mb-4">Mua tin lẻ</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {SINGLE.map((it) => (
              <SingleCard key={it.id} item={it} value={qty[it.id] || 0} onChange={(v) => setItem(it.id, v)} />
            ))}
          </div>

          <h2 className="font-semibold text-[#1a3b7c] text-[16px] mb-4">Mua theo Combo</h2>
          <div className="grid grid-cols-3 gap-4">
            {COMBOS.map((it) => (
              <ComboCard key={it.id} item={it} value={qty[it.id] || 0} onChange={(v) => setItem(it.id, v)} />
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-4">
        <PaymentCard qty={qty} allItems={ALL_ITEMS} total={total} fmt={fmt} onPay={() => console.log("pay", { qty, total })} />
        {error && <div className="mt-3 text-xs text-amber-600">{error}</div>}
      </div>
    </div>
  );
}

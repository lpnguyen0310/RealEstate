// src/components/dashboard/dashboardoverview/UserHeader.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserInventory } from "@/store/inventorySlice";
import { useNavigate } from "react-router-dom";

export default function UserHeader({ user }) {
  const dispatch = useDispatch();
  const { items: inventory, loading } = useSelector((state) => state.inventory);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchUserInventory());
  }, [dispatch]);

  const getQuantity = (itemType) => {
    if (loading) return "...";
    const item = inventory?.find((i) => i.itemType === itemType);
    return item ? item.quantity : 0;
  };

  return (
    <div className="rounded-2xl border border-[#eef2f8] shadow-[0_8px_24px_rgba(13,47,97,0.06)] bg-white overflow-hidden">
      {/* Banner */}
      <div className="relative h-20 sm:h-24 bg-gradient-to-r from-[#e4548c] via-[#b36ad6] to-[#5db9f0] flex items-end justify-between px-4 sm:px-6 pb-2">
        {/* Avatar nổi */}
        <div className="absolute left-4 sm:left-6 bottom-[-28px] sm:bottom-[-36px]">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#ee3e6b] grid place-items-center text-white text-3xl sm:text-5xl font-semibold border-4 border-white shadow-[0_10px_24px_rgba(13,47,97,0.12)]">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Tên người dùng */}
        <div className="pl-24 sm:pl-28 mb-[-8px] sm:mb-[-10px] pr-2">
          <h2 className="text-black text-[18px] sm:text-[25px] font-black leading-tight line-clamp-1">
            {user.name}
          </h2>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 pb-1 pr-2">
          <span className="inline-flex items-center rounded-md bg-[#ff7a45] text-white text-[11px] sm:text-[12px] px-2 py-0.5 sm:px-2.5 font-medium shadow-sm">
            {getQuantity("PREMIUM")} PREMIUM
          </span>
          <span className="inline-flex items-center rounded-md bg-[#faad14] text-white text-[11px] sm:text-[12px] px-2 py-0.5 sm:px-2.5 font-medium shadow-sm">
            {getQuantity("VIP")} VIP
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 sm:px-6 pt-2 pb-3">
        <div className="pl-24 sm:pl-28 pr-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Trái: email + sđt */}
          <div className="text-[#4B4B5A] leading-tight">
            <p className="text-[13px] sm:text-[14px] opacity-90">{user.email}</p>
            <p className="text-[13px] sm:text-[14px] opacity-90">{user.phone}</p>
          </div>

          {/* Phải: số dư + nút nạp tiền */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-[12px] sm:text-[13px] text-gray-500">Số dư:</span>
              <span className="text-[16px] sm:text-[18px] font-bold text-[#1c396a]">
                {(user.balance ?? 0).toLocaleString("vi-VN")}
              </span>
              <span className="text-[12px] sm:text-[14px] text-[#1c396a]/70">đ</span>
            </div>

            <button
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#5db9f0] to-[#b36ad6] text-white text-[12px] sm:text-[13px] font-medium shadow-sm hover:opacity-90 active:translate-y-[1px] transition"
              onClick={() => navigate("/dashboard/account?action=topup")}
            >
              Nạp tiền
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

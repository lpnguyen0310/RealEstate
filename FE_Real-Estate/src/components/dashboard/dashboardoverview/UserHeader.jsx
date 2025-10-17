import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserInventory } from '@/store/inventorySlice';

export default function UserHeader({ user }) {
  const dispatch = useDispatch();
  const { items: inventory, loading } = useSelector((state) => state.inventory);

  useEffect(() => {
    dispatch(fetchUserInventory());
  }, [dispatch]);

  // Hàm trợ giúp để tìm số lượng của một loại vật phẩm
  const getQuantity = (itemType) => {
    if (loading) return '...';
    const item = inventory.find(i => i.itemType === itemType);
    return item ? item.quantity : 0;
  };

  return (
    <div className="rounded-2xl border border-[#eef2f8] shadow-[0_8px_24px_rgba(13,47,97,0.06)] bg-white overflow-hidden">
      {/* === Banner (phần màu) === */}
      <div className="relative h-24 bg-gradient-to-r from-[#e4548c] via-[#b36ad6] to-[#5db9f0] flex items-end justify-between px-6 pb-2">
        {/* Avatar chồng nhẹ lên ranh giới */}
        <div className="absolute left-6 bottom-[-36px]">
          <div className="w-24 h-24 rounded-2xl bg-[#ee3e6b] grid place-items-center text-white text-5xl font-semibold
                           border-4 border-white shadow-[0_10px_24px_rgba(13,47,97,0.12)]">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Tên người dùng */}
        <div className="pl-28 mb-[-10px]">
          <h2 className="text-black text-[25px] font-black leading-none">{user.name}</h2>
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2 pb-1">
          <span className="inline-flex items-center rounded-md bg-[#ff7a45] text-white text-[12px] px-2.5 py-0.5 font-medium shadow-sm">
            {getQuantity('PREMIUM')} PREMIUM
          </span>
          <span className="inline-flex items-center rounded-md bg-[#faad14] text-white text-[12px] px-2.5 py-0.5 font-medium shadow-sm">
            {getQuantity('VIP')} VIP
          </span>
        </div>
      </div>

      {/* === Phần trắng (email + sđt + số dư + nạp tiền) === */}
      <div className="px-6 pt-2 pb-3">
        <div className="pl-28 pr-2 flex items-center justify-between">
          {/* Trái: email + sđt */}
          <div className="text-[#4B4B5A] leading-tight">
            <p className="text-[14px] opacity-90">{user.email}</p>
            <p className="text-[14px] opacity-90">{user.phone}</p>
          </div>

          {/* Phải: số dư + nút nạp tiền */}
          <div className="flex items-center gap-4 ">
            {/* Số dư hiển thị ngang */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-500">Số dư tài khoản:</span>
              <span className="text-[18px] font-bold text-[#1c396a]">
                {(user.balance ?? 0).toLocaleString("vi-VN")}
              </span>
              <span className="text-[14px] text-[#1c396a]/70">đ</span>
            </div>

            {/* Nút nạp tiền */}
            <button
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#5db9f0] to-[#b36ad6]
                       text-white text-[13px] font-medium shadow-sm hover:opacity-90
                       active:translate-y-[1px] transition"
            >
              Nạp tiền
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from "react";
// BỎ: Không cần useSelector và createSelector ở component con này
// import { useSelector } from "react-redux";
// import { createSelector } from "@reduxjs/toolkit";

// BỎ: Toàn bộ logic selector này đã được thực hiện ở DashboardOverview
// const selectMyList = (s) => s.property?.myList ?? [];
// const selectPostTypeSummary = createSelector(selectMyList, (posts) => { ... });


// BƯỚC 1: Nhận `onLeadsClick` từ props (cùng với `sell` và `rent`)
export default function PostTypeSummary({ sell, rent, onLeadsClick }) {
  
  // BỎ: Dùng props `sell` và `rent` được truyền vào trực tiếp
  // const auto = useSelector(selectPostTypeSummary);
  // const sellData = Object.keys(sell).length ? sell : auto.sell;
  // const rentData = Object.keys(rent).length ? rent : auto.rent;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* BƯỚC 2: Truyền props 'type' và 'onLeadsClick' xuống SummaryCard */}
      <SummaryCard 
        title="Tin đăng bán" 
        data={sell} // Dùng prop 'sell'
        type="sell" // Thêm 'type'
        onLeadsClick={onLeadsClick} // Truyền 'onLeadsClick'
      />
      <SummaryCard 
        title="Tin đăng cho thuê" 
        data={rent} // Dùng prop 'rent'
        type="rent" // Thêm 'type'
        onLeadsClick={onLeadsClick} // Truyền 'onLeadsClick'
      />
    </div>
  );
}

// BƯỚC 3: Sửa SummaryCard để nhận 'type' và 'onLeadsClick'
function SummaryCard({ title, data, type, onLeadsClick }) {
  const d = { views: 0, interactions: 0, potential: 0, ...data };

  // Helper để gọi onLeadsClick một cách an toàn
  const handleClick = (key) => {
    // Chỉ gọi khi click đúng dòng "Khách tiềm năng" VÀ có truyền hàm
    if (key === 'potential' && onLeadsClick) {
        onLeadsClick(type); // Gọi hàm của cha với đúng type ('sell' hoặc 'rent')
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 border border-[#e8edf6] shadow-[0_8px_24px_rgba(13,47,97,0.06)]">
      <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1c396a] mb-3">{title}</h3>
      <div className="border-t-2 border-[#3b7cff]/60 mb-3" />
      <div className="space-y-2 sm:space-y-3">
        <Row label="Lượt xem" value={d.views} />
        <Row label="Lượt tương tác" value={d.interactions} />
        
        {/* BƯỚC 4: Làm cho dòng này có thể click được */}
        <Row 
            label="Khách tiềm năng" 
            value={d.potential} 
            isClickable={!!onLeadsClick} // Chỉ cho phép click nếu có hàm
            onClick={() => handleClick('potential')}
        />
      </div>
    </div>
  );
}

// BƯỚC 5: Sửa Row để nhận 'isClickable' và 'onClick'
function Row({ label, value, isClickable = false, onClick }) {
  return (
    <div 
      className={[
        "flex items-center justify-between",
        // Thêm style khi có thể click
        isClickable ? "cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-md transition-all" : "" 
      ].join(" ")}
      onClick={isClickable ? onClick : undefined} // Gán onClick
    >
      <span className="text-[13px] sm:text-[14px] text-[#3c4a5d]">{label}</span>
      <span className="text-[13px] sm:text-[14px] text-[#3c4a5d] font-semibold">
        {Number(value || 0).toLocaleString("vi-VN")}
      </span>
    </div>
  );
}
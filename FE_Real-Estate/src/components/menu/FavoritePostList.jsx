// src/components/FavoritePostList.jsx
import React from "react";
import { Dropdown, Tooltip, Badge } from "antd";
import {
  HeartOutlined,
  EnvironmentOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectList, selectIds } from "@/store/favoriteSlice";
import { formatVNDShort } from "@/utils/money";

function money(v) {
  if (v === null || v === undefined) return "Liên hệ";
  try {
    const num = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(num)) return "Liên hệ";
    return num.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  } catch {
    return "Liên hệ";
  }
}

export default function FavoritePostList({ width = 340, iconSize = 25 }) {
  const nav = useNavigate();

  // Lấy trực tiếp từ Redux store (không dùng hook custom)
  const savedPosts = useSelector(selectList); // [{ id, title, thumb, href, price, priceDisplay, displayAddress, savedAgo, ...}]
  const savedCount = useSelector(selectIds).length;

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottom"
      arrow={{ pointAtCenter: true }}
      getPopupContainer={() => document.body}
      align={{ offset: [0, 10] }}
      overlayClassName="bds-saved-dropdown"
      zIndex={120}
      popupRender={() => (
        <div
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{ width }}
        >
          <div className="animate-fade-up">
            {/* Header */}
            <div className="text-center font-semibold text-[15px] text-gray-800 py-3 border-b border-gray-100">
              Tin đăng đã lưu
            </div>

            {/* List */}
            <div className="max-h-[300px] overflow-auto">
              {savedPosts.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 text-[14px]">
                  Chưa có tin nào được lưu.
                </div>
              ) : (
                savedPosts.map((p) => {
                  const addr = p.displayAddress || p.address || "";
                  const priceText = p.priceDisplay || formatVNDShort(p.price);

                  return (
                    <a
                      key={p.id}
                      href={p.href || "#"}
                      onClick={(e) => {
                        e.preventDefault();
                        if (p.href) nav(p.href);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition no-underline"
                    >
                      <img
                        src={p.thumb}
                        alt="thumb"
                        className="w-[70px] h-[50px] object-cover rounded-md border"
                        onError={(e) =>
                        (e.currentTarget.src =
                          "https://picsum.photos/140/100")
                        }
                      />

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="text-[14px] text-gray-800 font-medium truncate">
                          {p.title}
                        </div>

                        {/* Price + Address */}
                        <div className="mt-0.5 flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#d6402c] whitespace-nowrap">
                            <DollarCircleOutlined />
                            <span>{priceText}</span>
                          </div>

                          {addr && (
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600 min-w-0">
                              <EnvironmentOutlined className="text-gray-500" />
                              <span className="truncate" title={addr}>
                                {addr}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Saved time */}
                        <div className="text-[12px] text-gray-500 mt-0.5">
                          {p.savedAgo}
                        </div>
                      </div>
                    </a>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 text-center py-2">
              <a
                href="/tin-da-luu"
                onClick={(e) => {
                  e.preventDefault();
                  nav("/tin-da-luu");
                }}
                className="text-[#d6402c] text-[14px] font-medium hover:underline"
              >
                Xem tất cả →
              </a>
            </div>
          </div>
        </div>
      )}
    >
      <span className="inline-block align-middle">
        <Tooltip
          title="Danh sách tin đã lưu"
          placement="bottom"
          color="#000"
          overlayInnerStyle={{ fontSize: 13, fontWeight: 600, padding: "6px 10px" }}
          arrow={{ pointAtCenter: true }}
          overlayClassName="bds-tooltip"
          mouseEnterDelay={0.06}
          mouseLeaveDelay={0.12}
          zIndex={100}
        >
          <Badge count={savedCount} size="small" offset={[-2, 6]}>
            <HeartOutlined
              className="cursor-pointer text-gray-800 hover:text-[#d6402c]"
              style={{ fontSize: iconSize }}
            />
          </Badge>
        </Tooltip>
      </span>
    </Dropdown>
  );
}

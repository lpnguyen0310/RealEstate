// src/components/sections/ForYouList.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import { fetchPropertiesThunk } from "@/store/propertySlice";

export default function ForYouList() {
    const dispatch = useDispatch();
    const { forYouList, forYouLoading, forYouError, forYouSource } = useSelector((s) => s.property);
    const authUser = useSelector((s) => s.auth.user);
    const userId = authUser?.id || authUser?.userId || null;

    const INITIAL = 8;
    const [expanded, setExpanded] = useState(false);

    // Cờ đánh dấu đã từng fetch popular để tránh spam khi userId chưa có
    const [didFetchPopular, setDidFetchPopular] = useState(false);
    // Cờ đánh dấu đã fetch forYou với userId hiện tại
    const [fetchedForUserId, setFetchedForUserId] = useState(null);

    // Quyết định KHI NÀO gọi API
    useEffect(() => {
        // 1) Nếu có userId → gọi forYou (limit dư để mở rộng)
        if (userId && fetchedForUserId !== userId) {
            dispatch(fetchPropertiesThunk({ type: "forYou", userId, limit: 24 }));
            setFetchedForUserId(userId);
            return;
        }

        // 2) Nếu CHƯA có userId (chưa đăng nhập/chưa hydrate) → fallback popular (chỉ 1 lần)
        if (!userId && !didFetchPopular) {
            dispatch(fetchPropertiesThunk({ type: "popular", limit: 8 }));
            setDidFetchPopular(true);
        }
    }, [dispatch, userId, didFetchPopular, fetchedForUserId]);

    const visible = useMemo(
        () => (expanded ? forYouList : forYouList.slice(0, INITIAL)),
        [expanded, forYouList]
    );

    if (forYouLoading && (!forYouList || forYouList.length === 0)) {
        return (
            <section className="mt-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-[#1b2a57]">Bất động sản dành cho tôi</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px]">
                    {Array.from({ length: INITIAL }).map((_, i) => (
                        <div key={i} className="rounded-[20px] border bg-white p-4 animate-pulse">
                            <div className="h-[220px] w-full bg-gray-200 rounded-[16px]" />
                            <div className="mt-4 h-5 w-3/4 bg-gray-200 rounded" />
                            <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
                            <div className="mt-3 h-4 w-2/3 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (forYouError && (!forYouList || forYouList.length === 0)) {
        return (
            <section className="mt-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-[#1b2a57]">Bất động sản dành cho tôi</h2>
                </div>
                <div className="text-red-500 text-center">Lỗi khi tải dữ liệu: {forYouError}</div>
            </section>
        );
    }

    if (!forYouList || forYouList.length === 0) return null;

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#1b2a57]">Bất động sản dành cho tôi</h2>
                    {forYouSource && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Nguồn: {forYouSource === "personalized" ? "Cá nhân hóa" : "Phổ biến"}
                        </span>
                    )}
                </div>
                {/* Dùng Link để không reload (giữ Redux, giữ user) */}
                <Link to="/goi-y-cho-ban" className="text-[#1f5fbf] font-semibold hover:underline">
                    Xem tất cả
                </Link>
            </div>

            {/* Grid card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1">
                {visible.map((p) => (
                    <Link key={p.id} to={`/real-estate/${p.id}`} className="block group">
                        <PropertyCard item={p} />
                    </Link>
                ))}
            </div>

            {/* Nút Mở rộng / Thu gọn */}
            {forYouList.length > INITIAL && (
                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 shadow-sm"
                    >
                        {expanded ? "Thu gọn" : "Mở rộng"} {expanded ? <UpOutlined /> : <DownOutlined />}
                    </button>
                </div>
            )}
        </section>
    );
}

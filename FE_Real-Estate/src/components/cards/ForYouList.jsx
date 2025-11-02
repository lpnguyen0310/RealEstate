// src/components/ForYouList.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import PropertyCardSkeleton from "./skeletion/PropertyCardSkeleton";
import { fetchPropertiesThunk } from "@/store/propertySlice";

const MIN_SKELETON_MS = 2000; // Giữ skeleton tối thiểu 2s

export default function ForYouList() {
    const dispatch = useDispatch();

    // --- Redux state ---
    const { forYouList, forYouError, forYouSource, forYouLoading } = useSelector(
        (s) => s.property
    );
    const authUser = useSelector((s) => s.auth.user);
    const userId = authUser?.id || authUser?.userId || null;

    // --- UI State ---
    const INITIAL = 8;
    const [expanded, setExpanded] = useState(false);
    const [fetchedForUserId, setFetchedForUserId] = useState(null);
    const [minDelayDone, setMinDelayDone] = useState(false);
    const timerRef = useRef(null);

    // Giữ skeleton ít nhất MIN_SKELETON_MS
    useEffect(() => {
        timerRef.current = setTimeout(() => setMinDelayDone(true), MIN_SKELETON_MS);
        return () => clearTimeout(timerRef.current);
    }, []);

    // Gọi API khi có userId
    useEffect(() => {
        if (userId && fetchedForUserId !== userId) {
            dispatch(fetchPropertiesThunk({ type: "forYou", userId, limit: 24 }));
            setFetchedForUserId(userId);
        }
    }, [dispatch, userId, fetchedForUserId]);

    // --- Xử lý hiển thị ---
    const hasData = Array.isArray(forYouList) && forYouList.length > 0;
    const showSkeleton =
        forYouLoading || (!hasData && !forYouError && !minDelayDone);

    const visibleList = useMemo(
        () => (expanded ? forYouList : forYouList.slice(0, INITIAL)),
        [expanded, forYouList]
    );

    // --- Nếu chưa đăng nhập ---
    if (!userId) {
        return (
            <section className="mt-10 text-center text-gray-600">
                <h2 className="text-2xl font-bold text-[#1b2a57] mb-2">
                    Bất động sản dành cho tôi
                </h2>
                <p>Vui lòng đăng nhập để xem các gợi ý cá nhân hóa.</p>
            </section>
        );
    }

    // --- Render ---
    return (
        <section className="mt-10">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#1b2a57]">
                        Bất động sản dành cho tôi
                    </h2>
                    {forYouSource && hasData && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Nguồn:{" "}
                            {forYouSource === "personalized" ? "Cá nhân hóa" : "Phổ biến"}
                        </span>
                    )}
                </div>
                <Link
                    to="/goi-y-cho-ban"
                    className="text-[#1f5fbf] font-semibold hover:underline"
                >
                    Xem tất cả
                </Link>
            </div>

            {/* ERROR */}
            {forYouError && !hasData && minDelayDone && (
                <div className="text-red-500 text-center mb-4">
                    Lỗi khi tải dữ liệu: {forYouError}
                </div>
            )}

            {/* KHÔNG CÓ GỢI Ý */}
            {!forYouLoading && !hasData && !forYouError && minDelayDone && (
                <div className="text-center text-gray-500 py-10">
                    Chưa có gợi ý phù hợp — hãy lưu vài tin yêu thích để hệ thống học thói
                    quen của bạn 💡
                </div>
            )}

            {/* DANH SÁCH */}
            {showSkeleton ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1">
                    {Array.from({ length: INITIAL }).map((_, i) => (
                        <PropertyCardSkeleton key={`sk-${i}`} />
                    ))}
                </div>
            ) : (
                hasData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1">
                        {visibleList.map((item) => (
                            <Link
                                key={item.id}
                                to={`/real-estate/${item.id}`}
                                className="block group"
                            >
                                <PropertyCard item={item} />
                            </Link>
                        ))}
                    </div>
                )
            )}

            {/* NÚT MỞ RỘNG */}
            {hasData && forYouList.length > INITIAL && (
                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 shadow-sm"
                    >
                        {expanded ? "Thu gọn" : "Mở rộng"}{" "}
                        {expanded ? <UpOutlined /> : <DownOutlined />}
                    </button>
                </div>
            )}
        </section>
    );
}

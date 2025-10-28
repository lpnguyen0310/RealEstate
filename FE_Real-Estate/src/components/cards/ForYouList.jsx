import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import PropertyCardSkeleton from "./skeletion/PropertyCardSkeleton";
import { fetchPropertiesThunk } from "@/store/propertySlice";

const MIN_SKELETON_MS = 2000; // giữ skeleton ít nhất 2s

export default function ForYouList() {
    const dispatch = useDispatch();

    // --- Lấy dữ liệu từ Redux ---
    const { forYouList, forYouError, forYouSource } = useSelector((s) => s.property);
    const authUser = useSelector((s) => s.auth.user);
    const userId = authUser?.id || authUser?.userId || null;

    // --- State UI ---
    const INITIAL = 8;
    const [expanded, setExpanded] = useState(false);
    const [didFetchPopular, setDidFetchPopular] = useState(false);
    const [fetchedForUserId, setFetchedForUserId] = useState(null);
    const [minDelayDone, setMinDelayDone] = useState(false);
    const timerRef = useRef(null);

    // --- Giữ skeleton ít nhất MIN_SKELETON_MS ---
    useEffect(() => {
        timerRef.current = setTimeout(() => setMinDelayDone(true), MIN_SKELETON_MS);
        return () => clearTimeout(timerRef.current);
    }, []);

    // --- Gọi API fetch dữ liệu ---
    useEffect(() => {
        if (userId && fetchedForUserId !== userId) {
            // Nếu có user → gọi personalized
            dispatch(fetchPropertiesThunk({ type: "forYou", userId, limit: 24 }));
            setFetchedForUserId(userId);
        } else if (!userId && !didFetchPopular) {
            // Nếu chưa đăng nhập → chỉ fetch phổ biến
            dispatch(fetchPropertiesThunk({ type: "popular", limit: 8 }));
            setDidFetchPopular(true);
        }
    }, [dispatch, userId, didFetchPopular, fetchedForUserId]);

    // --- Xử lý hiển thị dữ liệu ---
    const hasData = Array.isArray(forYouList) && forYouList.length > 0;
    const visible = useMemo(
        () => (expanded ? forYouList : forYouList.slice(0, INITIAL)),
        [expanded, forYouList]
    );

    // --- Nếu chưa đăng nhập → không hiển thị skeleton ---
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

    // --- Skeleton chỉ hiển thị khi chưa có data HOẶC chưa hết min delay ---
    const showSkeleton = (!hasData && !forYouError) || !minDelayDone;

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
                            Nguồn: {forYouSource === "personalized" ? "Cá nhân hóa" : "Phổ biến"}
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

            {/* LIST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1">
                {(showSkeleton ? Array.from({ length: INITIAL }) : visible).map((item, i) =>
                    showSkeleton ? (
                        <PropertyCardSkeleton key={`sk-${i}`} />
                    ) : (
                        <Link
                            key={item.id}
                            to={`/real-estate/${item.id}`}
                            className="block group"
                        >
                            <PropertyCard item={item} />
                        </Link>
                    )
                )}
            </div>

            {/* EXPAND BUTTON */}
            {!showSkeleton && forYouList.length > INITIAL && (
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

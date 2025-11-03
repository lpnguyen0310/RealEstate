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

  // Fallback (PREMIUM/VIP) local state
  const [fallbackRequested, setFallbackRequested] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState(null);
  const [fallbackList, setFallbackList] = useState([]);
  const [fallbackUsed, setFallbackUsed] = useState(false); // để hiển thị badge nguồn

  // Giữ skeleton ít nhất MIN_SKELETON_MS
  useEffect(() => {
    timerRef.current = setTimeout(() => setMinDelayDone(true), MIN_SKELETON_MS);
    return () => clearTimeout(timerRef.current);
  }, []);

  // Gọi API gợi ý khi có userId
  useEffect(() => {
    if (userId && fetchedForUserId !== userId) {
      dispatch(fetchPropertiesThunk({ type: "forYou", userId, limit: 24 }));
      setFetchedForUserId(userId);
      // reset trạng thái fallback khi đổi user
      setFallbackRequested(false);
      setFallbackLoading(false);
      setFallbackError(null);
      setFallbackList([]);
      setFallbackUsed(false);
    }
  }, [dispatch, userId, fetchedForUserId]);

  // --- Điều kiện kích hoạt Fallback PREMIUM/VIP ---
  const hasPersonalized = Array.isArray(forYouList) && forYouList.length > 0;
  const shouldRequestFallback =
    userId &&
    !forYouLoading &&
    !hasPersonalized &&
    !forYouError &&
    minDelayDone &&
    !fallbackRequested &&
    !fallbackLoading;

  useEffect(() => {
    if (!shouldRequestFallback) return;
    setFallbackRequested(true);
    setFallbackLoading(true);
    setFallbackError(null);

    // Gọi lại thunk nhưng lấy payload qua unwrap để dùng local state,
    // đồng thời đặt filter PREMIUM & VIP + PUBLISHED
    dispatch(
      fetchPropertiesThunk({
        // Không set type: "forYou" để tránh backend đặc thù gợi ý,
        // dùng tìm kiếm thường (tùy slice của bạn, vẫn ok lấy payload).
        page: 0,
        size: 24,
        status: "PUBLISHED",
        ensurePublished: true,
        // Nhiều BE nhận "listingType" dạng CSV. Nếu BE của bạn nhận mảng, đổi sang ["PREMIUM","VIP"].
        listingType: ["PREMIUM", "VIP"],
        sort: "postedAt,DESC",
      })
    )
      .unwrap()
      .then((payload) => {
        // Chuẩn hóa payload sang mảng
        const items =
          payload?.content ??
          payload?.items ??
          (Array.isArray(payload) ? payload : []);
        setFallbackList(items || []);
        setFallbackUsed(true);
      })
      .catch((e) => {
        setFallbackError(e?.message || "Không thể tải PREMIUM/VIP");
      })
      .finally(() => setFallbackLoading(false));
  }, [shouldRequestFallback, dispatch]);

  // --- Xử lý hiển thị ---
  const hasFallback = Array.isArray(fallbackList) && fallbackList.length > 0;

  const showSkeleton =
    forYouLoading ||
    (!hasPersonalized && !forYouError && !minDelayDone) ||
    // nếu đang fallback và chưa có dữ liệu cũng cho phép skeleton
    (fallbackRequested && fallbackLoading && !hasFallback && !fallbackError);

  // Chọn nguồn hiển thị: ưu tiên personalized, nếu không có thì fallback
  const effectiveList = hasPersonalized ? forYouList : fallbackList;
  const effectiveHasData = Array.isArray(effectiveList) && effectiveList.length > 0;

  const visibleList = useMemo(
    () => (expanded ? effectiveList : effectiveList.slice(0, INITIAL)),
    [expanded, effectiveList]
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

  return (
    <section className="mt-10">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[#1b2a57]">
            Bất động sản dành cho tôi
          </h2>
        </div>

        <Link to="/goi-y-cho-ban" className="text-[#1f5fbf] font-semibold hover:underline">
          Xem tất cả
        </Link>
      </div>

      {/* ERROR personalized */}
      {forYouError && !hasPersonalized && minDelayDone && !fallbackUsed && (
        <div className="text-red-500 text-center mb-4">
          Lỗi khi tải dữ liệu: {forYouError}
        </div>
      )}

      {/* ERROR fallback */}
      {!hasPersonalized && fallbackError && minDelayDone && (
        <div className="text-red-500 text-center mb-4">
          Lỗi khi tải PREMIUM/VIP: {fallbackError}
        </div>
      )}

      {/* KHÔNG CÓ GỢI Ý & CHƯA fallback xong */}
      {!showSkeleton &&
        !effectiveHasData &&
        minDelayDone &&
        (!fallbackRequested || fallbackLoading) && (
          <div className="text-center text-gray-500 py-10">
            Chưa có gợi ý phù hợp — hệ thống đang tải các tin PREMIUM &amp; VIP…
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
        effectiveHasData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1">
            {visibleList.map((item) => (
              <Link key={item.id} to={`/real-estate/${item.id}`} className="block group">
                <PropertyCard item={item} />
              </Link>
            ))}
          </div>
        )
      )}

      {/* NÚT MỞ RỘNG */}
      {effectiveHasData && effectiveList.length > INITIAL && (
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

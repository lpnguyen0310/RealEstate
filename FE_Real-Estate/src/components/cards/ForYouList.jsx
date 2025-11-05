// src/components/ForYouList.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button, Modal, Input, Slider, message } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import PropertyCard from "./PropertyCard";
import PropertyCardSkeleton from "./skeletion/PropertyCardSkeleton";
import { fetchPropertiesThunk } from "@/store/propertySlice";

const MIN_SKELETON_MS = 2000; // giữ skeleton tối thiểu 2s
const SS_NS = "fy_interest_state";

// Chuẩn hoá item public → shape dùng bởi <PropertyCard />
function normalizePublicItem(p = {}) {
  const imgs = Array.isArray(p.images)
    ? p.images
    : Array.isArray(p.imageUrls)
      ? p.imageUrls
      : [];

  const pricePerM2 =
    p.pricePerM2 != null
      ? p.pricePerM2
      : p.price != null && p.area > 0
        ? p.price / p.area
        : null;

  const listingTypeRaw = p.listing_type ?? p.listingType ?? p.listingtype;
  const listingType =
    typeof listingTypeRaw === "string" ? listingTypeRaw.toUpperCase() : listingTypeRaw;

  return {
    id: p.id,
    images: imgs,
    image: p.image,
    title: p.title,
    description: p.description,

    price: p.price,
    pricePerM2,
    postedAt: p.postedAt,
    photos: p.photos,

    // address
    addressMain:
      p.addressMain || p.addressFull || p.addressShort || p.displayAddress || p.address || "",
    addressShort: p.addressShort || "",
    addressFull: p.addressFull || "",

    // specs
    area: p.area,
    bed: p.bed ?? p.bedrooms,
    bath: p.bath ?? p.bathrooms,

    agent: p.agent,
    type: p.type,
    category: p.category,

    // badge
    listingType, // "PREMIUM" | "VIP" | "NORMAL"
  };
} 

export default function ForYouList() {
  const dispatch = useDispatch();
  const { forYouList, forYouError, forYouSource, forYouLoading } = useSelector((s) => s.property);
  const authUser = useSelector((s) => s.auth.user);
  const userId = authUser?.id || authUser?.userId || null;

  // ===== Derived keys =====
  const userKey = userId ? `${SS_NS}:${userId}` : null;

  // ===== UI state =====
  const [expanded, setExpanded] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // chặn fetch lặp ForYou theo userId
  const [fetchedForUserId, setFetchedForUserId] = useState(null);

  // giữ skeleton tối thiểu cho luồng ForYou
  const [forYouLocalLoading, setForYouLocalLoading] = useState(false);

  // Modal form (persisted)
  const [cityOrAreaKeyword, setCityOrAreaKeyword] = useState("");
  const [priceRange, setPriceRange] = useState([1_000_000_000, 5_000_000_000]);
  const [areaRange, setAreaRange] = useState([30, 120]);

  // Kết quả theo sở thích (persisted)
  const [interestResults, setInterestResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchRequested, setSearchRequested] = useState(false);

  // ====== Reset guard khi đổi user ======
  useEffect(() => {
    // đổi user → reset lần fetch
    setFetchedForUserId(null);
    setExpanded(false);
  }, [userId]);

  // ====== Hydrate từ sessionStorage theo user ======
  useEffect(() => {
    if (!userKey) return;
    try {
      const raw = sessionStorage.getItem(userKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.keyword) setCityOrAreaKeyword(saved.keyword);
        if (Array.isArray(saved?.priceRange)) setPriceRange(saved.priceRange);
        if (Array.isArray(saved?.areaRange)) setAreaRange(saved.areaRange);
        if (Array.isArray(saved?.items)) setInterestResults(saved.items);
      } else {
        // user này chưa có gì → clear kết quả cũ trong state
        setInterestResults([]);
      }
    } catch { }
  }, [userKey]);

  // ====== (tuỳ chọn) Dọn namespace khi logout ======
  useEffect(() => {
    if (userId) return;
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(`${SS_NS}:`))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch { }
    setInterestResults([]);
  }, [userId]);

  // Min delay mượt skeleton (trường hợp chưa có gì để render)
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), MIN_SKELETON_MS);
    return () => clearTimeout(t);
  }, []);

  // Personalized có thật sự tồn tại?
  const hasPersonalized =
    forYouSource === "personalized" && Array.isArray(forYouList) && forYouList.length > 0;

  // Danh sách để hiển thị
  const effectiveList = hasPersonalized ? forYouList : interestResults;
  const effectiveHasData = Array.isArray(effectiveList) && effectiveList.length > 0;

  // Hiện skeleton khi: đang search, hoặc đang giữ min-delay cho ForYou, hoặc đang fetch ForYou đúng user, hoặc chưa có data & chưa qua min-delay
  const showSkeleton =
    searching ||
    forYouLocalLoading ||
    (forYouLoading && fetchedForUserId === userId) ||
    (!effectiveHasData && !minDelayDone);

  const visibleList = useMemo(
    () => (expanded ? effectiveList : effectiveList.slice(0, 8)),
    [expanded, effectiveList]
  );

  // ===== Auto-fetch For You: chỉ 1 lần / userId, và giữ skeleton tối thiểu =====
  useEffect(() => {
    if (!userId) return;
    if (fetchedForUserId === userId) return;

    setForYouLocalLoading(true);
    const start = performance.now();

    dispatch(
      fetchPropertiesThunk({
        type: "forYou",
        userId,
        limit: 24,
        enforcePersonalized: true,
        fallback: false,
      })
    )
      .finally(() => {
        setFetchedForUserId(userId);
        const elapsed = performance.now() - start;
        const remain = Math.max(0, MIN_SKELETON_MS - elapsed);
        setTimeout(() => setForYouLocalLoading(false), remain);
      });
  }, [dispatch, userId, fetchedForUserId]);

  // ===== Search theo sở thích — giữ skeleton tối thiểu & persist per user =====
  const handleSearch = async () => {
    if (!cityOrAreaKeyword) {
      message.warning("Vui lòng nhập thành phố hoặc khu vực (keyword).");
      return;
    }
    setSearchRequested(true);
    setSearching(true);
    setShowModal(false);

    const start = performance.now();

    try {
      const payload = await dispatch(
        fetchPropertiesThunk({
          page: 0,
          size: 24,
          sort: "postedAt,desc",
          keyword: cityOrAreaKeyword,
          priceFrom: priceRange[0],
          priceTo: priceRange[1],
          areaFrom: areaRange[0],
          areaTo: areaRange[1],
        })
      ).unwrap();

      const items =
        payload?.content ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
      const mapped = (items || []).map(normalizePublicItem);

      // Persist theo user
      try {
        if (userKey) {
          sessionStorage.setItem(
            userKey,
            JSON.stringify({
              keyword: cityOrAreaKeyword,
              priceRange,
              areaRange,
              items: mapped,
              ts: Date.now(),
            })
          );
        }
      } catch { }

      setInterestResults(mapped);
      setExpanded(false);
    } catch (err) {
      message.error("Không thể tải dữ liệu theo lựa chọn của bạn.");
    } finally {
      const elapsed = performance.now() - start;
      const remain = Math.max(0, MIN_SKELETON_MS - elapsed);
      setTimeout(() => setSearching(false), remain);
    }
  };

  // ===== Guards =====
  if (!userId) {
    return (
      <section className="mt-10 text-center text-gray-600">
        <h2 className="text-2xl font-bold text-[#1b2a57] mb-2">Bất động sản dành cho tôi</h2>
        <p>Vui lòng đăng nhập để xem các gợi ý cá nhân hóa.</p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1b2a57]">Bất động sản dành cho tôi</h2>
        {hasPersonalized && (
          <Link to="/goi-y-cho-ban" className="text-[#1f5fbf] font-semibold hover:underline">
            Xem tất cả
          </Link>
        )}
      </div>

      {/* Lỗi personalized */}
      {forYouError && !hasPersonalized && (
        <div className="text-red-500 text-center mb-4">
          Lỗi khi tải gợi ý cá nhân hóa: {forYouError}
        </div>
      )}

      {/* Empty state lần đầu (không hiển thị khi đang search) */}
      {!hasPersonalized && interestResults.length === 0 && !searching && !searchRequested && (
        <div className="text-center py-14 bg-[#f8fafc] rounded-2xl shadow-inner">
          <h3 className="text-xl font-semibold text-[#1b2a57] mb-2">Chào mừng bạn!</h3>
          <p className="text-gray-600 mb-6">
            Hãy chọn khu vực, khoảng giá và diện tích để xem các tin phù hợp.
          </p>
          <Button
            type="primary"
            size="large"
            onClick={() => setShowModal(true)}
            style={{ background: "#1f5fbf", borderRadius: 8, fontWeight: 600 }}
          >
            Chọn sở thích của bạn
          </Button>
        </div>
      )}

      {/* Modal chọn sở thích */}
      <Modal
        title="Cá nhân hóa gợi ý bất động sản"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowModal(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={searching}
            onClick={handleSearch}
            style={{ background: "#1f5fbf" }}
          >
            Xem gợi ý
          </Button>,
        ]}
      >
        <div className="space-y-5">
          <div>
            <label className="block font-medium mb-1">Thành phố / Khu vực</label>
            <Input
              placeholder="VD: Quận 1, TP.HCM"
              value={cityOrAreaKeyword}
              onChange={(e) => setCityOrAreaKeyword(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Khoảng giá (VND)</label>
            <Slider
              range
              min={500_000_000}
              max={100_000_000_000} // 100 tỷ
              step={500_000_000}
              tooltip={{ formatter: (v) => `${(v / 1e9).toFixed(1)} tỷ` }}
              value={priceRange}
              onChange={(val) => setPriceRange(val)}
            />
            <div className="text-sm text-gray-500">
              {(priceRange[0] / 1e9).toFixed(1)} tỷ - {(priceRange[1] / 1e9).toFixed(1)} tỷ
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Diện tích (m²) </label>
            <Slider
              range
              min={10}
              max={1000} // 1000 m²
              step={5}
              tooltip={{ formatter: (v) => `${v} m²` }}
              value={areaRange}
              onChange={(val) => setAreaRange(val)}
            />
            <div className="text-sm text-gray-500">
              {areaRange[0]} m² - {areaRange[1]} m²
            </div>
          </div>
        </div>
      </Modal>

      {/* SKELETON */}
      {showSkeleton && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <PropertyCardSkeleton key={`sk-${i}`} />
          ))}
        </div>
      )}

      {/* Kết quả */}
      {effectiveHasData && !showSkeleton && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1 mt-6">
            {visibleList.map((item) => (
              <Link key={item.id} to={`/real-estate/${item.id}`} className="block group">
                <PropertyCard item={item} />
              </Link>
            ))}
          </div>

          {effectiveList.length > 8 && (
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setExpanded((v) => !v)} icon={expanded ? <UpOutlined /> : <DownOutlined />}>
                {expanded ? "Thu gọn" : "Xem thêm"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

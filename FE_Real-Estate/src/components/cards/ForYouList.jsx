// src/components/ForYouList.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button, Modal, Slider, message, Select, Spin, Grid } from "antd";
import { DownOutlined, UpOutlined, AimOutlined } from "@ant-design/icons";
import PropertyCard from "./PropertyCard";
import PropertyCardSkeleton from "./skeletion/PropertyCardSkeleton";
import { fetchPropertiesThunk } from "@/store/propertySlice";
import { locationApi } from "@/api/locationApi";

const MIN_SKELETON_MS = 2000;
const SS_NS = "fy_interest_state";

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
    addressMain:
      p.addressMain || p.addressFull || p.addressShort || p.displayAddress || p.address || "",
    addressShort: p.addressShort || "",
    addressFull: p.addressFull || "",
    area: p.area,
    bed: p.bed ?? p.bedrooms,
    bath: p.bath ?? p.bathrooms,
    agent: p.agent,
    type: p.type,
    category: p.category,
    listingType,
  };
}

export default function ForYouList() {
  const dispatch = useDispatch();
  const { forYouList, forYouError, forYouSource, forYouLoading } = useSelector(
    (s) => s.property
  );
  const authUser = useSelector((s) => s.auth.user);
  const userId = authUser?.id || authUser?.userId || null;

  const userKey = userId ? `${SS_NS}:${userId}` : null;

  const [expanded, setExpanded] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fetchedForUserId, setFetchedForUserId] = useState(null);
  const [forYouLocalLoading, setForYouLocalLoading] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [loadingProv, setLoadingProv] = useState(false);
  const [provinceId, setProvinceId] = useState(undefined);
  const [provinceName, setProvinceName] = useState("");
  const [priceRange, setPriceRange] = useState([1_000_000_000, 5_000_000_000]);
  const [areaRange, setAreaRange] = useState([30, 120]);
  const [interestResults, setInterestResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchRequested, setSearchRequested] = useState(false);

  const screens = Grid.useBreakpoint();
  const modalWidth = 640; // cố định 640px

  useEffect(() => {
    setFetchedForUserId(null);
    setExpanded(false);
  }, [userId]);

  useEffect(() => {
    if (!userKey) return;
    try {
      const raw = sessionStorage.getItem(userKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved?.priceRange)) setPriceRange(saved.priceRange);
        if (Array.isArray(saved?.areaRange)) setAreaRange(saved.areaRange);
        if (Array.isArray(saved?.items)) setInterestResults(saved.items);
        if (saved?.provinceId) {
          setProvinceId(saved.provinceId);
          setProvinceName(saved.provinceName || "");
        }
        setSearchRequested(Boolean(saved?.keyword));
      } else setInterestResults([]);
    } catch { }
  }, [userKey]);

  useEffect(() => {
    if (userId) return;
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(`${SS_NS}:`))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch { }
    setInterestResults([]);
  }, [userId]);

  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), MIN_SKELETON_MS);
    return () => clearTimeout(t);
  }, []);

  const hasPersonalized =
    forYouSource === "personalized" && Array.isArray(forYouList) && forYouList.length > 0;
  const effectiveList = hasPersonalized ? forYouList : interestResults;
  const effectiveHasData = Array.isArray(effectiveList) && effectiveList.length > 0;
  const showSkeleton =
    searching ||
    forYouLocalLoading ||
    (forYouLoading && fetchedForUserId === userId) ||
    (!effectiveHasData && !minDelayDone);

  const visibleList = useMemo(
    () => (expanded ? effectiveList : effectiveList.slice(0, 8)),
    [expanded, effectiveList]
  );

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
        slot: "forYou",
      })
    ).finally(() => {
      setFetchedForUserId(userId);
      const elapsed = performance.now() - start;
      const remain = Math.max(0, MIN_SKELETON_MS - elapsed);
      setTimeout(() => setForYouLocalLoading(false), remain);
    });
  }, [dispatch, userId, fetchedForUserId]);

  useEffect(() => {
    if (!showModal) return;
    let abort = new AbortController();
    if (provinces.length === 0) {
      setLoadingProv(true);
      locationApi
        .getCities()
        .then((list) => setProvinces(list))
        .catch(() => { })
        .finally(() => setLoadingProv(false));
    }
    return () => abort.abort();
  }, [showModal, provinces.length]);

  const handleSearch = async () => {
    if (!provinceName) {
      message.warning("Vui lòng chọn Tỉnh/Thành phố.");
      return;
    }

    const keyword = provinceName;
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
          keyword,
          priceFrom: priceRange[0],
          priceTo: priceRange[1],
          areaFrom: areaRange[0],
          areaTo: areaRange[1],
          cityId: provinceId,
        })
      ).unwrap();

      const items =
        payload?.content ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
      const mapped = (items || []).map(normalizePublicItem);

      if (userKey) {
        sessionStorage.setItem(
          userKey,
          JSON.stringify({
            keyword,
            priceRange,
            areaRange,
            items: mapped,
            ts: Date.now(),
            provinceId,
            provinceName,
          })
        );
      }

      setInterestResults(mapped);
      setExpanded(false);
    } catch {
      message.error("Không thể tải dữ liệu theo lựa chọn của bạn.");
    } finally {
      const elapsed = performance.now() - start;
      const remain = Math.max(0, MIN_SKELETON_MS - elapsed);
      setTimeout(() => setSearching(false), remain);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1b2a57]">Bất động sản dành cho tôi</h2>
        {hasPersonalized && (
          <Link to="/goi-y-cho-ban" className="text-[#1f5fbf] font-semibold hover:underline">
            Xem tất cả
          </Link>
        )}
      </div>

      {!hasPersonalized && interestResults.length === 0 && !searching && !searchRequested && (
        <div className="text-center py-14 bg-[#f8fafc] rounded-2xl shadow-inner">
          <h3 className="text-xl font-semibold text-[#1b2a57] mb-2">Chào mừng bạn!</h3>
          <p className="text-gray-600 mb-6">
            Hãy chọn thành phố, khoảng giá và diện tích để xem các tin phù hợp.
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

      {/* ===== MODAL ===== */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1ff]">
              <AimOutlined className="text-[#1f5fbf]" />
            </span>
            <div>
              <div className="text-[17px] font-semibold text-[#1b2a57]">
                Cá nhân hóa gợi ý bất động sản
              </div>
              <div className="text-[12px] text-gray-500 -mt-0.5">
                Chọn khu vực, khoảng giá và diện tích để nhận gợi ý phù hợp
              </div>
            </div>
          </div>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        centered
        width={modalWidth}
        destroyOnClose
        maskClosable={false}
        bodyStyle={{
          background: "#fff",
          maxHeight: "75vh",
          overflowY: "auto",
          paddingBottom: 24,
        }}
        style={{
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowModal(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={searching}
            onClick={handleSearch}
            style={{ background: "#1f5fbf", borderRadius: 8, fontWeight: 600 }}
          >
            Xem gợi ý
          </Button>,
        ]}
      >
        <div className="space-y-7">
          <div>
            <label className="block text-sm font-medium text-[#1b2a57] mb-1.5">
              Tỉnh / Thành phố
            </label>
            <Select
              showSearch
              allowClear
              placeholder="Chọn Tỉnh/Thành phố"
              value={provinceId}
              onChange={(val, option) => {
                setProvinceId(val);
                setProvinceName(option?.label ?? "");
              }}
              size="large"
              style={{ width: "100%" }}
              options={provinces.map((p) => ({ value: p.id, label: p.name }))}
              loading={loadingProv}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={loadingProv ? <Spin size="small" /> : null}
            />
          </div>

          {/* === GIÁ === */}
          <div className="p-5 rounded-xl border border-[#dde4ef] bg-[#f3f6fb]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#1b2a57]">Khoảng giá (VND)</label>
              <span className="text-xs text-gray-600 font-semibold">
                {(priceRange[0] / 1e9).toFixed(1)} tỷ – {(priceRange[1] / 1e9).toFixed(1)} tỷ
              </span>
            </div>
            <div className="mx-auto w-[100%]">
              <Slider
                range
                min={500_000_000}
                max={100_000_000_000}
                step={500_000_000}
                tooltip={{ formatter: (v) => `${(v / 1e9).toFixed(1)} tỷ` }}
                value={priceRange}
                onChange={(val) => setPriceRange(val)}
                trackStyle={[{ backgroundColor: "#1f5fbf", height: 6 }]}
                handleStyle={[
                  { borderColor: "#1f5fbf", backgroundColor: "#1f5fbf" },
                  { borderColor: "#1f5fbf", backgroundColor: "#1f5fbf" },
                ]}
                railStyle={{ backgroundColor: "#c3d3f0", height: 6 }}
              />
            </div>
          </div>

          {/* === DIỆN TÍCH === */}
          <div className="p-5 rounded-xl border border-[#dde4ef] bg-[#f3f6fb]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#1b2a57]">Diện tích (m²)</label>
              <span className="text-xs text-gray-600 font-semibold">
                {areaRange[0]} m² – {areaRange[1]} m²
              </span>
            </div>
            <div className="mx-auto w-[100%]">
              <Slider
                range
                min={10}
                max={1000}
                step={5}
                tooltip={{ formatter: (v) => `${v} m²` }}
                value={areaRange}
                onChange={(val) => setAreaRange(val)}
                trackStyle={[{ backgroundColor: "#1f5fbf", height: 6 }]}
                handleStyle={[
                  { borderColor: "#1f5fbf", backgroundColor: "#1f5fbf" },
                  { borderColor: "#1f5fbf", backgroundColor: "#1f5fbf" },
                ]}
                railStyle={{ backgroundColor: "#c3d3f0", height: 6 }}
              />
            </div>
          </div>
        </div>
      </Modal>

      {showSkeleton && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <PropertyCardSkeleton key={`sk-${i}`} />
          ))}
        </div>
      )}

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
              <Button
                onClick={() => setExpanded((v) => !v)}
                icon={expanded ? <UpOutlined /> : <DownOutlined />}
              >
                {expanded ? "Thu gọn" : "Xem thêm"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

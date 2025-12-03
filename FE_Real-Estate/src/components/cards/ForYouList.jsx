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
const RECO_TAKE = 24;

export default function ForYouList() {
  const dispatch = useDispatch();
  const { forYouList, forYouSource, forYouLoading } = useSelector(
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

  // chọn nhiều thành phố
  const [selectedCityIds, setSelectedCityIds] = useState([]); // [id, id, ...]
  const [selectedCityLabels, setSelectedCityLabels] = useState([]); // ["Hà Nội", "Đà Nẵng", ...]

  // khoảng giá & diện tích
  const [priceRange, setPriceRange] = useState([1_000_000_000, 5_000_000_000]); // VND
  const [areaRange, setAreaRange] = useState([30, 120]); // m²

  // modal thông báo khi fallback nearby
  const [showNearbyModal, setShowNearbyModal] = useState(false);

  // modal thông báo khi không có kết quả ngay cả sau khi fallback
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  // cờ đánh dấu: user đã bấm "Xem gợi ý" ít nhất 1 lần (không tính auto-load)
  const [hasSearched, setHasSearched] = useState(false);

  // cờ: đã load xong sessionStorage (để tránh race)
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // cờ: đã hiện modal nearby cho lần search hiện tại chưa
  const [hasSeenNearbyModal, setHasSeenNearbyModal] = useState(false);

  const screens = Grid.useBreakpoint();
  const modalWidth = 640;

  // khi đổi user → reset
  useEffect(() => {
    setFetchedForUserId(null);
    setExpanded(false);
    setHasSearched(false);
    setShowEmptyModal(false);
    setHasSeenNearbyModal(false);
  }, [userId]);

  // ===== Load session (nhớ lựa chọn + hasSearched + hasSeenNearbyModal) =====
  useEffect(() => {
    if (!userKey) {
      setSessionLoaded(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem(userKey);
      if (raw) {
        const saved = JSON.parse(raw);

        if (Array.isArray(saved?.selected?.cityIds)) {
          setSelectedCityIds(saved.selected.cityIds);
          setSelectedCityLabels(saved.selected.cityLabels || []);
        } else if (saved?.selected?.provinceId) {
          setSelectedCityIds([saved.selected.provinceId]);
          setSelectedCityLabels([saved.selected.provinceName || ""]);
        }

        if (Array.isArray(saved?.selected?.priceRange)) {
          setPriceRange(saved.selected.priceRange);
        }
        if (Array.isArray(saved?.selected?.areaRange)) {
          setAreaRange(saved.selected.areaRange);
        }

        if (saved?.meta?.hasSearched) {
          setHasSearched(true);
        }
        if (saved?.meta?.hasSeenNearbyModal) {
          setHasSeenNearbyModal(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setSessionLoaded(true);
    }
  }, [userKey]);

  // skeleton delay
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), MIN_SKELETON_MS);
    return () => clearTimeout(t);
  }, []);

  const hasPersonalized =
    forYouSource === "personalized" &&
    Array.isArray(forYouList) &&
    forYouList.length > 0;

  const effectiveList = forYouList || [];
  const effectiveHasData = Array.isArray(effectiveList) && effectiveList.length > 0;

  // 🆕 Lấy danh sách tên khu vực từ kết quả nearby
  const suggestedCityNames = useMemo(() => {
    if (forYouSource !== "nearby" || !effectiveHasData) return [];
    const names = effectiveList
      .map((it) => it.cityName || it.city?.name || it.city || null)
      .filter(Boolean);

    return Array.from(new Set(names)).slice(0, 6);
  }, [forYouSource, effectiveHasData, effectiveList]);

  const showSkeleton =
    forYouLocalLoading ||
    (forYouLoading && fetchedForUserId === userId) ||
    (!effectiveHasData && !minDelayDone);

  const visibleList = useMemo(
    () => (expanded ? effectiveList : effectiveList.slice(0, 8)),
    [expanded, effectiveList]
  );

  // Khi BE trả source = nearby => mở modal thông báo (chỉ 1 lần / search)
  useEffect(() => {
    if (!hasSearched) return; // chỉ hiển thị khi đã thực sự bấm "Xem gợi ý"
    if (hasSeenNearbyModal) return;

    if (forYouSource === "nearby" && effectiveHasData) {
      setShowNearbyModal(true);
      setHasSeenNearbyModal(true);

      if (userKey) {
        try {
          const raw = sessionStorage.getItem(userKey);
          const saved = raw ? JSON.parse(raw) : {};
          sessionStorage.setItem(
            userKey,
            JSON.stringify({
              ...saved,
              meta: {
                ...(saved.meta || {}),
                hasSearched: true,
                hasSeenNearbyModal: true,
              },
            })
          );
        } catch {
          // ignore
        }
      }
    }
  }, [
    forYouSource,
    effectiveHasData,
    hasSearched,
    hasSeenNearbyModal,
    userKey,
  ]);

  // ===== Lần đầu load: ưu tiên dùng tiêu chí đã lưu (nếu có) =====
  useEffect(() => {
    if (!userId) return;
    if (fetchedForUserId === userId) return;
    if (!sessionLoaded) return; // đợi load session xong

    setForYouLocalLoading(true);
    const start = performance.now();

    // nếu đã từng "Xem gợi ý" + có cityId → auto chạy lại search theo tiêu chí cũ
    if (hasSearched && selectedCityIds.length > 0) {
      const [minP, maxP] = priceRange;
      const [minA, maxA] = areaRange;
      const anchorCityId = selectedCityIds[0];
      const nearRest = selectedCityIds.slice(1);

      dispatch(
        fetchPropertiesThunk({
          type: "forYou",
          userId,
          limit: RECO_TAKE,
          cityId: anchorCityId,
          nearCityIds: nearRest,
          minPrice: minP,
          maxPrice: maxP,
          minArea: minA,
          maxArea: maxA,
          slot: "forYou",
          mode: "filter", // ⭐ phân biệt với history
        })
      ).finally(() => {
        setFetchedForUserId(userId);
        const elapsed = performance.now() - start;
        const remain = Math.max(0, MIN_SKELETON_MS - elapsed);
        setTimeout(() => setForYouLocalLoading(false), remain);
      });
    } else {
      // chưa từng search → lấy gợi ý history
      dispatch(
        fetchPropertiesThunk({
          type: "forYou",
          userId,
          limit: RECO_TAKE,
          slot: "forYou",
          mode: "history",
        })
      ).finally(() => {
        setFetchedForUserId(userId);
        const elapsed = performance.now() - start;
        const remain = Math.max(0, MIN_SKELETON_MS - elapsed);
        setTimeout(() => setForYouLocalLoading(false), remain);
      });
    }
  }, [
    dispatch,
    userId,
    fetchedForUserId,
    hasSearched,
    selectedCityIds,
    priceRange,
    areaRange,
    sessionLoaded,
  ]);

  // lazy load provinces khi mở modal
  useEffect(() => {
    if (!showModal) return;
    if (provinces.length > 0) return;
    setLoadingProv(true);
    locationApi
      .getCities()
      .then((list) => setProvinces(list || []))
      .catch(() => {})
      .finally(() => setLoadingProv(false));
  }, [showModal, provinces.length]);

  // ===== Bấm "Xem gợi ý" → recommend theo tiêu chí =====
  const handleSearch = async () => {
    if (!selectedCityIds.length) {
      message.warning("Vui lòng chọn ít nhất 1 khu vực (Tỉnh/Thành phố).");
      return;
    }
    const [minP, maxP] = priceRange;
    const [minA, maxA] = areaRange;
    if (minP >= maxP) {
      message.warning("Khoảng giá chưa hợp lệ.");
      return;
    }
    if (minA >= maxA) {
      message.warning("Khoảng diện tích chưa hợp lệ.");
      return;
    }

    setShowModal(false);
    setForYouLocalLoading(true);
    setHasSearched(true);
    setHasSeenNearbyModal(false); // 🔹 reset cho lần search mới
    setShowEmptyModal(false);
    const start = performance.now();

    const anchorCityId = selectedCityIds[0];
    const nearRest = selectedCityIds.slice(1);

    try {
      await dispatch(
        fetchPropertiesThunk({
          type: "forYou",
          userId,
          limit: RECO_TAKE,
          cityId: anchorCityId,
          nearCityIds: nearRest,
          minPrice: minP,
          maxPrice: maxP,
          minArea: minA,
          maxArea: maxA,
          slot: "forYou",
          mode: "filter", // ⭐ list này sẽ là list "theo tiêu chí"
        })
      );

      if (userKey) {
        sessionStorage.setItem(
          userKey,
          JSON.stringify({
            selected: {
              cityIds: selectedCityIds,
              cityLabels: selectedCityLabels,
              provinceId: anchorCityId,
              provinceName: selectedCityLabels[0] || "",
              priceRange,
              areaRange,
            },
            meta: {
              hasSearched: true,
              hasSeenNearbyModal: false, // sẽ set true khi thực sự fallback nearby
            },
            ts: Date.now(),
          })
        );
      }
      setExpanded(false);
    } finally {
      const elapsed = performance.now() - start;
      const remain = Math.max(0, MIN_SKELETON_MS - elapsed);
      setTimeout(() => setForYouLocalLoading(false), remain);
    }
  };

  // Nếu đã tìm + hết loading + không có dữ liệu → modal “Rất tiếc...”
  useEffect(() => {
    if (!hasSearched) return;
    if (forYouLoading || forYouLocalLoading) return;
    if (!effectiveHasData) {
      setShowEmptyModal(true);
    }
  }, [hasSearched, forYouLoading, forYouLocalLoading, effectiveHasData]);

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
        <h2 className="text-2xl font-bold text-[#1b2a57]">
          Bất động sản dành cho tôi
        </h2>
        {hasPersonalized && (
          <Link
            to="/goi-y-cho-ban"
            className="text-[#1f5fbf] font-semibold hover:underline"
          >
            Xem tất cả
          </Link>
        )}
      </div>

      {/* Modal thông báo fallback nearby */}
      <Modal
        open={showNearbyModal}
        onCancel={() => setShowNearbyModal(false)}
        centered
        width={520}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setShowNearbyModal(false)}
            style={{ background: "#1f5fbf", borderRadius: 8, fontWeight: 600 }}
          >
            Tôi hiểu
          </Button>,
        ]}
        title={
          <div className="text-[17px] font-semibold text-[#1b2a57]">
            Không tìm thấy tin đúng khu vực bạn chọn
          </div>
        }
      >
        <p className="text-[14px] text-gray-600 leading-relaxed mb-2">
          Chúng tôi không tìm thấy bất động sản phù hợp với{" "}
          <b>khu vực bạn đã chọn</b>. Để tránh để trống kết quả, hệ thống đang
          đề xuất thêm các tin từ <b>khu vực lân cận</b>.
        </p>

        {suggestedCityNames.length > 0 && (
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Hiện tại, các gợi ý đang đến từ:{" "}
            <b>{suggestedCityNames.join(", ")}</b>.
          </p>
        )}
      </Modal>

      {/* Modal khi không có kết quả ngay cả sau fallback */}
      <Modal
        open={showEmptyModal}
        onCancel={() => setShowEmptyModal(false)}
        centered
        width={520}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setShowEmptyModal(false)}
            style={{ background: "#1f5fbf", borderRadius: 8, fontWeight: 600 }}
          >
            Tôi hiểu
          </Button>,
        ]}
        title={
          <div className="text-[17px] font-semibold text-[#1b2a57]">
            Rất tiếc, hiện tại chưa có bài đăng phù hợp
          </div>
        }
      >
        <p className="text-[14px] text-gray-600 leading-relaxed mb-2">
          Rất tiếc, hiện tại chúng tôi chưa tìm thấy bất động sản nào phù hợp
          với <b>tiêu chí bạn đã chọn</b>, kể cả khi đã thử mở rộng sang{" "}
          <b>khu vực lân cận</b>.
        </p>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          Bạn có thể:
        </p>
        <ul className="list-disc list-inside text-[13px] text-gray-600 mt-1 space-y-1">
          <li>Thử nới rộng khoảng giá hoặc diện tích.</li>
          <li>Chọn thêm hoặc đổi sang khu vực khác.</li>
          <li>Quay lại sau, vì mỗi ngày sẽ có thêm những bài đăng mới.</li>
        </ul>
      </Modal>

      {/* Intro block */}
      {!effectiveHasData && !forYouLoading && !forYouLocalLoading && (
        <div className="text-center py-14 bg-[#f8fafc] rounded-2xl shadow-inner">
          <h3 className="text-xl font-semibold text-[#1b2a57] mb-2">
            Chào mừng bạn!
          </h3>
          <p className="text-gray-600 mb-6">
            Chọn khu vực, khoảng giá và diện tích để nhận gợi ý.
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

      {/* ===== MODAL CHỌN SỞ THÍCH ===== */}
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
                Chọn khu vực, khoảng giá và diện tích.
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
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowModal(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={forYouLocalLoading}
            onClick={handleSearch}
            style={{ background: "#1f5fbf", borderRadius: 8, fontWeight: 600 }}
          >
            Xem gợi ý
          </Button>,
        ]}
      >
        <div className="space-y-7">
          {/* CITY (multi) */}
          <div>
            <label className="block text-sm font-medium text-[#1b2a57] mb-1.5">
              Bạn muốn mình gợi ý bất động sản ở <b>khu vực nào</b>?
            </label>
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn Tỉnh/Thành phố (có thể chọn nhiều)"
              value={selectedCityIds}
              onChange={(values, opts) => {
                setSelectedCityIds(values);
                const labels = Array.isArray(opts)
                  ? opts.map((o) => o?.label ?? "")
                  : [];
                setSelectedCityLabels(labels);
              }}
              size="large"
              style={{ width: "100%" }}
              options={provinces.map((p) => ({ value: p.id, label: p.name }))}
              loading={loadingProv}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              notFoundContent={loadingProv ? <Spin size="small" /> : null}
              maxTagCount="responsive"
            />
            {selectedCityLabels?.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Ưu tiên: <b>{selectedCityLabels[0]}</b>
                {selectedCityLabels.length > 1 && (
                  <>; kèm theo: {selectedCityLabels.slice(1).join(", ")}</>
                )}
              </div>
            )}
          </div>

          {/* PRICE */}
          <div className="p-5 rounded-xl border border-[#dde4ef] bg-[#f3f6fb]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#1b2a57]">
                Khoảng giá (VND)
              </label>
              <span className="text-xs text-gray-600 font-semibold">
                {(priceRange[0] / 1e9).toFixed(1)} tỷ –{" "}
                {(priceRange[1] / 1e9).toFixed(1)} tỷ
              </span>
            </div>
            <div className="mx-auto w-full">
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

          {/* AREA */}
          <div className="p-5 rounded-xl border border-[#dde4ef] bg-[#f3f6fb]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#1b2a57]">
                Diện tích (m²)
              </label>
              <span className="text-xs text-gray-600 font-semibold">
                {areaRange[0]} m² – {areaRange[1]} m²
              </span>
            </div>
            <div className="mx-auto w-full">
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

      {/* SKELETON */}
      {showSkeleton && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <PropertyCardSkeleton key={`sk-${i}`} />
          ))}
        </div>
      )}

      {/* LIST */}
      {effectiveHasData && !showSkeleton && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[18px] gap-y-[24px] px-1 mt-6">
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

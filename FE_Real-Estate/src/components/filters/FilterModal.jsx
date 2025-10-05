import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { Modal, Button } from "antd";
import FilterChipBar from "./FilterChipBar";
import FilterPanel from "./FilterPanel";

import {
    FILTER_TABS as CHIP_TABS,
    TYPE_OPTIONS_LEFT, TYPE_OPTIONS_RIGHT,
    PRICE_RADIOS, AREA_RADIOS,
    BED_OPTIONS, BATH_OPTIONS,
    DIRECTION_OPTIONS, POSITION_OPTIONS,
} from "@/data/FilterModalData";

/* ===== constants ===== */
const CONTENT_W = 736;

/* helpers */
const splitTwo = (arr) => {
    const mid = Math.ceil(arr.length / 2);
    return [arr.slice(0, mid), arr.slice(mid)];
};

export default function FilterModal({ open, onClose, onApply, initial }) {
    const [types, setTypes] = useState(initial?.types || []);
    const [pricePreset, setPricePreset] = useState(initial?.pricePreset);
    const [priceFrom, setPriceFrom] = useState(initial?.priceFrom ?? null);
    const [priceTo, setPriceTo] = useState(initial?.priceTo ?? null);

    const [areaPreset, setAreaPreset] = useState(initial?.areaPreset);
    const [areaFrom, setAreaFrom] = useState(initial?.areaFrom ?? null);
    const [areaTo, setAreaTo] = useState(initial?.areaTo ?? null);

    const [beds, setBeds] = useState(initial?.beds || []);
    const [baths, setBaths] = useState(initial?.baths || []);
    const [directions, setDirections] = useState(initial?.directions || []);
    const [positions, setPositions] = useState(initial?.positions || []);
    const [activeKey, setActiveKey] = useState("types");
    const wrapperRef = useRef(null);
    const tabsRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [uiReady, setUiReady] = useState(false);
    const predictedLeftRef = useRef(null);

    useLayoutEffect(() => {
        if (open) {
            setUiReady(false);
            predictedLeftRef.current = null;
        }
    }, [open]);

    const recalc = () => {
        const el = tabsRef.current;
        if (!el) return;

        const scrollWidth = Math.round(el.scrollWidth);
        const clientWidth = Math.round(el.clientWidth);
        const maxLeft = scrollWidth - clientWidth;

        const rawLeft = el.scrollLeft;
        const predicted = predictedLeftRef.current;
        const left = predicted != null ? predicted : rawLeft;

        const EPS = 1;
        const overflow = scrollWidth > clientWidth;
        setCanScrollLeft(overflow && left > EPS);
        setCanScrollRight(overflow && left < maxLeft - EPS);
    };

    const getBounds = () => {
        const el = tabsRef.current;
        if (!el) return { maxLeft: 0, left: 0 };
        return {
            maxLeft: Math.round(el.scrollWidth - el.clientWidth),
            left: el.scrollLeft,
        };
    };

    const smoothScrollTo = (target) => {
        const el = tabsRef.current;
        if (!el) return;

        const { maxLeft } = getBounds();
        const goal = Math.max(0, Math.min(target, maxLeft));

        predictedLeftRef.current = goal;
        setCanScrollLeft(goal > 0);
        setCanScrollRight(goal < maxLeft);

        el.scrollTo({ left: goal, behavior: "smooth" });

        let raf = 0;
        const tick = () => {
            recalc();
            const done = Math.abs(el.scrollLeft - goal) < 1;
            if (!done) {
                raf = requestAnimationFrame(tick);
            } else {
                cancelAnimationFrame(raf);
                predictedLeftRef.current = null;
                recalc();
            }
        };
        raf = requestAnimationFrame(tick);
    };

    const robustKick = () => {
        const el = tabsRef.current;
        if (!el) return;

        el.querySelectorAll(".chip-btn").forEach((btn) => (btn.style.flex = "0 0 auto"));
        el.scrollLeft = 0;

        requestAnimationFrame(() => {
            recalc();
            setUiReady(true);
        });

        setTimeout(recalc, 120);
        setTimeout(recalc, 260);

        if (document?.fonts?.ready) {
            document.fonts.ready
                .then(() => {
                    requestAnimationFrame(recalc);
                    setTimeout(recalc, 60);
                })
                .catch(() => { });
        }
    };

    useLayoutEffect(() => {
        if (!open) return;
        const el = tabsRef.current;
        if (!el) return;

        const onScroll = () => recalc();
        el.addEventListener("scroll", onScroll, { passive: true });

        const roTrack = new ResizeObserver(recalc);
        const roWrap = new ResizeObserver(recalc);
        roTrack.observe(el);
        if (wrapperRef.current) roWrap.observe(wrapperRef.current);

        const mo = new MutationObserver(() => requestAnimationFrame(recalc));
        mo.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });

        const onResize = () => requestAnimationFrame(recalc);
        window.addEventListener("resize", onResize);

        requestAnimationFrame(recalc);

        return () => {
            el.removeEventListener("scroll", onScroll);
            roTrack.disconnect();
            roWrap.disconnect();
            mo.disconnect();
            window.removeEventListener("resize", onResize);
        };
    }, [open]);

    const canReset =
        types.length ||
        pricePreset ||
        priceFrom != null ||
        priceTo != null ||
        areaPreset ||
        areaFrom != null ||
        areaTo != null ||
        beds.length ||
        baths.length ||
        directions.length ||
        positions.length;

    const handleReset = () => {
        setTypes([]);
        setPricePreset(undefined);
        setPriceFrom(null);
        setPriceTo(null);
        setAreaPreset(undefined);
        setAreaFrom(null);
        setAreaTo(null);
        setBeds([]);
        setBaths([]);
        setDirections([]);
        setPositions([]);
        robustKick();
    };

    const handleApply = () => {
        onApply?.({
            types,
            pricePreset,
            priceFrom,
            priceTo,
            areaPreset,
            areaFrom,
            areaTo,
            beds,
            baths,
            directions,
            positions,
        });
        onClose?.();
    };

    const showLeft = uiReady && canScrollLeft;
    const showRight = uiReady && canScrollRight;

    useMemo(() => splitTwo(AREA_RADIOS), []);
    useMemo(() => splitTwo(BED_OPTIONS), []);
    useMemo(() => splitTwo(BATH_OPTIONS), []);
    useMemo(() => splitTwo(DIRECTION_OPTIONS), []);
    useMemo(() => splitTwo(POSITION_OPTIONS), []);
    const dirtyMap = {
        types: types.length > 0,
        price: !!(pricePreset || priceFrom != null || priceTo != null),
        area: !!(areaPreset || areaFrom != null || areaTo != null),
        beds: beds.length > 0,
        baths: baths.length > 0,
        dir: directions.length > 0,
        pos: positions.length > 0,
    };
    return (
        <>
            <style>{`
        .ant-modal .ant-modal-header { border-bottom: 1px solid #e5e7eb; }
        .ant-modal .ant-modal-footer { border-top: 1px solid #e5e7eb; padding-top: 14px; }

        .chip-btn {
          border-radius: 999px;
          height: 40px;
          font-weight: 600;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .option-col .ant-checkbox-wrapper,
        .option-col .ant-radio-wrapper { line-height: 24px; }

        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }

        .chip-track {
          scrollbar-gutter: stable both-edges;
          scroll-padding-inline: 24px;
          overflow-y: hidden;
        }
      `}</style>

            <Modal
                open={open}
                onCancel={onClose}
                title="Bộ lọc"
                centered
                maskClosable={false}
                width={CONTENT_W}
                destroyOnClose
                bodyStyle={{ display: "flex", flexDirection: "column", gap: 12 }}
                afterOpenChange={(opened) => {
                    if (opened) robustKick();
                }}
                footer={
                    <div style={{ textAlign: "right" }}>
                        <Button onClick={handleReset} disabled={!canReset}>
                            Đặt lại
                        </Button>
                        <Button type="primary" onClick={handleApply} style={{ marginLeft: 8 }}>
                            Áp dụng
                        </Button>
                    </div>
                }
            >
                {/* ==== CHIP BAR ==== */}
                <FilterChipBar
                    CHIP_TABS={CHIP_TABS}
                    activeKey={activeKey}
                    setActiveKey={setActiveKey}
                    canScrollLeft={showLeft}
                    canScrollRight={showRight}
                    smoothScrollTo={smoothScrollTo}
                    getBounds={getBounds}
                    wrapperRef={wrapperRef}
                    tabsRef={tabsRef}
                    recalc={recalc}
                    dirtyMap={dirtyMap}
                />

                {/* ==== PANELS ==== */}
                <FilterPanel
                    activeKey={activeKey}
                    types={types}
                    setTypes={setTypes}
                    pricePreset={pricePreset}
                    setPricePreset={setPricePreset}
                    priceFrom={priceFrom}
                    setPriceFrom={setPriceFrom}
                    priceTo={priceTo}
                    setPriceTo={setPriceTo}
                    areaPreset={areaPreset}
                    setAreaPreset={setAreaPreset}
                    areaFrom={areaFrom}
                    setAreaFrom={setAreaFrom}
                    areaTo={areaTo}
                    setAreaTo={setAreaTo}
                    beds={beds}
                    setBeds={setBeds}
                    baths={baths}
                    setBaths={setBaths}
                    directions={directions}
                    setDirections={setDirections}
                    positions={positions}
                    setPositions={setPositions}
                    TYPE_OPTIONS_LEFT={TYPE_OPTIONS_LEFT}
                    TYPE_OPTIONS_RIGHT={TYPE_OPTIONS_RIGHT}
                    PRICE_RADIOS={PRICE_RADIOS}
                    AREA_RADIOS={AREA_RADIOS}
                    BED_OPTIONS={BED_OPTIONS}
                    BATH_OPTIONS={BATH_OPTIONS}
                    DIRECTION_OPTIONS={DIRECTION_OPTIONS}
                    POSITION_OPTIONS={POSITION_OPTIONS}
                />
            </Modal>
        </>
    );
}

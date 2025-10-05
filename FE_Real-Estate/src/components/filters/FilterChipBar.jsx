import { Button } from "antd";
import { RightOutlined, LeftOutlined } from "@ant-design/icons";

export default function FilterChipBar({
    CHIP_TABS,
    activeKey,
    setActiveKey,
    canScrollLeft,
    canScrollRight,
    smoothScrollTo,
    getBounds,
    wrapperRef,
    tabsRef,
    recalc,
    dirtyMap = {}, 
}) {
    return (
        <div
            ref={wrapperRef}
            className="relative"
            style={{ margin: "8px 0 16px", overflow: "visible" }}
        >
            {/* Nút trái */}
            <button
                type="button"
                aria-label="Prev tabs"
                onClick={() => {
                    const { left } = getBounds();
                    smoothScrollTo(left - 240);
                }}
                style={{
                    position: "absolute",
                    left: -6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 4px rgba(0,0,0,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                    opacity: canScrollLeft ? 1 : 0,
                    pointerEvents: canScrollLeft ? "auto" : "none",
                    transition: "opacity .2s",
                }}
            >
                <LeftOutlined />
            </button>

            {/* Dải chip (scrollable) */}
            <div
                ref={tabsRef}
                className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth chip-track"
                onWheel={(e) => {
                    const el = e.currentTarget;
                    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                        el.scrollLeft += e.deltaY;
                    }
                    recalc();
                }}
                onMouseEnter={recalc}
                style={{
                    scrollPaddingInline: 24,
                    WebkitOverflowScrolling: "touch",
                    overscrollBehaviorX: "contain",
                }}
            >
                {CHIP_TABS.map((t) => {
                    const active = activeKey === t.key;
                    const isDirty = !!dirtyMap[t.key]; // 👈 Có filter => true

                    return (
                        <span
                            key={t.key}
                            style={{ position: "relative", display: "inline-block" }}
                        >
                            <Button
                                className="chip-btn"
                                type={active ? "primary" : "default"}
                                onClick={() => {
                                    setActiveKey(t.key);
                                    setTimeout(recalc, 0);
                                }}
                                style={{
                                    background: active ? "#1f4fbf" : "#fff",
                                    color: active ? "#fff" : "#374151",
                                    borderColor: active ? "#1f4fbf" : "#d1d5db",
                                    borderRadius: 999,
                                    height: 40,
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {t.label}
                            </Button>
                            {/* Chấm đỏ báo có filter (dirty) */}
                            {isDirty && (
                                <span
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        right: 6,         
                                        top: 0,          
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: "#ef4444",
                                        boxShadow: "0 0 0 2px #fff", 
                                        pointerEvents: "none",
                                        zIndex: 5,       
                                    }}
                                />
                            )}
                        </span>
                    );
                })}
            </div>

            {/* Fade trái */}
            <div
                aria-hidden
                style={{
                    pointerEvents: "none",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 54,
                    background:
                        "linear-gradient(90deg, rgba(255,255,255,1) 40%, rgba(255,255,255,0) 100%)",
                    opacity: canScrollLeft ? 1 : 0,
                    transition: "opacity .2s",
                    zIndex: 1,
                }}
            />

            {/* Fade phải */}
            <div
                aria-hidden
                style={{
                    pointerEvents: "none",
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 54,
                    background:
                        "linear-gradient(270deg, rgba(255,255,255,1) 40%, rgba(255,255,255,0) 100%)",
                    opacity: canScrollRight ? 1 : 0,
                    transition: "opacity .2s",
                    zIndex: 1,
                }}
            />

            {/* Nút phải */}
            <button
                type="button"
                aria-label="Next tabs"
                onClick={() => {
                    const { left } = getBounds();
                    smoothScrollTo(left + 240);
                }}
                style={{
                    position: "absolute",
                    right: -6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 4px rgba(0,0,0,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                    opacity: canScrollRight ? 1 : 0,
                    pointerEvents: canScrollRight ? "auto" : "none",
                    transition: "opacity .2s",
                }}
            >
                <RightOutlined />
            </button>
        </div>
    );
}

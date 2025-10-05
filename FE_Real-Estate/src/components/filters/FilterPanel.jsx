import { Row, Col, Checkbox, Radio, InputNumber, Space } from "antd";

/* ===================== Helpers ===================== */
// Format with thousand separators
const thousandFmt = (v) =>
    v === null || v === undefined ? "" : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Parse back to number
const thousandParse = (v) =>
    v === null || v === undefined ? null : Number(String(v).replace(/[^\d]/g, "") || 0);

// Robust parser for VN price labels -> [from, to] (VND)
const priceLabelToRange = (raw) => {
    if (!raw) return [null, null];

    // normalize dashes, spaces, case
    const label = String(raw)
        .replace(/[–—−-﹘﹣]/g, "-") // all dash variants to '-'
        .replace(/\u00A0/g, " ")    // NBSP -> space
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const num = (s) => Number((s || "").replace(/[^\d]/g, ""));
    const toVND = (n, unit) => (unit?.includes("tỷ") ? n * 1_000_000_000 : n * 1_000_000);

    // "giá thoả thuận"
    if (label.includes("thoả") || label.includes("thỏa")) return [null, null];

    // "dưới 500 triệu"
    let m = label.match(/dưới\s+([\d.,]+)\s*(triệu|tỷ)/i);
    if (m) return [0, toVND(num(m[1]), m[2])];

    // "trên 60 tỷ"
    m = label.match(/trên\s+([\d.,]+)\s*(triệu|tỷ)/i);
    if (m) return [toVND(num(m[1]), m[2]), null];

    // "a - b (triệu|tỷ)"  (left unit may be omitted)
    m = label.match(/([\d.,]+)\s*(triệu|tỷ)?\s*-\s*([\d.,]+)\s*(triệu|tỷ)?/i);
    if (m) {
        const a = num(m[1]);
        const unitA = m[2];
        const b = num(m[3]);
        const unitB = m[4];
        const ua = unitA || unitB || "triệu";
        const ub = unitB || unitA || "triệu";
        return [toVND(a, ua), toVND(b, ub)];
    }

    return [null, null];
};

// Area label -> [from, to] in m² (robust)
const areaLabelToRange = (raw) => {
    if (!raw) return [null, null];
    const label = String(raw)
        .replace(/[–—−-﹘﹣]/g, "-")
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    const num = (s) => Number((s || "").replace(/[^\d]/g, ""));

    // "dưới 30 m²"
    let m = label.match(/dưới\s+([\d.,]+)/i);
    if (m) return [0, num(m[1])];

    // "trên 200 m²"
    m = label.match(/trên\s+([\d.,]+)/i);
    if (m) return [num(m[1]), null];

    // "30 - 50 m²"
    m = label.match(/([\d.,]+)\s*-\s*([\d.,]+)/);
    if (m) return [num(m[1]), num(m[2])];

    return [null, null];
};

export default function FilterPanel({
    activeKey,
    // state
    types, setTypes,
    pricePreset, setPricePreset, priceFrom, setPriceFrom, priceTo, setPriceTo,
    areaPreset, setAreaPreset, areaFrom, setAreaFrom, areaTo, setAreaTo,
    beds, setBeds,
    baths, setBaths,
    directions, setDirections,
    positions, setPositions,
    // options
    TYPE_OPTIONS_LEFT, TYPE_OPTIONS_RIGHT,
    PRICE_RADIOS, AREA_RADIOS,
    BED_OPTIONS, BATH_OPTIONS,
    DIRECTION_OPTIONS, POSITION_OPTIONS,
}) {
    const PANE_MIN_H = 320;

    /* ===== Price: sync preset <-> inputs ===== */
    const onPricePresetChange = (val) => {
        setPricePreset(val);
        const opt = PRICE_RADIOS.find((x) => x.value === val);
        const [from, to] =
            opt && (opt.from != null || opt.to != null)
                ? [opt.from ?? null, opt.to ?? null]
                : priceLabelToRange(opt?.label || "");
        setPriceFrom(from);
        setPriceTo(to);
    };
    const onPriceFromChange = (v) => {
        setPriceFrom(v === null ? null : Number(v));
        if (pricePreset) setPricePreset(undefined);
    };
    const onPriceToChange = (v) => {
        setPriceTo(v === null ? null : Number(v));
        if (pricePreset) setPricePreset(undefined);
    };

    /* ===== Area: sync preset <-> inputs ===== */
    const onAreaPresetChange = (val) => {
        setAreaPreset(val);
        const [from, to] = areaLabelToRange(val);
        setAreaFrom(from);
        setAreaTo(to);
    };
    const onAreaFromChange = (v) => {
        setAreaFrom(v === null ? null : Number(v));
        if (areaPreset) setAreaPreset(undefined);
    };
    const onAreaToChange = (v) => {
        setAreaTo(v === null ? null : Number(v));
        if (areaPreset) setAreaPreset(undefined);
    };

    return (
        <>
            {/* ===== TYPES ===== */}
            {activeKey === "types" && (
                <div style={{ minHeight: PANE_MIN_H }}>
                    <Row gutter={24}>
                        <Col span={12} className="option-col">
                            <Checkbox.Group value={types} onChange={setTypes} style={{ width: "100%" }}>
                                <Space direction="vertical" size={10}>
                                    {TYPE_OPTIONS_LEFT.map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </Col>
                        <Col span={12} className="option-col">
                            <Checkbox.Group value={types} onChange={setTypes} style={{ width: "100%" }}>
                                <Space direction="vertical" size={10}>
                                    {TYPE_OPTIONS_RIGHT.map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </Col>
                    </Row>
                </div>
            )}

            {/* ===== PRICE ===== */}
            {activeKey === "price" && (
                <div style={{ minHeight: PANE_MIN_H }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <div style={{ marginBottom: 8, color: "#6b7280" }}>Từ</div>
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                addonAfter="tỷ"
                                value={priceFrom}
                                formatter={thousandFmt}
                                parser={thousandParse}
                                onChange={onPriceFromChange}
                            />
                        </Col>
                        <Col span={12}>
                            <div style={{ marginBottom: 8, color: "#6b7280" }}>Đến</div>
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                addonAfter="tỷ"
                                value={priceTo}
                                formatter={thousandFmt}
                                parser={thousandParse}
                                onChange={onPriceToChange}
                            />
                        </Col>
                    </Row>

                    <Row gutter={24} style={{ marginTop: 16 }}>
                        <Col span={12} className="option-col">
                            <Radio.Group onChange={(e) => onPricePresetChange(e.target.value)} value={pricePreset}>
                                <Space direction="vertical" size={10}>
                                    {PRICE_RADIOS.slice(0, 7).map((x) => (
                                        <Radio key={x.value} value={x.value}>{x.label}</Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </Col>
                        <Col span={12} className="option-col">
                            <Radio.Group onChange={(e) => onPricePresetChange(e.target.value)} value={pricePreset}>
                                <Space direction="vertical" size={10}>
                                    {PRICE_RADIOS.slice(7).map((x) => (
                                        <Radio key={x.value} value={x.value}>{x.label}</Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </Col>
                    </Row>
                </div>
            )}

            {/* ===== AREA ===== */}
            {activeKey === "area" && (
                <div style={{ minHeight: PANE_MIN_H }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <div style={{ marginBottom: 8, color: "#6b7280" }}>Từ</div>
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                addonAfter="m²"
                                value={areaFrom}
                                formatter={thousandFmt}
                                parser={thousandParse}
                                onChange={onAreaFromChange}
                            />
                        </Col>
                        <Col span={12}>
                            <div style={{ marginBottom: 8, color: "#6b7280" }}>Đến</div>
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                addonAfter="m²"
                                value={areaTo}
                                formatter={thousandFmt}
                                parser={thousandParse}
                                onChange={onAreaToChange}
                            />
                        </Col>
                    </Row>

                    <Row gutter={24} style={{ marginTop: 16 }}>
                        <Col span={12} className="option-col">
                            <Radio.Group onChange={(e) => onAreaPresetChange(e.target.value)} value={areaPreset}>
                                <Space direction="vertical" size={10}>
                                    {AREA_RADIOS.slice(0, 5).map((label) => (
                                        <Radio key={label} value={label}>{label}</Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </Col>
                        <Col span={12} className="option-col">
                            <Radio.Group onChange={(e) => onAreaPresetChange(e.target.value)} value={areaPreset}>
                                <Space direction="vertical" size={10}>
                                    {AREA_RADIOS.slice(5).map((label) => (
                                        <Radio key={label} value={label}>{label}</Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </Col>
                    </Row>
                </div>
            )}

            {/* ===== BEDS ===== */}
            {activeKey === "beds" && (
                <div style={{ minHeight: PANE_MIN_H }}>
                    <Checkbox.Group value={beds} onChange={setBeds} style={{ width: "100%" }}>
                        <Row gutter={24}>
                            <Col span={12} className="option-col">
                                <Space direction="vertical" size={10}>
                                    {BED_OPTIONS.slice(0, 3).map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Col>
                            <Col span={12} className="option-col">
                                <Space direction="vertical" size={10}>
                                    {BED_OPTIONS.slice(3).map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Col>
                        </Row>
                    </Checkbox.Group>
                </div>
            )}

            {/* ===== BATHS ===== */}
            {activeKey === "baths" && (
                <div style={{ minHeight: PANE_MIN_H }}>
                    <Checkbox.Group value={baths} onChange={setBaths} style={{ width: "100%" }}>
                        <Row gutter={24}>
                            <Col span={12} className="option-col">
                                <Space direction="vertical" size={10}>
                                    {BATH_OPTIONS.slice(0, 2).map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Col>
                            <Col span={12} className="option-col">
                                <Space direction="vertical" size={10}>
                                    {BATH_OPTIONS.slice(2).map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Col>
                        </Row>
                    </Checkbox.Group>
                </div>
            )}

            {/* ===== DIRECTION ===== */}
            {activeKey === "dir" && (
                <div style={{ minHeight: PANE_MIN_H }}>
                    <Checkbox.Group value={directions} onChange={setDirections} style={{ width: "100%" }}>
                        <Row gutter={24}>
                            <Col span={12} className="option-col">
                                <Space direction="vertical" size={10}>
                                    {DIRECTION_OPTIONS.slice(0, 4).map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Col>
                            <Col span={12} className="option-col">
                                <Space direction="vertical" size={10}>
                                    {DIRECTION_OPTIONS.slice(4).map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Col>
                        </Row>
                    </Checkbox.Group>
                </div>
            )}

            {/* ===== POSITION ===== */}
            {activeKey === "pos" && (
                <div style={{ minHeight: PANE_MIN_H }}>
                    <Checkbox.Group value={positions} onChange={setPositions} style={{ width: "100%" }}>
                        <Row gutter={24}>
                            <Col span={12} className="option-col">
                                <Space direction="vertical" size={10}>
                                    {POSITION_OPTIONS.slice(0, 2).map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Col>
                            <Col span={12} className="option-col">
                                <Space direction="vertical" size={10}>
                                    {POSITION_OPTIONS.slice(2).map((x) => (
                                        <Checkbox key={x} value={x}>{x}</Checkbox>
                                    ))}
                                </Space>
                            </Col>
                        </Row>
                    </Checkbox.Group>
                </div>
            )}
        </>
    );
}

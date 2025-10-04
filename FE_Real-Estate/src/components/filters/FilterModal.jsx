import { useMemo, useRef, useState } from "react";
import {
    Modal,
    Checkbox,
    Radio,
    InputNumber,
    Space,
    Button,
    Row,
    Col,
} from "antd";
import { RightOutlined } from "@ant-design/icons";

const TYPE_OPTIONS_LEFT = [
    "Nhà ngõ, hẻm",
    "Nhà biệt thự",
    "Nhà liền kề",
    "Officetel",
    "Căn hộ duplex",
    "Đất thổ cư",
    "Đất nông nghiệp",
    "Nhà xưởng/Kho bãi",
];
const TYPE_OPTIONS_RIGHT = [
    "Nhà mặt tiền",
    "Căn hộ chung cư",
    "Căn hộ studio",
    "Căn hộ dịch vụ",
    "Penthouse",
    "Đất nền dự án",
    "Mặt bằng kinh doanh",
    "Biệt thự/Shophouse/Nhà phố thương mại",
];

const PRICE_RADIOS = [
    { label: "Dưới 500 triệu", value: "0-0.5" },
    { label: "800 triệu - 1 tỷ", value: "0.8-1" },
    { label: "2 - 3 tỷ", value: "2-3" },
    { label: "5 - 7 tỷ", value: "5-7" },
    { label: "10 - 20 tỷ", value: "10-20" },
    { label: "30 - 40 tỷ", value: "30-40" },
    { label: "Trên 60 tỷ", value: "60+" },
    { label: "500 - 800 triệu", value: "0.5-0.8" },
    { label: "1 - 2 tỷ", value: "1-2" },
    { label: "3 - 5 tỷ", value: "3-5" },
    { label: "7 - 10 tỷ", value: "7-10" },
    { label: "20 - 30 tỷ", value: "20-30" },
    { label: "40 - 60 tỷ", value: "40-60" },
    { label: "Giá thoả thuận", value: "thoa-thuan" },
];

const AREA_RADIOS = [
    "Dưới 30 m²",
    "30 - 50 m²",
    "50 - 80 m²",
    "80 - 100 m²",
    "100 - 150 m²",
    "150 - 200 m²",
    "200 - 250 m²",
    "250 - 300 m²",
    "300 - 500 m²",
    "Trên 500 m²",
];

const BED_OPTIONS = [
    "1 phòng ngủ",
    "2 phòng ngủ",
    "3 phòng ngủ",
    "4 phòng ngủ",
    "5 phòng ngủ",
    "6+ phòng ngủ",
];
const BATH_OPTIONS = [
    "1 phòng tắm",
    "2 phòng tắm",
    "3 phòng tắm",
    "4+ phòng tắm",
];

export default function FilterModal({ open, onClose, onApply, initial }) {
    // ---- state filters
    const [types, setTypes] = useState(initial?.types || []);
    const [pricePreset, setPricePreset] = useState(initial?.pricePreset);
    const [priceFrom, setPriceFrom] = useState(initial?.priceFrom ?? null);
    const [priceTo, setPriceTo] = useState(initial?.priceTo ?? null);

    const [areaPreset, setAreaPreset] = useState(initial?.areaPreset);
    const [areaFrom, setAreaFrom] = useState(initial?.areaFrom ?? null);
    const [areaTo, setAreaTo] = useState(initial?.areaTo ?? null);

    const [beds, setBeds] = useState(initial?.beds || []);
    const [baths, setBaths] = useState(initial?.baths || []);

    // ---- tab state (chip tabs)
    const [activeKey, setActiveKey] = useState("types");
    const tabsRef = useRef(null);

    const canReset = useMemo(
        () =>
            types.length ||
            pricePreset ||
            priceFrom != null ||
            priceTo != null ||
            areaPreset ||
            areaFrom != null ||
            areaTo != null ||
            beds.length ||
            baths.length,
        [types, pricePreset, priceFrom, priceTo, areaPreset, areaFrom, areaTo, beds, baths]
    );

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
        });
        onClose?.();
    };

    // ---- chip items
    const CHIP_TABS = [
        { key: "types", label: "Loại BĐS" },
        { key: "price", label: "Khoảng giá" },
        { key: "area", label: "Diện tích" },
        { key: "beds", label: "Số phòng ngủ" },
        { key: "baths", label: "Số phòng tắm" },
    ];

    const scrollChips = () => {
        if (!tabsRef.current) return;
        tabsRef.current.scrollBy({ left: 180, behavior: "smooth" });
    };

    // ---- fixed sizing
    const BODY_W = 736; // content width (not including padding)
    const BODY_H = 560; // content height
    const PAD = 16;     // body padding
    const MODAL_W = BODY_W + PAD * 2; // = 768

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title="Bộ lọc"
            width={MODAL_W}
            centered
            destroyOnClose
            maskClosable={false}
            bodyStyle={{
                height: BODY_H,   // 560
                padding: PAD,     // 16
                overflow: "auto", // body cuộn, header/footer đứng yên
            }}
            footer={
                <Space>
                    <Button onClick={handleReset} disabled={!canReset}>
                        Đặt lại
                    </Button>
                    <Button type="primary" onClick={handleApply}>
                        Áp dụng
                    </Button>
                </Space>
            }
        >
            {/* ===== CHIP BAR ===== */}
            <div style={{ position: "relative", marginBottom: 16 }}>
                <div
                    ref={tabsRef}
                    style={{
                        display: "flex",
                        gap: 12,
                        overflowX: "auto",
                        paddingRight: 40,
                        scrollBehavior: "smooth",
                    }}
                >
                    {CHIP_TABS.map((t) => {
                        const active = activeKey === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setActiveKey(t.key)}
                                style={{
                                    padding: "0 20px",
                                    height: 40,
                                    borderRadius: 999,
                                    border: "1px solid",
                                    borderColor: active ? "#1f4fbf" : "#d1d5db",
                                    color: active ? "#fff" : "#374151",
                                    background: active ? "#1f4fbf" : "#fff",
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                    boxShadow: active ? "0 1px 4px rgba(0,0,0,.12)" : "none",
                                }}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* right chevron */}
                <button
                    type="button"
                    onClick={scrollChips}
                    title="Next"
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 36,
                        height: 36,
                        borderRadius: "999px",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
                    }}
                >
                    <RightOutlined />
                </button>
            </div>

            {/* ===== PANES ===== */}
            {activeKey === "types" && (
                <div style={{ minHeight: 360, overflowX: "hidden" }}>
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Checkbox.Group
                                value={types}
                                onChange={setTypes}
                                style={{ width: "100%" }}
                            >
                                <Space direction="vertical">
                                    {TYPE_OPTIONS_LEFT.map((x) => (
                                        <Checkbox key={x} value={x}>
                                            {x}
                                        </Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </Col>
                        <Col xs={24} md={12}>
                            <Checkbox.Group
                                value={types}
                                onChange={setTypes}
                                style={{ width: "100%" }}
                            >
                                <Space direction="vertical">
                                    {TYPE_OPTIONS_RIGHT.map((x) => (
                                        <Checkbox key={x} value={x}>
                                            {x}
                                        </Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </Col>
                    </Row>
                </div>
            )}

            {activeKey === "price" && (
                <div style={{ minHeight: 360, overflowX: "hidden" }}>
                    <Row gutter={16}>
                        <Col xs={24} md={10}>
                            <div style={{ marginBottom: 8, color: "#6b7280" }}>Từ</div>
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                addonAfter="tỷ"
                                value={priceFrom}
                                onChange={setPriceFrom}
                            />
                        </Col>
                        <Col xs={24} md={10}>
                            <div style={{ marginBottom: 8, color: "#6b7280" }}>Đến</div>
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                addonAfter="tỷ"
                                value={priceTo}
                                onChange={setPriceTo}
                            />
                        </Col>
                    </Row>

                    <Row gutter={24} style={{ marginTop: 16 }}>
                        <Col xs={24} md={12}>
                            <Radio.Group
                                onChange={(e) => setPricePreset(e.target.value)}
                                value={pricePreset}
                            >
                                <Space direction="vertical">
                                    {PRICE_RADIOS.slice(0, 7).map((x) => (
                                        <Radio key={x.value} value={x.value}>
                                            {x.label}
                                        </Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </Col>
                        <Col xs={24} md={12}>
                            <Radio.Group
                                onChange={(e) => setPricePreset(e.target.value)}
                                value={pricePreset}
                            >
                                <Space direction="vertical">
                                    {PRICE_RADIOS.slice(7).map((x) => (
                                        <Radio key={x.value} value={x.value}>
                                            {x.label}
                                        </Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </Col>
                    </Row>
                </div>
            )}

            {activeKey === "area" && (
                <div style={{ minHeight: 360 }}>
                    <Row gutter={16}>
                        <Col xs={24} md={10}>
                            <div style={{ marginBottom: 8, color: "#6b7280" }}>Từ</div>
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                addonAfter="m²"
                                value={areaFrom}
                                onChange={setAreaFrom}
                            />
                        </Col>
                        <Col xs={24} md={10}>
                            <div style={{ marginBottom: 8, color: "#6b7280" }}>Đến</div>
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                addonAfter="m²"
                                value={areaTo}
                                onChange={setAreaTo}
                            />
                        </Col>
                    </Row>

                    <div style={{ marginTop: 16 }}>
                        <Radio.Group
                            onChange={(e) => setAreaPreset(e.target.value)}
                            value={areaPreset}
                        >
                            <Space direction="vertical">
                                {AREA_RADIOS.map((label) => (
                                    <Radio key={label} value={label}>
                                        {label}
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                    </div>
                </div>
            )}

            {activeKey === "beds" && (
                <div style={{ minHeight: 360 }}>
                    <Checkbox.Group value={beds} onChange={setBeds}>
                        <Space direction="vertical">
                            {BED_OPTIONS.map((x) => (
                                <Checkbox key={x} value={x}>
                                    {x}
                                </Checkbox>
                            ))}
                        </Space>
                    </Checkbox.Group>
                </div>
            )}

            {activeKey === "baths" && (
                <div style={{ minHeight: 360 }}>
                    <Checkbox.Group value={baths} onChange={setBaths}>
                        <Space direction="vertical">
                            {BATH_OPTIONS.map((x) => (
                                <Checkbox key={x} value={x}>
                                    {x}
                                </Checkbox>
                            ))}
                        </Space>
                    </Checkbox.Group>
                </div>
            )}
        </Modal>
    );
}

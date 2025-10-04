// src/pages/Home/index.jsx
import { useState } from "react";
import {
    Input,
    Button,
    Dropdown,
    Carousel,
    Tag,
} from "antd";
import {
    SearchOutlined,
    FilterOutlined,
    HomeOutlined,
    ApartmentOutlined,
    EnvironmentOutlined,
    BankOutlined,
} from "@ant-design/icons";
import FeatureTools from "../../components/button/FeatureTools";
import FeaturedList from "../../components/cards/FeaturedList";
import ExploreAmenities from "../../components/sections/ExploreAmenities";
import FeaturedProjects from "../../components/sections/FeaturedProjects";

const trending = [
    "mua nhà phố bình tân dưới 7 tỷ",
    "bán nhà tân phú",
    "nhà tân bình 3-7 tỷ",
    "nhà đất bình thạnh",
    "nhà hẻm đẹp gò vấp",
    "bán căn hộ quận 7",
    "bán nhà đất quận 8",
];

export default function Home() {
    const [mode, setMode] = useState("buy"); // 'buy' | 'rent'
    const [query, setQuery] = useState("");
    const [type, setType] = useState(null);

    const handleSearch = () => {
        // TODO: nối API tìm kiếm
        console.log({ mode, type, query });
    };

    const typeMenu = {
        items: [
            { key: "can-ho", label: "Căn hộ", icon: <ApartmentOutlined /> },
            { key: "nha-pho", label: "Nhà phố", icon: <HomeOutlined /> },
            { key: "biet-thu", label: "Biệt thự", icon: <BankOutlined /> },
            { key: "dat-nen", label: "Đất nền", icon: <EnvironmentOutlined /> },
        ],
        onClick: ({ key }) => setType(key),
    };

    return (
        <div className="w-full">
            {/* ================= HERO (nền xanh) ================= */}
            <section className="relative w-full bg-gradient-to-br from-[#1b2a57] via-[#23356c] to-[#2b5aa6] text-white">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 pt-10 lg:pt-16 pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Left: Heading + Desc */}
                        <div>
                            <h1 className="text-[36px] leading-[1.15] font-extrabold sm:text-[44px] lg:text-[56px]">
                                Tìm nhà thông thái
                                <br />Thoải mái an cư
                            </h1>
                            <p className="mt-4 text-white/85 text-[15px] lg:text-[17px] max-w-[560px]">
                                Nền tảng bất động sản đầu tiên tối ưu trải nghiệm tìm bất động sản theo
                                tiêu chí nâng cao. Hàng ngàn bất động sản phù hợp <span className="font-semibold">dành riêng cho bạn</span>. Bắt đầu tìm kiếm ngay!
                            </p>
                        </div>

                        {/* Right: Banner / Carousel */}
                        <div className="w-full">
                            <div className="bg-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <Carousel autoplay dots className="h-[220px] sm:h-[260px] lg:h-[300px]">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-full">
                                            <img
                                                className="w-full h-[220px] sm:h-[260px] lg:h-[300px] object-cover"
                                                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop"
                                                alt={`banner-${i}`}
                                            />
                                        </div>
                                    ))}
                                </Carousel>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= SEARCH (tràn xuống nền trắng) ================= */}
            <section className="-mt-12 lg:-mt-16 relative z-20">
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
                    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden">
                        {/* Pills Mua / Thuê */}
                        <div className="px-6 pt-5">
                            <div className="inline-flex bg-[#eef3fb] rounded-full p-1">
                                <button
                                    onClick={() => setMode("buy")}
                                    className={`px-6 py-2 rounded-full font-semibold transition ${mode === "buy" ? "bg-[#17306b] text-white shadow" : "text-[#17306b]"
                                        }`}
                                >
                                    Mua
                                </button>
                                <button
                                    onClick={() => setMode("rent")}
                                    className={`px-6 py-2 rounded-full font-semibold transition ${mode === "rent" ? "bg-[#17306b] text-white shadow" : "text-[#17306b]"
                                        }`}
                                >
                                    Thuê
                                </button>
                            </div>
                        </div>

                        {/* Hàng controls: Chọn BĐS + Input + Tìm kiếm */}
                        <div className="px-6 pb-5 pt-4">
                            <div className="flex flex-col lg:flex-row gap-3">
                                <Dropdown menu={typeMenu} trigger={["click"]}>
                                    <Button
                                        size="large"
                                        icon={<FilterOutlined />}
                                        className="lg:w-[220px] w-full h-[44px] !rounded-xl !border-none !bg-[#f1f5ff] hover:!bg-[#e8efff] text-[#17306b] font-semibold shadow-sm"
                                    >
                                        {type
                                            ? {
                                                "can-ho": "Căn hộ",
                                                "nha-pho": "Nhà phố",
                                                "biet-thu": "Biệt thự",
                                                "dat-nen": "Đất nền",
                                            }[type]
                                            : "Chọn BĐS"}
                                    </Button>
                                </Dropdown>

                                <Input
                                    size="large"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Địa chỉ, tên dự án, khu vực, thời gian di chuyển..."
                                    className="flex-1 h-[44px] !rounded-xl"
                                    onPressEnter={handleSearch}
                                />

                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<SearchOutlined />}
                                    className="h-[44px] !rounded-xl bg-[#17306b] hover:!bg-[#122659] px-6 font-semibold"
                                    onClick={handleSearch}
                                >
                                    Tìm kiếm
                                </Button>
                            </div>

                            {/* Xu hướng tìm kiếm */}
                            <div className="mt-4">
                                <div className="text-gray-800 font-semibold mb-2">Xu hướng tìm kiếm</div>
                                <div className="flex flex-wrap gap-2">
                                    {trending.map((t) => (
                                        <Tag
                                            key={t}
                                            onClick={() => setQuery(t)}
                                            className="cursor-pointer rounded-full px-3 py-1 bg-[#eef6ff] hover:bg-[#e1efff] border-none text-[#1f5fbf]"
                                        >
                                            <span className="mr-1">📈</span>
                                            {t}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#f7fafc] pt-12 lg:pt-16 pb-24">
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
                    <FeatureTools />
                    <FeaturedList />
                    <ExploreAmenities />
                    <FeaturedProjects />
                </div>
            </section>
        </div>
    );
}

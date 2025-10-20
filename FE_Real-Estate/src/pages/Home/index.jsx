import { useEffect, useState } from "react";
import { Carousel, Modal } from "antd";
import FeatureTools from "../../components/button/FeatureTools";
import FeaturedList from "../../components/cards/FeaturedList";
import FeaturedProjects from "../../components/sections/FeaturedProjects";
import FirstTimeBuyerGuide from "../../components/sections/FirstTimeBuyerGuide";
import BannerCta from "../../components/sections/BannerCta";
import bannerPlanning from "../../assets/home-section4-image-bg.png";
import bannerResearch from "../../assets/home-section6-image-bg.png";
import bannerPosting from "../../assets/home-section7-image-bg.png";
import bannerContact from "../../assets/home-section8-image-bg.png";
import MetroSearchPanel from "../../components/search/MetroModal";
import SearchCard from "../../components/search/SearchCard"; // 💡 IMPORT COMPONENT MỚI

export default function Home() {
    const [showMetro, setShowMetro] = useState(false);

    useEffect(() => {
        const handleOpen = () => setShowMetro(true);
        window.addEventListener("open-metro-panel", handleOpen);
        return () => window.removeEventListener("open-metro-panel", handleOpen);
    }, []);

    return (
        <div className="w-full">
            {/* ================= HERO ================= */}
            <section className="relative w-full bg-gradient-to-br from-[#1b2a57] via-[#23356c] to-[#2b5aa6] text-white">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 pt-10 lg:pt-16 pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <h1 className="text-[36px] leading-[1.15] font-extrabold sm:text-[44px] lg:text-[56px]">
                                Tìm nhà thông thái<br />Thoải mái an cư
                            </h1>
                            <p className="mt-4 text-white/85 text-[15px] lg:text-[17px] max-w-[560px]">
                                Nền tảng bất động sản đầu tiên tối ưu trải nghiệm tìm bất động sản theo tiêu chí nâng cao. Hàng ngàn bất động sản phù hợp <span className="font-semibold">dành riêng cho bạn</span>. Bắt đầu tìm kiếm ngay!
                            </p>
                        </div>
                        <div className="w-full">
                            <div className="bg-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <Carousel autoplay dots className="h-[220px] sm:h-[260px] lg:h-[300px]">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-full">
                                            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop" alt={`banner-${i}`} />
                                        </div>
                                    ))}
                                </Carousel>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= SEARCH ================= */}
            <SearchCard />

            {/* ================= CONTENT ================= */}
            <section className="bg-[#f7fafc] pt-12 lg:pt-16 pb-24">
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
                    <FeatureTools />
                    <FeaturedList />
                    <BannerCta title="Tra cứu quy hoạch" description={<>Kiểm tra quy hoạch online theo: số tờ, số thửa, tọa độ… với độ chính xác cao và dữ liệu mới nhất.</>} buttonLabel="Khám phá ngay" href="/tra-cuu-quy-hoach" bg={bannerPlanning} side="right" tone="light" minH={300} />
                    <FeaturedProjects />
                    <FirstTimeBuyerGuide />
                    <BannerCta title="Tra cứu kế hoạch" description={<>Kiểm tra quy hoạch online theo: số tờ, số thửa, toạ độ... với độ chính xác cao và dữ liệu mới nhất</>} buttonLabel="Khám phá ngay" href="/dang-tin" bg={bannerResearch} side="left" tone="dark" minH={320} />
                    <BannerCta title="Đăng tin chuyên nghiệp" description={<>Muốn tìm khách hàng chất lượng? Khám phá giải pháp đăng tin toàn diện tại Radanhadat.vn với cực nhiều ưu đãi trong giai đoạn ra mắt nền tảng</>} buttonLabel="Đăng tin ngay" href="/dang-tin" bg={bannerPosting} side="right" tone="dark" minH={320} />
                    <BannerCta title="“Làm” nội thất đẹp mê say" description={<>Giảm ngay 5% khi làm nội thất cùng dg home</>} buttonLabel="Khám phá ngay" href="/dang-tin" bg={bannerContact} side="left" tone="dark" minH={320} />
                </div>
            </section>

            {/* ================= MODALS ================= */}
            <Modal open={showMetro} onCancel={() => setShowMetro(false)} width="90%" footer={null} bodyStyle={{ padding: 0 }}>
                <MetroSearchPanel />
            </Modal>
        </div>
    );
}
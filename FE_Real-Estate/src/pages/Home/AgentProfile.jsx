import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button, Tag, Tooltip } from "antd";
import {
    PhoneOutlined,
    HomeOutlined,
    ApartmentOutlined,
    CrownOutlined,
} from "@ant-design/icons";
import agentApi from "@/api/agentApi";
import PropertyCard from "../../components/cards/PropertyCard";

/* ================== CARD THÔNG TIN MÔI GIỚI ================== */
function AgentInfoCard({ agent }) {
    const [phoneRevealed, setPhoneRevealed] = useState(false);

    const togglePhoneVisibility = () => setPhoneRevealed(!phoneRevealed);

    const maskedPhone = agent?.phoneDisplay
        ? agent.phoneDisplay.slice(0, -4) + " XXXX"
        : "";

    return (
        <aside className="w-full lg:w-[320px]">
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] overflow-hidden">
                {/* Top accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

                <div className="p-5">
                    {/* Avatar + name */}
                    <div className="flex flex-col items-center gap-3 mb-5">
                        {agent?.avatar ? (
                            <div className="relative">
                                <img
                                    src={agent.avatar}
                                    alt={agent.name || "Môi giới"}
                                    className="h-20 w-20 rounded-full object-cover bg-slate-100 border-4 border-white shadow-md"
                                />
                                <span className="absolute -bottom-1 -right-1 inline-flex h-6 items-center rounded-full bg-emerald-500 px-2 text-[11px] font-semibold text-white shadow">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white mr-1" />
                                    Online
                                </span>
                            </div>
                        ) : (
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-sky-400 text-white flex items-center justify-center text-3xl font-semibold shadow-md">
                                {agent?.name?.charAt(0)?.toUpperCase() ?? "U"}
                            </div>
                        )}

                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <p className="font-semibold text-slate-900 text-[17px]">
                                    {agent?.name || "Môi giới bất động sản"}
                                </p>

                            </div>

                            <p className="text-xs text-slate-500 mt-0.5">
                                {agent?.joinText || "Đối tác môi giới trên hệ thống Real Estate"}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 py-2.5 px-2 text-center">
                            <p className="text-[11px] text-slate-500 mb-1 flex items-center justify-center gap-1">
                                <HomeOutlined className="text-[12px]" />
                                Bán
                            </p>
                            <p className="font-semibold text-lg text-slate-900 leading-none">
                                {agent?.sellingCount ?? 0}
                            </p>
                        </div>
                        <div className="rounded-xl border border-blue-50 bg-blue-50/80 py-2.5 px-2 text-center">
                            <p className="text-[11px] text-slate-500 mb-1 flex items-center justify-center gap-1">
                                <ApartmentOutlined className="text-[12px]" />
                                Thuê
                            </p>
                            <p className="font-semibold text-lg text-blue-700 leading-none">
                                {agent?.rentingCount ?? 0}
                            </p>
                        </div>
                        <div className="rounded-xl border border-indigo-50 bg-indigo-50/80 py-2.5 px-2 text-center">
                            <p className="text-[11px] text-slate-500 mb-1">
                                Tổng tin
                            </p>
                            <p className="font-semibold text-lg text-indigo-700 leading-none">
                                {agent?.totalPosts ?? 0}
                            </p>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <Tag color="blue" className="!m-0 text-[11px] px-2 py-0.5 rounded-full">
                            Phản hồi nhanh
                        </Tag>
                        <Tag color="green" className="!m-0 text-[11px] px-2 py-0.5 rounded-full">
                            Tư vấn miễn phí
                        </Tag>
                        <Tag color="gold" className="!m-0 text-[11px] px-2 py-0.5 rounded-full">
                            Kinh nghiệm
                        </Tag>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {agent?.phoneDisplay && (
                            <Button
                                type="primary"
                                className="w-full font-semibold h-11 rounded-xl !bg-gradient-to-r !from-blue-500 !via-indigo-500 !to-sky-500 hover:!from-blue-600 hover:!via-indigo-600 hover:!to-sky-600 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                                size="large"
                                onClick={togglePhoneVisibility}
                                icon={<PhoneOutlined />}
                            >
                                {phoneRevealed ? agent.phoneDisplay : maskedPhone}
                            </Button>
                        )}

                        {agent?.phoneDisplay && (
                            <Button
                                className="w-full h-10 rounded-xl border-slate-200 text-slate-700 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-sm"
                                onClick={() =>
                                    window.open(`https://zalo.me/${agent.phoneFull}`, "_blank")
                                }
                            >
                                Nhắn Zalo
                            </Button>
                        )}

                        <p className="text-[11px] text-slate-400 text-center">
                            Liên hệ trực tiếp để được tư vấn chi tiết về bất động sản.
                        </p>
                    </div>

                </div>
            </div>
        </aside>
    );
}

/* ================== PAGE ================== */
export default function AgentProfile() {
    const { id } = useParams(); // /agent/:id
    const location = useLocation();

    const agentFromState = location.state?.agent || null;

    const [agent, setAgent] = useState(agentFromState);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [activeType, setActiveType] = useState("sell"); // "sell" | "rent"

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (agent?.name) {
            document.title = `${agent.name} | Hồ sơ môi giới`;
        } else {
            document.title = "Hồ sơ môi giới";
        }
    }, [agent]);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        async function fetchAgent() {
            try {
                setLoading(true);
                const res = await agentApi.getProfile(id);
                console.log("Agent profile data", res.data);
                if (!cancelled) {
                    setAgent(res.data);
                }
            } catch (err) {
                console.error("Load agent error", err);
                if (!cancelled && !agentFromState) {
                    setAgent({
                        id,
                        name: "Môi giới bất động sản",
                        joinText: "",
                        sellingCount: 0,
                        rentingCount: 0,
                        totalPosts: 0,
                        phoneDisplay: "",
                        phoneFull: "",
                        zaloText: "Zalo",
                    });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchAgent();
        return () => {
            cancelled = true;
        };
    }, [id, agentFromState]);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        async function fetchListings() {
            try {
                setListLoading(true);
                const res = await agentApi.getListings(id, {
                    type: activeType,
                    page: 0,
                    size: 12,
                });

                const data = res.data;
                const items = Array.isArray(data)
                    ? data
                    : data?.content || data?.items || [];

                if (!cancelled) {
                    setListings(items || []);
                }
            } catch (err) {
                console.error("Load listings error", err);
                if (!cancelled) setListings([]);
            } finally {
                if (!cancelled) setListLoading(false);
            }
        }

        fetchListings();
        return () => {
            cancelled = true;
        };
    }, [id, activeType]);

    if (loading || !agent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
                <div className="px-4 py-3 rounded-xl bg-white/80 border border-slate-100 shadow-sm text-slate-600 text-sm">
                    Đang tải hồ sơ môi giới...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-7">
                {/* Header */}
                <div className="mb-6">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 mb-1">
                        Hồ sơ môi giới
                    </p>
                    <h1 className="text-[26px] md:text-[30px] font-bold text-slate-900">
                        {agent?.name || "Môi giới bất động sản"}
                    </h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Cột trái: môi giới */}
                    <AgentInfoCard agent={agent} />

                    {/* Cột phải: danh sách tin */}
                    <section className="flex-1">
                        <div className="flex flex-col gap-3 mb-4 md:mb-5">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                                    Bất động sản trên toàn quốc
                                </h2>
                                <span className="text-[12px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                                    {listings.length} tin hiển thị
                                </span>
                            </div>

                            {/* Filter chips */}
                            <div className="relative inline-flex bg-slate-100/80 rounded-full p-1 w-fit border border-slate-200/80">
                                {/* Thumb chạy ngang – đổi sang nền xanh */}
                                <div
                                    className={[
                                        "absolute top-1 bottom-1 left-1 w-1/2 rounded-full",
                                        "bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 shadow-sm",
                                        "transition-transform duration-300 ease-out",
                                        activeType === "sell" ? "translate-x-0" : "translate-x-full",
                                    ].join(" ")}
                                />

                                <button
                                    className={[
                                        "relative z-10 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150",
                                        activeType === "sell"
                                            ? "text-white"
                                            : "text-slate-600 hover:text-slate-900",
                                    ].join(" ")}
                                    onClick={() => setActiveType("sell")}
                                >
                                    Tin bán
                                </button>

                                <button
                                    className={[
                                        "relative z-10 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150",
                                        activeType === "rent"
                                            ? "text-white"
                                            : "text-slate-600 hover:text-slate-900",
                                    ].join(" ")}
                                    onClick={() => setActiveType("rent")}
                                >
                                    Tin thuê
                                </button>
                            </div>

                        </div>

                        {listLoading ? (
                            <div className="py-10 text-center text-slate-500">
                                Đang tải danh sách tin...
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="py-10 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                                Môi giới hiện chưa có bất động sản nào thuộc mục này.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {listings.map((raw) => {
                                    const item = {
                                        ...raw,
                                        listingType:
                                            raw.listingType ||
                                            raw.listing_type ||
                                            raw.listing_typePolicy,
                                        priceDisplay: raw.priceDisplay || raw.price,
                                        displayAddress:
                                            raw.displayAddress ||
                                            raw.addressMain ||
                                            raw.addressShort ||
                                            raw.addressFull ||
                                            "",
                                        addressMain:
                                            raw.addressMain ||
                                            raw.displayAddress ||
                                            raw.addressFull ||
                                            raw.addressShort ||
                                            "",
                                    };

                                    return <PropertyCard key={item.id} item={item} />;
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

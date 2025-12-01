// src/pages/UserDashboard/AgentProfile.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button } from "antd";
import agentApi from "@/api/agentApi";
import PropertyCard from "../../components/cards/PropertyCard";

/* ================== CARD THÔNG TIN MÔI GIỚI ================== */
function AgentInfoCard({ agent }) {
    return (
        <aside className="w-full lg:w-[280px]">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                <div className="flex flex-col items-center gap-3 mb-4">
                    {agent?.avatar ? (
                        <img
                            src={agent.avatar}
                            alt={agent.name || "Môi giới"}
                            className="h-16 w-16 rounded-full object-cover bg-gray-100"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold">
                            {agent?.name?.charAt(0) ?? "U"}
                        </div>
                    )}

                    <div className="text-center">
                        <div className="font-semibold text-gray-900">
                            {agent?.name || "Môi giới bất động sản"}
                        </div>
                        {agent?.joinText && (
                            <div className="text-xs text-gray-500 mt-1">
                                {agent.joinText}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center mb-4">
                    <div className="rounded-xl border border-gray-200 py-2 px-3">
                        <div className="text-xs text-gray-500 mb-1">Đang bán</div>
                        <div className="font-semibold text-lg text-gray-900">
                            {agent?.sellingCount ?? 0}
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 py-2 px-3">
                        <div className="text-xs text-gray-500 mb-1">Đang cho thuê</div>
                        <div className="font-semibold text-lg text-gray-900">
                            {agent?.rentingCount ?? 0}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-4 text-center">
                    <div className="text-xs text-gray-600 mb-1">Số tin đã đăng</div>
                    <div className="text-2xl font-semibold text-blue-600">
                        {agent?.totalPosts ?? 0}
                    </div>
                </div>

                <div className="space-y-2">
                    <Button
                        type="default"
                        className="w-full font-semibold flex items-center justify-center gap-2"
                    >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                            Z
                        </span>
                        {agent?.zaloText || "Zalo"}
                    </Button>

                    {agent?.phoneDisplay && (
                        <Button
                            type="primary"
                            className="w-full font-semibold"
                            size="large"
                        >
                            {agent.phoneDisplay}
                        </Button>
                    )}
                </div>
            </div>
        </aside>
    );
}

/* ================== PAGE ================== */
export default function AgentProfile() {
    const { id } = useParams(); // /agent/:id
    const location = useLocation();

    // agent truyền từ InfoRealEstate: navigate(`/agent/${agent.id}`, { state: { agent } })
    const agentFromState = location.state?.agent || null;

    const [agent, setAgent] = useState(agentFromState);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [activeType, setActiveType] = useState("sell"); // "sell" | "rent"

    // cuộn lên đầu
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // title
    useEffect(() => {
        if (agent?.name) {
            document.title = `${agent.name} | Hồ sơ môi giới`;
        } else {
            document.title = "Hồ sơ môi giới";
        }
    }, [agent]);

    // Fetch agent profile (fallback khi F5 / vào thẳng URL)
    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        async function fetchAgent() {
            try {
                setLoading(true);
                const res = await agentApi.getProfile(id);
                if (!cancelled) {
                    setAgent(res.data);
                }
            } catch (err) {
                console.error("Load agent error", err);
                // fallback để UI không trắng
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

    // Fetch danh sách tin theo id môi giới + type
    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        async function fetchListings() {
            try {
                setListLoading(true);
                const res = await agentApi.getListings(id, {
                    type: activeType, // "sell" | "rent"
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
            <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">
                Đang tải hồ sơ môi giới...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Cột trái: môi giới */}
                    <AgentInfoCard agent={agent} />

                    {/* Cột phải: danh sách tin */}
                    <section className="flex-1">
                        <div className="flex flex-col gap-3 mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Bất động sản trên toàn quốc
                            </h1>

                            <div className="inline-flex bg-gray-100 rounded-full p-1 w-fit">
                                <button
                                    className={[
                                        "px-4 py-1.5 rounded-full text-sm font-semibold",
                                        activeType === "sell"
                                            ? "bg-blue-600 text-white shadow"
                                            : "text-gray-600",
                                    ].join(" ")}
                                    onClick={() => setActiveType("sell")}
                                >
                                    Tin bán
                                </button>
                                <button
                                    className={[
                                        "px-4 py-1.5 rounded-full text-sm font-semibold",
                                        activeType === "rent"
                                            ? "bg-blue-600 text-white shadow"
                                            : "text-gray-600",
                                    ].join(" ")}
                                    onClick={() => setActiveType("rent")}
                                >
                                    Tin thuê
                                </button>
                            </div>
                        </div>

                        {listLoading ? (
                            <div className="py-10 text-center text-gray-500">
                                Đang tải danh sách tin...
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="py-10 text-center text-gray-500">
                                Môi giới hiện chưa có bất động sản nào thuộc mục này.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {listings.map((raw) => {
                                    const item = {
                                        ...raw,
                                        // 🔹 Chuẩn hoá field cho PropertyCard
                                        listingType: raw.listingType || raw.listing_type || raw.listing_typePolicy,

                                        priceDisplay: raw.priceDisplay || raw.price, // BE đang trả price = "2.5 tỷ"

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

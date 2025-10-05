import { useEffect, useState } from "react";
import { Select, Input } from "antd";
import GoogleMapReact from "google-map-react";

export default function MetroSearchPanel() {
    const [stations, setStations] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");

    // ✅ Fetch thật từ API open data (ví dụ: TP.HCM Metro)
    useEffect(() => {
        async function fetchMetro() {
            try {
                const res = await fetch("https://api.opendata.hcmgis.vn/api/metro");
                const data = await res.json();
                setStations(data.features || []);
                setFiltered(data.features || []);
            } catch (err) {
                console.error("Lỗi tải dữ liệu ga metro:", err);
            }
        }
        fetchMetro();
    }, []);

    // ✅ Lọc theo tên ga
    useEffect(() => {
        if (!search.trim()) setFiltered(stations);
        else {
            setFiltered(
                stations.filter((s) =>
                    s.properties.name.toLowerCase().includes(search.toLowerCase())
                )
            );
        }
    }, [search, stations]);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="text-[18px] font-semibold mb-4">Tìm kiếm theo: Ga metro</div>

            <div className="flex gap-3 mb-5">
                <Select
                    defaultValue="Thành phố Hồ Chí Minh"
                    style={{ width: 250 }}
                    options={[{ value: "HCM", label: "Thành phố Hồ Chí Minh" }]}
                />
                <Input
                    placeholder="Nhập tên ga"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Danh sách ga */}
                <div className="max-h-[400px] overflow-y-auto pr-2">
                    {filtered.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            <span className="text-[#d13d3d] font-bold text-sm">M1</span>
                            <div>
                                <div className="font-medium">{item.properties.name}</div>
                                <div className="text-gray-500 text-sm">
                                    {item.properties.address}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Map */}
                <div className="h-[400px] rounded-xl overflow-hidden">
                    <GoogleMapReact
                        bootstrapURLKeys={{
                            key: "YOUR_GOOGLE_MAPS_API_KEY", // 🔑 thêm API key thật
                        }}
                        defaultCenter={{
                            lat: 10.7769,
                            lng: 106.7009,
                        }}
                        defaultZoom={12}
                    >
                        {/* Có thể render marker ở đây */}
                    </GoogleMapReact>
                </div>
            </div>
        </div>
    );
}

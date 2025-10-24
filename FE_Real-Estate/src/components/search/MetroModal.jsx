import { useEffect, useMemo, useRef, useState } from "react";
import { Select, Input } from "antd";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const HCM_CENTER = { lat: 10.7769, lng: 106.7009 };
const RADIUS_M = 20000;

function buildOverpassUrl(center = HCM_CENTER, radius = RADIUS_M) {
    const q = `
  [out:json][timeout:25];
  node["railway"="station"]["station"="subway"](around:${radius},${center.lat},${center.lng});
  out body;`;
    return `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`;
}

export default function MetroSearchPanel({ visible }) {
    const [stations, setStations] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [city, setCity] = useState("HCM");

    const mapRef = useRef(null);
    const mapWrapperRef = useRef(null);

    // ===== Fetch Overpass =====
    useEffect(() => {
        (async () => {
            try {
                const url = buildOverpassUrl(HCM_CENTER, RADIUS_M);
                const res = await fetch(url);
                const data = await res.json();
                const list = (data.elements || [])
                    .filter((el) => el.type === "node")
                    .map((el) => ({
                        id: el.id,
                        name: el.tags?.name || "Unnamed station",
                        address:
                            el.tags?.["addr:full"] ||
                            el.tags?.["addr:street"] ||
                            el.tags?.description ||
                            "",
                        lat: el.lat,
                        lng: el.lon,
                        tags: el.tags || {},
                    }))
                    .reduce((acc, cur) => {
                        const exists = acc.find(
                            (x) =>
                                x.name.toLowerCase() === cur.name.toLowerCase() &&
                                Math.hypot(x.lat - cur.lat, x.lng - cur.lng) < 0.0005
                        );
                        if (!exists) acc.push(cur);
                        return acc;
                    }, []);
                setStations(list);
                setFiltered(list);
            } catch (e) {
                console.error("Lỗi tải dữ liệu ga metro (Overpass):", e);
            }
        })();
    }, [city]);

    // ===== Filter =====
    useEffect(() => {
        if (!search.trim()) setFiltered(stations);
        else {
            const kw = search.toLowerCase();
            setFiltered(
                stations.filter(
                    (s) =>
                        s.name.toLowerCase().includes(kw) ||
                        s.address.toLowerCase().includes(kw)
                )
            );
        }
    }, [search, stations]);

    // ===== Center map =====
    const mapCenter = useMemo(() => {
        if (!filtered.length) return HCM_CENTER;
        const { lat, lng } = filtered[0];
        return { lat, lng };
    }, [filtered]);

    // ===== Map created =====
    const handleMapCreated = (map) => {
        mapRef.current = map;
        setTimeout(() => {
            try {
                map.invalidateSize();
                map.setView([HCM_CENTER.lat, HCM_CENTER.lng], 12, { animate: false });
            } catch { }
        }, 300);
    };

    // ===== When filtered changes =====
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        map.setView([mapCenter.lat, mapCenter.lng], 12, { animate: false });
        const t = setTimeout(() => {
            try {
                map.invalidateSize();
            } catch { }
        }, 200);
        return () => clearTimeout(t);
    }, [mapCenter.lat, mapCenter.lng]);

    // ===== Resize observer =====
    useEffect(() => {
        const el = mapWrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const map = mapRef.current;
            if (map) {
                try {
                    map.invalidateSize();
                } catch { }
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // ===== Re-invalidate when modal visible =====
    useEffect(() => {
        if (typeof visible === "undefined") return;
        const map = mapRef.current;
        if (!map) return;
        const t = setTimeout(() => {
            try {
                map.invalidateSize();
            } catch { }
        }, 300);
        return () => clearTimeout(t);
    }, [visible]);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="text-[18px] font-semibold mb-4">
                Tìm kiếm theo: Ga metro
            </div>

            <div className="flex gap-3 mb-5">
                <Select
                    value={city}
                    style={{ width: 250 }}
                    onChange={setCity}
                    options={[{ value: "HCM", label: "Thành phố Hồ Chí Minh" }]}
                />
                <Input
                    placeholder="Nhập tên ga"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                    allowClear
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Danh sách ga */}
                <div className="max-h-[400px] overflow-y-auto pr-2">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            <span className="text-[#d13d3d] font-bold text-sm">M1</span>
                            <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-gray-500 text-sm">{item.address}</div>
                                {!!item.tags?.operator && (
                                    <div className="text-gray-400 text-xs">
                                        {item.tags.operator}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {!filtered.length && (
                        <div className="text-gray-500 text-sm">
                            Không tìm thấy ga phù hợp.
                        </div>
                    )}
                </div>

                {/* Map */}
                <div
                    ref={mapWrapperRef}
                    className="h-[400px] rounded-xl overflow-hidden"
                    style={{ minHeight: 400 }}
                >
                    <MapContainer
                        center={[mapCenter.lat, mapCenter.lng]}
                        zoom={12}
                        scrollWheelZoom
                        style={{ height: "100%", width: "100%" }}
                        whenCreated={handleMapCreated}
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {filtered.map((s) => (
                            <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={7} weight={2}>
                                <Popup>
                                    <div className="font-semibold">{s.name}</div>
                                    {s.address && (
                                        <div className="text-xs text-gray-600">{s.address}</div>
                                    )}
                                    <div className="text-xs mt-1">
                                        Lat/Lng: {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

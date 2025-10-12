import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const CATEGORIES = [
    { key: "supermarket", label: "Siêu thị", q: "siêu thị", icon: "🛒" },
    { key: "convenience", label: "Cửa hàng tiện lợi", q: "cửa hàng tiện lợi", icon: "🏪" },
    { key: "bus", label: "Trạm xe buýt", q: "trạm xe buýt", icon: "🚌" },
    { key: "hospital", label: "Bệnh viện", q: "bệnh viện", icon: "🏥" },
    { key: "school", label: "Trường học", q: "trường học", icon: "🏫" },
    { key: "airport", label: "Sân bay", q: "sân bay", icon: "✈️" },
];

const bluePin = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
});

const redPin = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
});

const toRad = (v) => (v * Math.PI) / 180;
function haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}
const prettyDistance = (m) => (m < 1000 ? `${m.toLocaleString()} m` : `${(m / 1000).toFixed(2)} km`);

function MapFitter({ center, points }) {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        if (!points?.length) {
            map.setView([center.lat, center.lng], 15);
            return;
        }
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]).concat([[center.lat, center.lng]]));
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [map, center, points]);
    return null;
}

/* Fly tới điểm đang chọn */
function FlyToOnSelect({ selected }) {
    const map = useMap();
    useEffect(() => {
        if (!selected) return;
        map.flyTo([selected.lat, selected.lng], 17, { duration: 0.8 });
    }, [selected, map]);
    return null;
}

/* ================== COMPONENT CHÍNH ================== */
export default function NearbyAmenities({ center, address }) {
    const [cat, setCat] = useState(CATEGORIES[0]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [selected, setSelected] = useState(null); // {id, lat, lng}
    const markerRefs = useRef({}); // id -> L.Marker
    const itemRefs = useRef({});   // id -> HTMLDivElement

    const llParam = useMemo(() => `@${center.lat},${center.lng},15z`, [center.lat, center.lng]);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            setLoading(true);
            setErr("");
            setSelected(null);
            try {
                const { data } = await axios.get("/api/maps/nearby", {
                    params: { q: cat.q, lat: center.lat, lng: center.lng, zoom: 15 },
                });

                const raw = data?.local_results || data?.places || data?.results || [];
                const mapped = raw
                    .map((r, idx) => {
                        const lat = r.gps_coordinates?.latitude ?? r.latitude;
                        const lng = r.gps_coordinates?.longitude ?? r.longitude;
                        if (lat == null || lng == null) return null;
                        const dist = haversineMeters(center.lat, center.lng, lat, lng);
                        return {
                            id: r.place_id || r.position || r.title || `p_${idx}`,
                            title: r.title,
                            address: r.address || r.secondary_text,
                            lat,
                            lng,
                            distance: dist,
                            rating: r.rating,
                            thumbnail: r.thumbnail,
                            link: r.link || r.place_link || r.google_maps_url,
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 40);

                if (!cancelled) setItems(mapped);
            } catch (e) {
                if (!cancelled) {
                    setErr("Không lấy được dữ liệu tiện ích (backend proxy).");
                    setItems([]);
                }
                console.error(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => (cancelled = true);
    }, [cat, llParam, center.lat, center.lng]);

    useEffect(() => {
        if (!selected?.id) return;
        const m = markerRefs.current[selected.id];
        m?.openPopup?.();
        const el = itemRefs.current[selected.id];
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, [selected]);

    const onPick = (it) => setSelected({ id: it.id, lat: it.lat, lng: it.lng });

    return (
        <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
            {/* Header + Tabs */}
            <div className="flex items-center gap-2 p-3 border-b bg-white">
                <div className="text-sm text-gray-500 mr-2">Khám phá tiện ích</div>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => setCat(c)}
                            className={`px-3 py-1.5 rounded-full text-sm border ${c.key === cat.key
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                                }`}
                        >
                            <span className="mr-1">{c.icon}</span>
                            {c.label}
                        </button>
                    ))}
                </div>
                <div className="ml-auto text-xs text-gray-500 hidden md:block truncate max-w-[45%]">
                    Vị trí trung tâm: {address}
                </div>
            </div>

            {/* Body: List + Map */}
            <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Left: List */}
                <div className="md:col-span-4 max-h-[520px] overflow-auto bg-white">
                    {loading && <div className="p-4 text-sm text-gray-500">Đang tải {cat.label}…</div>}
                    {err && <div className="p-4 text-sm text-red-600">{err}</div>}
                    {!loading && !err && items.length === 0 && (
                        <div className="p-4 text-sm text-gray-500">Không có kết quả.</div>
                    )}

                    {items.map((it) => (
                        <div
                            key={it.id}
                            ref={(el) => (itemRefs.current[it.id] = el)}
                            onClick={() => onPick(it)}
                            className={[
                                "p-4 border-b cursor-pointer",
                                selected?.id === it.id ? "bg-blue-50" : "bg-white hover:bg-gray-50",
                            ].join(" ")}
                        >
                            <div className="flex gap-3">
                                {it.thumbnail ? (
                                    <img src={it.thumbnail} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-14 h-14 rounded bg-gray-100 grid place-items-center text-lg">
                                        {CATEGORIES.find((c) => c.key === cat.key)?.icon}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="font-semibold text-gray-900 leading-snug">{it.title}</div>
                                    <div className="text-xs text-gray-500 truncate">{it.address}</div>
                                    <div className="mt-1 inline-flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-semibold">
                                            {prettyDistance(it.distance)}
                                        </span>
                                        {it.rating ? <span className="text-xs text-gray-600">★ {it.rating}</span> : null}
                                        {it.link ? (
                                            <a
                                                className="text-xs text-sky-600 hover:underline"
                                                href={it.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()} // tránh trigger onPick
                                            >
                                                Mở Google Maps
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Map */}
                <div className="md:col-span-8 min-h-[420px]">
                    <MapContainer
                        center={[center.lat, center.lng]}
                        zoom={15}
                        scrollWheelZoom
                        style={{ height: "100%", minHeight: 420 }}
                        className="relative z-[1]" // hạ z-index để không đè header
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Fit theo danh sách điểm */}
                        <MapFitter center={center} points={items.map((x) => ({ lat: x.lat, lng: x.lng }))} />

                        {/* Khi chọn → Bay tới điểm & mở popup */}
                        <FlyToOnSelect selected={selected} />

                        {/* Marker trung tâm BĐS */}
                        <Marker position={[center.lat, center.lng]} icon={redPin}>
                            <Popup>Vị trí bất động sản</Popup>
                        </Marker>

                        {/* Marker tiện ích */}
                        {items.map((it) => (
                            <Marker
                                key={it.id}
                                position={[it.lat, it.lng]}
                                icon={bluePin}
                                ref={(m) => (markerRefs.current[it.id] = m)}
                                eventHandlers={{
                                    click: () => setSelected({ id: it.id, lat: it.lat, lng: it.lng }),
                                }}
                            >
                                <Popup>
                                    <div className="font-semibold">{it.title}</div>
                                    <div className="text-xs text-gray-600">{it.address}</div>
                                    <div className="text-xs mt-1">Cách: {prettyDistance(it.distance)}</div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

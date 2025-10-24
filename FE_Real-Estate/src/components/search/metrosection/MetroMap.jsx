import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { LINES, HCM_CENTER } from "./constants";
import "leaflet/dist/leaflet.css";

/**
 * MetroMap
 * - markers: [{ id, name, address, lat, lng, lineId }]
 * - mapKey: đổi key để re-mount map khi cần reset
 * - height: number px fallback
 * - heightCss: chuỗi CSS chiều cao (vd: "calc(100vh - 240px)")
 */
export default function MetroMap({ markers = [], mapKey, height = 560, heightCss }) {
    const mapRef = useRef(null);
    const wrapperRef = useRef(null);

    const wrapperStyle = heightCss ? { height: heightCss } : { height };

    const mapCenter = useMemo(() => {
        if (markers.length) return { lat: markers[0].lat, lng: markers[0].lng };
        return HCM_CENTER;
    }, [markers]);

    const fitToMarkers = () => {
        const map = mapRef.current;
        if (!map || !markers.length) return;
        const bounds = markers.reduce(
            (acc, m) => {
                acc[0][0] = Math.min(acc[0][0], m.lat);
                acc[0][1] = Math.min(acc[0][1], m.lng);
                acc[1][0] = Math.max(acc[1][0], m.lat);
                acc[1][1] = Math.max(acc[1][1], m.lng);
                return acc;
            },
            [
                [markers[0].lat, markers[0].lng],
                [markers[0].lat, markers[0].lng],
            ]
        );
        try {
            map.fitBounds(bounds, { padding: [24, 24] });
        } catch { }
    };

    const handleReady = (evt) => {
        mapRef.current = evt.target;
        // đợi layout ổn rồi invalidate để tránh “nhảy”
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                try {
                    mapRef.current.invalidateSize();
                    if (markers.length) fitToMarkers();
                    else mapRef.current.setView([mapCenter.lat, mapCenter.lng], 12, { animate: false });
                } catch { }
            })
        );
    };

    // thay đổi markers → fit/center lại
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (markers.length) fitToMarkers();
        else {
            try {
                map.setView([mapCenter.lat, mapCenter.lng], 12, { animate: false });
            } catch { }
        }
        // reflow nhẹ sau khi modal hoàn tất đo đạc
        setTimeout(() => {
            try {
                map.invalidateSize();
            } catch { }
        }, 50);
    }, [markers.length]);

    // theo dõi resize container
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            try {
                mapRef.current?.invalidateSize();
            } catch { }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={wrapperRef} className="w-full rounded-xl overflow-hidden" style={wrapperStyle}>
            <MapContainer
                key={mapKey}
                center={[HCM_CENTER.lat, HCM_CENTER.lng]}
                zoom={12}
                scrollWheelZoom
                className="w-full h-full"
                whenReady={handleReady}
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((m) => {
                    const color = LINES.find((l) => l.id === m.lineId)?.color ?? "#2563eb";
                    return (
                        <CircleMarker
                            key={`${m.id}-${m.lineId}`}
                            center={[m.lat, m.lng]}
                            radius={7}
                            weight={2}
                            pathOptions={{ color }}
                        >
                            <Popup>
                                <div className="font-semibold">{m.name}</div>
                                {m.address && <div className="text-xs text-gray-600">{m.address}</div>}
                                <div className="text-xs mt-1">
                                    Lat/Lng: {m.lat.toFixed(5)}, {m.lng.toFixed(5)}
                                </div>
                                {m.lineId && (
                                    <div className="text-xs mt-1">
                                        Tuyến: <b>{m.lineId}</b>
                                    </div>
                                )}
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

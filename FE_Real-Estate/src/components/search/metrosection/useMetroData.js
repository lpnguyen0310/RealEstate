import { useEffect, useMemo, useRef, useState } from "react";
import { buildOverpassUrl, HCM_CENTER, LINES, normalize, guessLineId } from "./constants";

const RECENT_KEY = "metro_search_recent_v1";

function uniq(arr) {
    return Array.from(new Set(arr));
}

export default function useMetroData() {
    const [allStations, setAllStations] = useState([]);
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState(new Set(["M1", "M2"]));
    const [selectedByLine, setSelectedByLine] = useState({ M1: new Set(), M2: new Set() });

    // ==== recent searches (localStorage) ====
    const [recents, setRecents] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
        } catch {
            return [];
        }
    });

    const addRecent = (term) => {
        const t = term.trim();
        if (!t) return;
        const next = [t, ...recents].slice(0, 8);
        setRecents(next);
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(uniq(next)));
        } catch { }
    };
    const clearRecents = () => {
        setRecents([]);
        try {
            localStorage.removeItem(RECENT_KEY);
        } catch { }
    };

    // ==== fetch OSM ====
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(buildOverpassUrl(HCM_CENTER));
                const data = await res.json();
                const list = (data.elements || [])
                    .filter((el) => el.type === "node")
                    .map((el) => {
                        const tags = el.tags ?? {};
                        const name = tags["name:vi"] || tags.name || tags["name:en"] || "Unnamed station";
                        const address =
                            tags["addr:full:vi"] ||
                            tags["addr:full"] ||
                            tags["addr:street:vi"] ||
                            tags["addr:street"] ||
                            tags.description ||
                            "";
                        return { id: el.id, name, address, lat: el.lat, lng: el.lon, tags, lineId: guessLineId(name) };
                    });

                // dedupe (name ~≈ & near)
                const unique = list.reduce((acc, cur) => {
                    const exists = acc.find(
                        (x) =>
                            normalize(x.name) === normalize(cur.name) &&
                            Math.hypot(x.lat - cur.lat, x.lng - cur.lng) < 0.0005
                    );
                    if (!exists) acc.push(cur);
                    return acc;
                }, []);
                setAllStations(unique);
            } catch (e) {
                console.error("Overpass fetch error:", e);
                setAllStations([]);
            }
        })();
    }, []);

    // OSM lookup
    const stationLookup = useMemo(() => {
        const map = new Map();
        for (const s of allStations) map.set(normalize(s.name), s);
        return map;
    }, [allStations]);

    // Suggestions: tên ga chuẩn trong LINES + tên từ OSM + recents (ưu tiên theo từ khóa)
    const suggestions = useMemo(() => {
        const base = [
            ...LINES.flatMap((ln) => ln.stations.map((n) => n.replace(/^Ga\s+/i, ""))),
            ...allStations.map((s) => s.name.replace(/^Ga\s+/i, "")),
        ];
        const q = normalize(search);
        const filtered = q
            ? base.filter((x) => normalize(x).includes(q))
            : base.slice(0, 50);
        const merged = uniq([...recents, ...filtered]).slice(0, 12);
        return merged.map((label) => ({ value: label, label }));
    }, [search, allStations, recents]);

    // UI list per line (map tên chuẩn → OSM; nếu chưa có, disabled)
    const filteredByLine = useMemo(() => {
        const kw = normalize(search);
        const result = { M1: [], M2: [] };

        for (const ln of LINES) {
            const orderMap = new Map(ln.stations.map((name, i) => [normalize(name), i]));
            const items = ln.stations
                .map((displayName, idx) => {
                    const key = normalize(displayName).replace(/^ga\s+/, "");
                    let matched =
                        stationLookup.get(key) ||
                        [...stationLookup.keys()].map((k) => [k, stationLookup.get(k)]).find(([k]) => k.includes(key))?.[1] ||
                        null;

                    if (matched && matched.lineId == null) matched = { ...matched, lineId: ln.id };

                    return matched
                        ? {
                            id: matched.id,
                            name: displayName.replace(/^Ga\s+/i, ""),
                            address: matched.address || "",
                            lat: matched.lat,
                            lng: matched.lng,
                            lineId: ln.id,
                            disabled: false,
                        }
                        : {
                            id: `placeholder-${ln.id}-${idx}`,
                            name: displayName.replace(/^Ga\s+/i, ""),
                            address: "",
                            lat: null,
                            lng: null,
                            lineId: ln.id,
                            disabled: true,
                        };
                })
                .filter((it) => !kw || normalize(it.name).includes(kw) || (it.address && normalize(it.address).includes(kw)))
                .sort((a, b) => {
                    const ia = orderMap.get(normalize(a.name)) ?? 999;
                    const ib = orderMap.get(normalize(b.name)) ?? 999;
                    return ia - ib || normalize(a.name).localeCompare(normalize(b.name));
                });

            result[ln.id] = items;
        }
        return result;
    }, [search, stationLookup]);

    // markers
    const markers = useMemo(() => {
        const list = [];
        for (const lnId of ["M1", "M2"]) {
            for (const id of (selectedByLine[lnId] || [])) {
                const st = filteredByLine[lnId].find((x) => x.id === id);
                if (st && st.lat != null) list.push(st);
            }
        }
        return list;
    }, [selectedByLine, filteredByLine]);
    const getSelectedMarkers = () => markers;

    // actions
    const toggleExpand = (lineId) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(lineId) ? next.delete(lineId) : next.add(lineId);
            return next;
        });

    const toggleStation = (lineId, stationId, disabled) => {
        if (disabled) return;
        setSelectedByLine((prev) => {
            const next = { M1: new Set(prev.M1), M2: new Set(prev.M2) };
            const bucket = next[lineId];
            bucket.has(stationId) ? bucket.delete(stationId) : bucket.add(stationId);
            return next;
        });
    };

    const clearSelection = () => setSelectedByLine({ M1: new Set(), M2: new Set() });

    return {
        // search
        search,
        setSearch,
        suggestions,
        recents,
        addRecent,
        clearRecents,

        // list & selection
        expanded,
        toggleExpand,
        selectedByLine,
        toggleStation,
        filteredByLine,

        // map
        markers,

        // utils
        clearSelection,
        getSelectedMarkers,
    };
}

import { useEffect, useMemo, useRef, useState } from "react";
import { AutoComplete, Input, Select, Tooltip } from "antd";
import { LINES, normalize } from "./constants";

export default function MetroStationList({
    search,
    setSearch,
    expanded,
    toggleExpand,
    selectedByLine,
    toggleStation,
    filteredByLine,
    suggestions,
     recents,  
    addRecent,
    clearRecents,
}) {
    // debounce local input để gõ mượt
    const [local, setLocal] = useState(search || "");
    const timer = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        setLocal(search || "");
    }, [search]);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setSearch(local), 250);
        return () => clearTimeout(timer.current);
    }, [local]);

    // hotkeys: Ctrl/⌘+K focus — Esc xoá
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") {
                setLocal("");
                setSearch("");
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleSelect = (val) => {
        setLocal(val);
        setSearch(val);
        addRecent(val);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex gap-3 mb-4">
                <Select
                    value="HCM"
                    style={{ width: 260 }}
                    options={[{ value: "HCM", label: "Thành phố Hồ Chí Minh" }]}
                />
                <AutoComplete
                    options={suggestions}
                    onSelect={handleSelect}
                    onSearch={setLocal}
                    value={local}
                    className="flex-1"
                    dropdownMatchSelectWidth={360}
                    notFoundContent={
                        <div className="px-3 py-2 text-sm text-gray-500">Không có gợi ý</div>
                    }
                >
                    <Input
                        ref={inputRef}
                        allowClear
                        placeholder="Nhập tên ga để lọc (tùy chọn) — nhấn Ctrl/⌘+K để focus"
                        onPressEnter={() => handleSelect(local)}
                    />
                </AutoComplete>
            </div>

            <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {LINES.map((ln) => {
                    const isOpen = expanded.has(ln.id);
                    const list = filteredByLine[ln.id] || [];
                    const selectedSet = selectedByLine[ln.id] || new Set();

                    return (
                        <div key={ln.id} className="mb-4">
                            <button
                                onClick={() => toggleExpand(ln.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100"
                            >
                                <div
                                    className="w-10 h-10 rounded-xl grid place-items-center text-white font-bold"
                                    style={{ backgroundColor: ln.color }}
                                >
                                    🚆
                                </div>
                                <div className="text-left">
                                    <div className="text-sm text-gray-500">{ln.title}</div>
                                    <div className="font-semibold">{ln.subtitle}</div>
                                </div>
                                <div className="ml-auto text-gray-400">{isOpen ? "−" : "+"}</div>
                            </button>

                            {isOpen && (
                                <div className="mt-2 pl-2">
                                    {list.map((st) => {
                                        // highlight phần khớp
                                        const kw = normalize(local);
                                        const name = st.name;
                                        const idx = kw ? normalize(name).indexOf(kw) : -1;
                                        const highlighted =
                                            idx >= 0
                                                ? (
                                                    <>
                                                        {name.slice(0, idx)}
                                                        <mark className="bg-yellow-200 px-0.5">{name.slice(idx, idx + local.length)}</mark>
                                                        {name.slice(idx + local.length)}
                                                    </>
                                                )
                                                : name;

                                        const Row = (
                                            <label
                                                key={st.id}
                                                className={`flex items-start gap-3 p-2 rounded-lg ${st.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="mt-1"
                                                    disabled={st.disabled}
                                                    checked={selectedSet.has(st.id)}
                                                    onChange={() => toggleStation(ln.id, st.id, st.disabled)}
                                                />
                                                <span
                                                    className="px-2 py-0.5 text-xs rounded-md font-bold text-white"
                                                    style={{ backgroundColor: ln.color }}
                                                >
                                                    {ln.id}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="font-medium">{highlighted}</div>
                                                    {st.address && <div className="text-gray-500 text-sm line-clamp-1">{st.address}</div>}
                                                    {st.disabled && <div className="text-xs text-gray-400 mt-0.5">Chưa có tọa độ trên OSM</div>}
                                                </div>
                                            </label>
                                        );
                                        return st.disabled ? (
                                            <Tooltip key={st.id} title="Chưa có dữ liệu vị trí trên OpenStreetMap">
                                                {Row}
                                            </Tooltip>
                                        ) : (
                                            Row
                                        );
                                    })}

                                    {!list.length && (
                                        <div className="text-gray-500 text-sm px-2 py-3">Không có ga nào.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* quick actions cho search history */}
            {recents?.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                    <button className="underline" onClick={clearRecents}>Xoá lịch sử tìm kiếm</button>
                </div>
            )}
        </div>
    );
}

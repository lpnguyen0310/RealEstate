// src/components/search/metrosection/MetroModal.jsx
import { Modal, Button } from "antd";
import useMetroData from "./metrosection/useMetroData";
import MetroStationList from "./metrosection/MetroStationList";
import MetroMap from "./metrosection/MetroMap";

export default function MetroModal({ open, onClose, onSearch, mapKey }) {


    const {
        // SEARCH
        search, setSearch, suggestions, addRecent, clearRecents, recents,
        // LIST / SELECT
        expanded, toggleExpand, selectedByLine, toggleStation, filteredByLine,
        // MAP
        markers,
        // UTILS
        clearSelection,
        getSelectedMarkers,                                       // nếu hook có sẵn thì dùng
    } = useMetroData();

    const handleSearch = () => {
        const selected = typeof getSelectedMarkers === "function"
            ? getSelectedMarkers()
            : []; // fallback
        onSearch?.(selected);
        onClose?.();
    };

    return (
        <Modal
            title={<span className="font-semibold">Tìm kiếm theo: <b>Ga Metro</b></span>}
            open={open}
            onCancel={onClose}
            width={1400}
            maskClosable={false}
            destroyOnClose={false}         // giữ DOM để không "dựt"
            centered
            styles={{
                body: {
                    paddingTop: 16,
                    paddingBottom: 0,
                    maxHeight: "calc(100vh - 160px)", // body không vượt viewport
                    overflow: "hidden",
                    transition: "none",
                },
                footer: { marginTop: 0, borderTop: "1px solid #f0f0f0", padding: "12px 24px" },
            }}
            footer={
                <div className="w-full flex items-center justify-end gap-3">
                    <Button type="link" onClick={clearSelection}>Bỏ chọn</Button>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSearch}
                        disabled={!markers?.length}       // markers rỗng thì disabled
                    >
                        Tìm kiếm
                    </Button>                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full min-h-[420px]">
                {/* Cột trái: danh sách + search (scroll riêng) */}
                <div className="flex flex-col min-h-0">
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <MetroStationList
                            search={search}
                            setSearch={setSearch}
                            expanded={expanded}
                            toggleExpand={toggleExpand}
                            selectedByLine={selectedByLine}
                            toggleStation={toggleStation}
                            filteredByLine={filteredByLine}
                            suggestions={suggestions}
                            addRecent={addRecent}
                            recents={recents}
                            clearRecents={clearRecents}
                        />
                    </div>
                </div>

                <MetroMap markers={markers} mapKey={mapKey} height={600} />
            </div>
        </Modal>
    );
}

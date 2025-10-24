// src/components/search/metrosection/MetroModal.jsx
import { Modal, Button } from "antd";
import useMetroData from "./metrosection/useMetroData";
import MetroStationList from "./metrosection/MetroStationList";
import MetroMap from "./metrosection/MetroMap";

export default function MetroModal({ open, onClose, onSearch, mapKey }) {
    const {
        search, setSearch,
        expanded, toggleExpand,
        selectedByLine, toggleStation,
        filteredByLine, markers,
        clearSelection, getSelectedMarkers,
    } = useMetroData();

    const handleSearch = () => {
        const selected = getSelectedMarkers();
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
            destroyOnClose={false} // 🔹 giữ modal trong DOM để không “bật”
            centered
            styles={{
                body: { paddingTop: 16, paddingBottom: 0, transition: "none" }, // 🔹 tránh animation nội bộ
                footer: { marginTop: 0, borderTop: "1px solid #f0f0f0", padding: "12px 24px" },
            }}
            footer={
                <div className="w-full flex items-center justify-end gap-3">
                    <Button type="link" onClick={clearSelection}>
                        Bỏ chọn
                    </Button>
                    <Button type="primary" size="large" onClick={handleSearch}>
                        Tìm kiếm
                    </Button>
                </div>
            }
        >
            <div
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                style={{ minHeight: 560 }}
            >
                <MetroStationList
                    search={search}
                    setSearch={setSearch}
                    expanded={expanded}
                    toggleExpand={toggleExpand}
                    selectedByLine={selectedByLine}
                    toggleStation={toggleStation}
                    filteredByLine={filteredByLine}
                />
                <MetroMap markers={markers} mapKey={mapKey} height={560} />
            </div>
        </Modal>
    );
}

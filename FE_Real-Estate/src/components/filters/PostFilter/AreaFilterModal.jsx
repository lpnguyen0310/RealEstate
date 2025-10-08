// import { useEffect, useMemo, useState } from "react";
// import { Modal, Button, Select } from "antd";

// /** ================== MOCK DATA (có thể thay bằng API) ================== */
// const DATA = {
//     "TP.HCM": {
//         "Quận 1": ["Bến Nghé", "Bến Thành", "Cầu Ông Lãnh", "Cô Giang", "Tân Định"],
//         "Quận 3": ["Võ Thị Sáu", "Phường 7", "Phường 9", "Phường 10"],
//         "TP.Thủ Đức": ["Linh Trung", "Linh Tây", "Bình Thọ", "Hiệp Bình Chánh"],
//         "Quận 7": ["Tân Phú", "Tân Kiểng", "Tân Thuận Đông", "Phú Thuận"],
//         "Quận 10": ["Phường 1", "Phường 5", "Phường 10", "Phường 12"],
//     },
//     "Hà Nội": {
//         "Ba Đình": ["Cống Vị", "Điện Biên", "Giảng Võ", "Kim Mã"],
//         "Hoàn Kiếm": ["Hàng Bạc", "Hàng Gai", "Tràng Tiền", "Phan Chu Trinh"],
//         "Cầu Giấy": ["Dịch Vọng", "Dịch Vọng Hậu", "Quan Hoa", "Yên Hòa"],
//         "Nam Từ Liêm": ["Mĩ Đình 1", "Mĩ Đình 2", "Xuân Phương", "Phú Đô"],
//     },
// };

// const TABS = [
//     { key: "old", label: "Địa chỉ Cũ" },
//     { key: "new", label: "Địa chỉ mới" },
// ];

// /**
//  * Props:
//  * - open: boolean
//  * - onClose: () => void
//  * - defaultValue: { city, district, ward, tab }
//  * - onApply: (value) => void  // value: { city, district, ward, tab }
//  */
// export default function AreaFilterModal({ open, onClose, defaultValue, onApply }) {
//     const [tab, setTab] = useState("old");
//     const [city, setCity] = useState();
//     const [district, setDistrict] = useState();
//     const [ward, setWard] = useState();

//     // nạp default mỗi lần mở modal
//     useEffect(() => {
//         if (!open) return;
//         setTab(defaultValue?.tab || "old");
//         setCity(defaultValue?.city || undefined);
//         setDistrict(defaultValue?.district || undefined);
//         setWard(defaultValue?.ward || undefined);
//     }, [open, defaultValue]);

//     /** ================== OPTIONS ================== */
//     const cityOptions = useMemo(
//         () => Object.keys(DATA).map((c) => ({ value: c, label: c })),
//         []
//     );

//     const districtOptions = useMemo(() => {
//         if (!city) return [];
//         return Object.keys(DATA[city] || {}).map((d) => ({ value: d, label: d }));
//     }, [city]);

//     const wardOptions = useMemo(() => {
//         if (!city || !district) return [];
//         return (DATA[city]?.[district] || []).map((w) => ({ value: w, label: w }));
//     }, [city, district]);

//     /** ================== HANDLERS ================== */
//     const handleReset = () => {
//         setCity(undefined);
//         setDistrict(undefined);
//         setWard(undefined);
//         setTab("old");
//     };

//     const handleApply = () => {
//         onApply?.({ city, district, ward, tab });
//         onClose?.();
//     };

//     /** ================== UI ================== */
//     return (
//         <Modal
//             title={null}
//             open={open}
//             onCancel={onClose}
//             footer={null}
//             centered
//             width="90%"
//             style={{ maxWidth: 560 }}
//             maskClosable={false}
//             destroyOnClose={false}
//             bodyStyle={{
//                 padding: 0, // tự kiểm soát padding bên trong để không làm “nhảy” chiều cao
//             }}
//         >
//             {/* Header */}
//             <div className="px-6 pt-6">
//                 <h3 className="text-[22px] font-semibold text-[#0D1F45]">Bộ lọc theo khu vực</h3>

//                 {/* Tabs (2 nút) */}
//                 <div className="mt-4 flex gap-2">
//                     {TABS.map((t) => {
//                         const active = tab === t.key;
//                         return (
//                             <button
//                                 key={t.key}
//                                 type="button"
//                                 onClick={() => setTab(t.key)}
//                                 className={[
//                                     "h-11 px-5 rounded-2xl font-semibold transition border",
//                                     active
//                                         ? "bg-[#2E5BFF] text-white border-[#2E5BFF]"
//                                         : "bg-[#EEF3FF] text-[#2E5BFF] border-transparent hover:bg-[#e1e9ff]",
//                                 ].join(" ")}
//                             >
//                                 {t.label}
//                             </button>
//                         );
//                     })}
//                 </div>
//             </div>

//             {/* Body */}
//             <div
//                 className="px-6 pb-4"
//                 style={{
//                     // Giữ chiều cao ổn định; nếu nội dung dài sẽ cuộn, không thay đổi khung Modal
//                     minHeight: 340,
//                     maxHeight: "70vh",
//                     overflowY: "auto",
//                 }}
//             >
//                 {/* Hàng: Tỉnh/Thành phố */}
//                 <div className="mt-6">
//                     <div className="text-[15px] font-semibold text-[#0D1F45] mb-2">Tỉnh/Thành phố</div>
//                     <Select
//                         allowClear
//                         placeholder="Chọn tỉnh/thành phố"
//                         value={city}
//                         onChange={(v) => {
//                             setCity(v);
//                             setDistrict(undefined);
//                             setWard(undefined);
//                         }}
//                         options={cityOptions}
//                         className="!w-full !h-[44px] [&_.ant-select-selector]:!border-[#D0D5DD]"
//                     />
//                 </div>

//                 {/* Hàng: Quận/Huyện */}
//                 <div className="mt-5">
//                     <div className="text-[15px] font-semibold text-[#0D1F45] mb-2">Quận/Huyện</div>
//                     <Select
//                         allowClear
//                         placeholder="Chọn quận/huyện"
//                         value={district}
//                         onChange={(v) => {
//                             setDistrict(v);
//                             setWard(undefined);
//                         }}
//                         options={districtOptions}
//                         disabled={!city}
//                         className="!w-full !h-[44px] [&_.ant-select-selector]:!border-[#D0D5DD]"
//                     />
//                 </div>

//                 {/* Hàng: Phường/Xã */}
//                 <div className="mt-5">
//                     <div className="text-[15px] font-semibold text-[#0D1F45] mb-2">Phường/Xã</div>
//                     <Select
//                         allowClear
//                         placeholder="Chọn phường/xã"
//                         value={ward}
//                         onChange={setWard}
//                         options={wardOptions}
//                         disabled={!district}
//                         className="!w-full !h-[44px] [&_.ant-select-selector]:!border-[#D0D5DD]"
//                     />
//                 </div>
//             </div>

//             {/* Footer */}
//             <div className="px-6 pb-6 flex items-center justify-end gap-3">
//                 <Button
//                     onClick={handleReset}
//                     className="!h-[42px] px-5 border-[#D0D5DD] text-[#0D1F45] hover:!border-[#B8C0CC]"
//                 >
//                     Đặt Lại
//                 </Button>
//                 <Button
//                     type="primary"
//                     onClick={handleApply}
//                     disabled={!city}
//                     className="!h-[42px] px-6 bg-[#1D3B67] hover:bg-[#1f4278] font-semibold"
//                 >
//                     Áp Dụng
//                 </Button>
//             </div>
//         </Modal>
//     );
// }

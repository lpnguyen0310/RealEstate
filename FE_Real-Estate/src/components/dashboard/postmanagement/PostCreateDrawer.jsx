import { useMemo, useState } from "react";
import { Drawer, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { TitlePostSection, TradeInfoSection, PropertyDetailSection, PublicImagesSection, VideoLibrarySection, AmenitiesSection, ContactInfoSection } from "./CreatePostSection";
import { useEffect } from "react";
export default function PostCreateDrawer({ open, onClose, onSaveDraft, onContinue, user }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        tradeType: "sell",
        propertyType: "",
        priceType: "sellPrice",
        price: "",
        images: [],
        videoUrls: ["", ""],
        amenities: [],
        contact: { name: "", phone: "", email: "", zalo: "" },
    });
    useEffect(() => {
        if (!user) return;
        setFormData(p => {
            const cur = p.contact || {};
            const next = {
                name: cur.name || user.fullName || user.name || "",
                email: cur.email || user.email || "",
                phone: cur.phone || user.phone || user.phoneNumber || "",
                zalo: cur.zalo || user.zalo || user.zaloPhone || user.phone || user.phoneNumber || "",
            };
            const changed = Object.keys(next).some(k => next[k] !== cur[k]);
            return changed ? { ...p, contact: next } : p;
        });
    }, [user]);
    const [loading, setLoading] = useState(false);

    const onFieldChange = (name, value) => setFormData((p) => ({ ...p, [name]: value }));

    const footer = useMemo(() => (
        <div className="w-full flex justify-end gap-2 px-4 pb-3">
            <Button onClick={onClose}>Huỷ</Button>
            <Button onClick={() => onSaveDraft?.(formData)}>Lưu nháp</Button>
            <Button type="primary" loading={loading} onClick={() => onContinue?.(formData)}>Tiếp tục</Button>
        </div>
    ), [formData, loading, onClose, onSaveDraft, onContinue]);

    return (
        <Drawer
             className="post-create-drawer"
            open={open}
            onClose={onClose}
            width={720}
            placement="right"
            title={null}
            closable={false}
            destroyOnClose
            footer={footer}
            bodyStyle={{ display: "flex", flexDirection: "column", height: "100%", padding: 0, backgroundColor: "#E9EEF8",  }}
            maskStyle={{ backgroundColor: "rgba(15,23,42,.35)", backdropFilter: "blur(2px)" }}
        >
            {/* Header */}
            <div className="sticky top-0 z-10">
                <div className="mx-2 mt-2 rounded-2xl bg-[#eef4ff] border border-[#e5ecff] px-4 py-3 flex items-center justify-between">
                    <div className="text-[18px] md:text-[20px] font-semibold text-[#0f223a]">Tạo tin đăng</div>
                    <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md border border-[#d7def0] text-[#3a5e96] hover:bg-white transition">
                        <CloseOutlined />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-4">
                <TitlePostSection formData={formData} onChange={onFieldChange} />
                <TradeInfoSection formData={formData} setFormData={setFormData} />
                <PropertyDetailSection formData={formData} setFormData={setFormData} provinces={[]} districts={[]} wards={[]} />
                <PublicImagesSection images={formData.images} onChange={(arr) => setFormData((p) => ({ ...p, images: arr }))} />
                <VideoLibrarySection videoUrls={formData.videoUrls} onChange={(arr) => setFormData((p) => ({ ...p, videoUrls: arr }))} />
                <AmenitiesSection value={formData.amenities} onChange={(next) => setFormData((p) => ({ ...p, amenities: next }))} />
                <ContactInfoSection
                    value={formData.contact}
                    onChange={(next) => setFormData((p) => ({ ...p, contact: next }))}
                />
            </div>
        </Drawer>
    );
}

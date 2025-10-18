// src/components/post-create/PostCreateDrawer.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Drawer, Button, Switch, Tooltip, Tag, Spin } from "antd";
import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";

import {
    TitlePostSection, TradeInfoSection, PropertyDetailSection, PublicImagesSection, VideoLibrarySection, AmenitiesSection, ContactInfoSection, PostPreviewSection,
} from "./CreatePostSection";
import PostTypeSection from "./PostTypeDrawer";

// Hooks & utils
import { validateField, validateMany } from "@/utils/validators";
import { useVNLocations, useAddressSuggestions } from "@/hooks";

const REQUIRED_FIELDS = [
    "title",
    "description",
    "propertyType",
    "price",
    "position",
    "landArea",
    "provinceId",
    "districtId",
    "wardId",
    "suggestedAddress",
    "legalDocument",
];

const Header = React.memo(function Header({ step, onClose }) {
    return (
        <div className="mx-2 mt-2 rounded-2xl bg-[#eef4ff] border border-[#e5ecff] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="text-[18px] md:text-[20px] font-semibold text-[#0f223a]">
                    {step === "form" ? "Tạo tin đăng" : "Lựa chọn loại tin đăng và thanh toán"}
                </div>
                {step === "type" && <Tag color="blue" className="rounded-md">Nháp</Tag>}
            </div>
            <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-md border border-[#d7def0] text-[#3a5e96] hover:bg-white transition"
            >
                <CloseOutlined />
            </button>
        </div>
    );
});

const BodyForm = React.memo(function BodyForm({
    formData,
    onFieldChange,
    errors,
    setFormData,
    provinces,
    districts,
    wards,
    loadingDistricts,
    loadingWards,
}) {
    return (
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-4">
            <TitlePostSection formData={formData} onChange={onFieldChange} errors={errors} />
            <TradeInfoSection formData={formData} onChange={onFieldChange} errors={errors} />
            <PropertyDetailSection
                formData={formData}
                setFormData={setFormData}
                provinces={provinces}
                districts={districts}
                wards={wards}
                errors={errors}
                onChange={onFieldChange}
                loadingDistricts={loadingDistricts}
                loadingWards={loadingWards}
            />
            <PublicImagesSection
                images={formData.images}
                onChange={(arr) => setFormData((p) => ({ ...p, images: arr }))}
            />
            <VideoLibrarySection
                videoUrls={formData.videoUrls}
                onChange={(arr) => setFormData((p) => ({ ...p, videoUrls: arr }))}
            />
            <AmenitiesSection
                value={formData.amenityIds}
                onChange={(next) => setFormData(p => ({ ...p, amenityIds: next }))}
            />
            <ContactInfoSection
                value={formData.contact}
                onChange={(next) => setFormData((p) => ({ ...p, contact: next }))}
            />
        </div>
    );
});

const BodyType = React.memo(function BodyType({ postType, setPostType, formData, setFormData }) {
    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-[#f8faff]">
            <PostTypeSection value={postType} onChange={setPostType} />
            <div className="rounded-2xl border border-[#e3e9f5] bg-[#f6f9ff]/40 p-4">
                <PostPreviewSection
                    data={formData}
                    postType={postType}
                    editable
                    onImagesChange={(next) => setFormData((p) => ({ ...p, images: next }))}
                />
            </div>
        </div>
    );
});
const FooterForm = React.memo(function FooterForm({
    onClose,
    onSaveDraft,
    formData,
    loading,
    goToTypeStep,
}) {
    return (
        <div className="w-full flex justify-end gap-2 px-4 pb-3">
            <Button onClick={onClose}>Huỷ</Button>
            <Button onClick={() => onSaveDraft?.(formData)}>Lưu nháp</Button>
            <Button type="primary" loading={loading} onClick={goToTypeStep}>
                Tiếp tục
            </Button>
        </div>
    );
});

const FooterType = React.memo(function FooterType({
    setStep,
    autoRepost,
    setAutoRepost,
    formData,
    postType,
}) {
    return (
        <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-[#e3e9f5] bg-[#f8faff]">
            <Button onClick={() => setStep("form")}>&larr; Quay lại</Button>
            <div className="flex items-center gap-2">
                <Switch checked={autoRepost} onChange={setAutoRepost} />
                <span className="text-gray-700 text-sm">Tự động đăng lại</span>
                <Tooltip title="Tự động đăng lại tin khi hết hạn">
                    <InfoCircleOutlined className="text-gray-500 text-xs" />
                </Tooltip>
            </div>
            <Button
                type="primary"
                className="bg-[#1b264f] hover:bg-[#22347c]"
                onClick={() => {
                    console.log("SUBMIT:", { formData, postType, autoRepost });
                }}
            >
                Đăng tin
            </Button>
        </div>
    );
});

// ----------------- main component -----------------
export default function PostCreateDrawer({ open, onClose, onSaveDraft, onContinue, user }) {
    const [step, setStep] = useState("form");
    const [loading, setLoading] = useState(false);
    const [autoRepost, setAutoRepost] = useState(false);
    const [postType, setPostType] = useState("free");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        categoryId: "",
        tradeType: "sell",
        propertyType: "",
        priceType: "sellPrice",
        price: "",
        images: [],
        videoUrls: ["", ""],
        amenities: [],
        contact: { name: "", phone: "", email: "", zalo: "" },
        provinceId: "",
        districtId: "",
        wardId: "",
        suggestedAddress: "",
        addressSuggestions: [],
        streetName: "",
        streetOptions: [],
        houseNumber: "",
        displayAddress: "",
        position: "",
        landArea: "",
        legalDocument: "",
        bedrooms: 0,
        bathrooms: 0,
    });
    const [errors, setErrors] = useState({});

    // địa giới VN (tải theo open) + loader & hàm fetch con
    const {
        provinces,
        districts,
        wards,
        loadingDistricts,
        loadingWards,
        loadDistricts,
        loadWards,
    } = useVNLocations(open);

    // Prefill contact từ user
    useEffect(() => {
        if (!user) return;
        setFormData((p) => {
            const cur = p.contact || {};
            const next = {
                name: cur.name || user.fullName || user.name || "",
                email: cur.email || user.email || "",
                phone: cur.phone || user.phone || user.phoneNumber || "",
                zalo: cur.zalo || user.zalo || user.zaloPhone || user.phone || user.phoneNumber || "",
            };
            const changed = Object.keys(next).some((k) => next[k] !== cur[k]);
            return changed ? { ...p, contact: next } : p;
        });
    }, [user]);

    // Reset khi đóng Drawer
    useEffect(() => {
        if (!open) {
            setStep("form");
            setLoading(false);
            setAutoRepost(false);
            setPostType("free");
            setErrors({});
        }
    }, [open]);

    // Handler field chung (kèm ràng buộc phụ thuộc)
    const onFieldChange = useCallback((name, value) => {
        // 1) set form
        setFormData((p) => ({ ...p, [name]: value }));

        // 2) validate
        setErrors((prev) => {
            const msg = validateField(name, value);
            const next = { ...prev };
            if (msg) next[name] = msg;
            else delete next[name];
            return next;
        });

        // 3) phụ thuộc
        if (name === "provinceId") {
            setFormData((p) => ({ ...p, districtId: "", wardId: "" }));
            loadDistricts(value);
        }
        if (name === "districtId") {
            setFormData((p) => ({ ...p, wardId: "" }));
            loadWards(value);
        }
        if (name === "suggestedAddress") {
            setFormData((p) => ({ ...p, displayAddress: value }));
        }
    }, [loadDistricts, loadWards]);

    // Tự động gợi ý địa chỉ khi đủ dữ liệu
    useAddressSuggestions(formData, setFormData, provinces, districts, wards);

    // Sang bước chọn loại tin
    const goToTypeStep = useCallback(() => {
        const errs = validateMany(formData, REQUIRED_FIELDS);
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep("type");
            onContinue?.(formData);
        }, 900);
    }, [formData, onContinue]);

    // footer memo để Drawer không re-mount footer mỗi keystroke
    const footerNode = useMemo(() => {
        return step === "form" ? (
            <FooterForm
                onClose={onClose}
                onSaveDraft={onSaveDraft}
                formData={formData}
                loading={loading}
                goToTypeStep={goToTypeStep}
            />
        ) : (
            <FooterType
                setStep={setStep}
                autoRepost={autoRepost}
                setAutoRepost={setAutoRepost}
                formData={formData}
                postType={postType}
            />
        );
    }, [step, onClose, onSaveDraft, formData, loading, goToTypeStep, autoRepost, postType]);

    return (
        <Drawer
            className="post-create"
            open={open}
            onClose={onClose}
            width={720}
            placement="right"
            title={null}
            closable={false}
            destroyOnClose
            footer={footerNode}
            bodyStyle={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: 0,
                backgroundColor: step === "form" ? "#E9EEF8" : "#f8faff",
            }}
            maskStyle={{ backgroundColor: "rgba(15,23,42,.35)", backdropFilter: "blur(2px)" }}
        >
            <div className="sticky top-0 z-10">
                <Header step={step} onClose={onClose} />
            </div>

            {loading && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-white/60">
                    <Spin tip="Đang xử lý thông tin bài đăng..." size="large" />
                </div>
            )}

            {step === "form" ? (
                <BodyForm
                    formData={formData}
                    onFieldChange={onFieldChange}
                    errors={errors}
                    setFormData={setFormData}
                    provinces={provinces}
                    districts={districts}
                    wards={wards}
                    loadingDistricts={loadingDistricts}
                    loadingWards={loadingWards}
                />
            ) : (
                <BodyType postType={postType} setPostType={setPostType} formData={formData} setFormData={setFormData} />
            )}
        </Drawer>
    );
}

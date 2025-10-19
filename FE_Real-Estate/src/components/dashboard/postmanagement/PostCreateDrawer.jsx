import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Drawer, Button, Switch, Tooltip, Tag, Spin } from "antd";
import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { Modal } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import { message } from "antd";
import { createPropertyThunk, fetchMyPropertiesThunk, setPage } from "@/store/propertySlice";
import { useNavigate } from "react-router-dom";

// Các section con
import {
    TitlePostSection,
    TradeInfoSection,
    PropertyDetailSection,
    PublicImagesSection,
    VideoLibrarySection,
    AmenitiesSection,
    ContactInfoSection,
    PostPreviewSection,
} from "./CreatePostSection";
import PostTypeSection from "./PostTypeDrawer";
import { fetchUserInventory } from "@/store/inventorySlice";
// Hooks & utils
import { validateField, validateMany } from "@/utils/validators";
import { useVNLocations, useAddressSuggestions, useListingTypes } from "@/hooks";

const REQUIRED_FIELDS = [
    "title",
    "description",
    "categoryId",
    "price",
    "position",
    "landArea",
    "provinceId",
    "districtId",
    "wardId",
    "suggestedAddress",
    "legalDocument",
];

// ===================== HEADER =====================
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

// ===================== BODY FORM =====================
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
                onChange={(next) => setFormData((p) => ({ ...p, amenityIds: next }))}
            />
            <ContactInfoSection
                value={formData.contact}
                onChange={(next) => setFormData((p) => ({ ...p, contact: next }))}
            />
        </div>
    );
});

// ===================== BODY TYPE =====================
const BodyType = React.memo(function BodyType({
    postTypeId,
    setPostTypeId,
    formData,
    setFormData,
    listingTypes,
    loadingTypes,
    listingError,
    inventory,
    inventoryLoading,
}) {
    // id -> type (NORMAL | VIP | PREMIUM)
    const idToTypeMap = useMemo(() => {
        const m = {};
        (listingTypes || []).forEach((p) => { m[p.id] = p.listingType; });
        return m;
    }, [listingTypes]);

    // 👉 Map sang chuỗi mà PostPreviewSection hiểu: "free" | "vip" | "premium"
    const previewPostType = useMemo(() => {
        const t =
            idToTypeMap[postTypeId] ||
            idToTypeMap[formData.listingTypePolicyId] ||
            "NORMAL";
        return t === "NORMAL" ? "free" : t.toLowerCase(); // "VIP" -> "vip", "PREMIUM" -> "premium"
    }, [idToTypeMap, postTypeId, formData.listingTypePolicyId]);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-[#f8faff]">
            <PostTypeSection
                value={postTypeId ?? formData.listingTypePolicyId ?? null}
                onChange={(id) => {
                    setPostTypeId(id);
                    setFormData((p) => ({ ...p, listingTypePolicyId: id }));
                }}
                items={listingTypes}
                loading={loadingTypes}
                error={listingError}
                inventory={inventory}
            />

            <div className="rounded-2xl border border-[#e3e9f5] bg-[#f6f9ff]/40 p-4">
                <PostPreviewSection
                    data={formData}
                    postType={previewPostType}
                    editable
                    onImagesChange={(next) => setFormData((p) => ({ ...p, images: next }))}
                />
            </div>
        </div>
    );
});

// ===================== FOOTER FORM =====================
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

// ===================== FOOTER TYPE =====================
const FooterType = React.memo(function FooterType({
    setStep,
    autoRepost,
    setAutoRepost,
    formData,
    postTypeId,
    inventory = {},       // { VIP: number, PREMIUM: number }
    listingTypes = [],    // danh sách loại tin từ BE
    onCreated,
}) {
    const navigate = useNavigate();
    const [showPrompt, setShowPrompt] = useState(false);
    const dispatch = useDispatch();
    const posting = useSelector((s) => s.property?.creating);
    // Map id -> type
    const idToTypeMap = useMemo(() => {
        const m = {};
        (listingTypes || []).forEach((x) => (m[x.id] = x.listingType));
        return m;
    }, [listingTypes]);

    // Tính loại gói đang chọn
    const currentType = idToTypeMap?.[postTypeId];
    const isVipLike = currentType === "VIP" || currentType === "PREMIUM";
    const qty = isVipLike ? (inventory?.[currentType] ?? 0) : Infinity;
    const outOfStock = isVipLike && qty <= 0;

    const handlePost = async () => {
        if (outOfStock) { setShowPrompt(true); return; }

        const payload = {
            ...formData,
            listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId,
            autoRepost,
        };

        try {
            await dispatch(
                createPropertyThunk({ formData: payload, listingTypePolicyId: payload.listingTypePolicyId })
            ).unwrap();

            message.success("Đăng tin thành công!");
            onCreated?.();  // cho component cha đóng Drawer + reload
        } catch (e) {
            message.error(e || "Đăng tin thất bại");
        }
    };
    return (
        <>
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
                    loading={posting}
                    className="bg-[#1b264f] hover:bg-[#22347c]"
                    onClick={handlePost}
                >
                    Đăng tin
                </Button>
            </div>

            {/* Modal hiện giữa màn hình */}
            <Modal
                centered
                open={showPrompt}
                footer={null}
                onCancel={() => setShowPrompt(false)}
                title={null}
            >
                <div className="text-center space-y-3">
                    <div className="text-lg font-semibold text-[#0f223a]">
                        Bạn không còn lượt đăng cho gói {currentType}
                    </div>
                    <p className="text-gray-600">
                        Gói <b>{currentType}</b> của bạn đã hết số lượng. Bạn có muốn mua thêm không?
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        <Button onClick={() => setShowPrompt(false)}>Để sau</Button>
                        <Button
                            type="primary"
                            icon={<CreditCardOutlined />}
                            onClick={() => {
                                setShowPrompt(false);
                                navigate("/dashboard/purchase"); // hoặc /dashboard/purchage nếu bạn viết sai chính tả
                            }}
                        >
                            Tiếp tục
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
});

// ===================== MAIN COMPONENT =====================
export default function PostCreateDrawer({ open, onClose, onSaveDraft, onContinue, user ,onCreated}) {
    const [step, setStep] = useState("form");
    const [loading, setLoading] = useState(false);
    const [autoRepost, setAutoRepost] = useState(false);
    const [postTypeId, setPostTypeId] = useState(null); // ✅ THÊM DÒNG NÀY
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        categoryId: "",
        propertyType: "sell",
        priceType: "SELL_PRICE",
        price: "",
        images: [],
        videoUrls: ["", ""],
        amenityIds: [],
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

    // Địa giới VN
    const { provinces, districts, wards, loadingDistricts, loadingWards, loadDistricts, loadWards } =
        useVNLocations(open);

    const { items: listingTypes, loading: loadingTypes, error: listingError } = useListingTypes(open);
    const { items: invItems, loading: invLoading } = useSelector((s) => s.inventory || { items: [] });
    useEffect(() => {
        if (open) dispatch(fetchUserInventory());
    }, [open, dispatch]);

    const invMap = useMemo(() => {
        const m = {};
        (invItems || []).forEach((it) => {
            // itemType ở BE/FE là 'VIP' / 'PREMIUM' / 'NORMAL'?
            if (it?.itemType) m[it.itemType] = it.quantity ?? 0;
        });
        return m;
    }, [invItems]);




    // Prefill contact
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
            return { ...p, contact: next };
        });
    }, [user]);

    // ✅ Set gói mặc định: NORMAL hoặc phần tử đầu
    useEffect(() => {
        if (!open) return;
        if (!listingTypes?.length) return;
        setPostTypeId((prev) => {
            if (prev) return prev;
            const normal = listingTypes.find((x) => x.listingType === "NORMAL") || listingTypes[0];
            return normal?.id ?? null;
        });
        setFormData((p) => {
            if (p.listingTypePolicyId) return p;
            const normal = listingTypes.find((x) => x.listingType === "NORMAL") || listingTypes[0];
            return { ...p, listingTypePolicyId: normal?.id ?? null };
        });
    }, [open, listingTypes]);

    // Reset khi đóng Drawer
    useEffect(() => {
        if (!open) {
            setStep("form");
            setLoading(false);
            setAutoRepost(false);
            setPostTypeId(null); // ✅ reset id gói
            setErrors({});
        }
    }, [open]);

    // Validate field change
    const onFieldChange = useCallback(
        (name, value) => {
            setFormData((p) => ({ ...p, [name]: value }));
            setErrors((prev) => {
                const msg = validateField(name, value);
                const next = { ...prev };
                if (msg) next[name] = msg;
                else delete next[name];
                return next;
            });
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
        },
        [loadDistricts, loadWards]
    );

    useAddressSuggestions(formData, setFormData, provinces, districts, wards);

    // Sang bước chọn loại tin
    const goToTypeStep = useCallback(() => {
        // coi "" / null / undefined / [] là rỗng
        const isEmpty = (v) =>
            v == null ||
            (typeof v === "string" && v.trim() === "") ||
            (Array.isArray(v) && v.length === 0);

        const requiredErrs = {};
        for (const k of REQUIRED_FIELDS) {
            if (isEmpty(formData[k])) {
                requiredErrs[k] =
                    {
                        provinceId: "Vui lòng chọn Tỉnh/Thành phố",
                        districtId: "Vui lòng chọn Quận/Huyện",
                        wardId: "Vui lòng chọn Phường/Xã",
                        suggestedAddress: "Vui lòng chọn Địa chỉ đề xuất",
                        position: "Vui lòng chọn Vị trí",
                        landArea: "Vui lòng nhập Diện tích đất",
                        legalDocument: "Vui lòng chọn Giấy tờ pháp lý",
                    }[k] || "Trường này là bắt buộc";
            }
        }

        if (Object.keys(requiredErrs).length) {
            setErrors((prev) => ({ ...prev, ...requiredErrs }));
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep("type");
            onContinue?.(formData);
        }, 900);
    }, [formData, onContinue]);

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
                postTypeId={postTypeId}
                inventory={invMap}
                listingTypes={listingTypes}
                onCreated={onCreated}
            />
        );
    }, [step, onClose, onSaveDraft, formData, loading, goToTypeStep, autoRepost, postTypeId]);

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
                <BodyType
                    postTypeId={postTypeId}
                    setPostTypeId={setPostTypeId}
                    formData={formData}
                    setFormData={setFormData}
                    listingTypes={listingTypes}
                    loadingTypes={loadingTypes}
                    listingError={listingError}
                    inventory={invMap}
                    inventoryLoading={invLoading}

                />
            )}
        </Drawer>
    );
}

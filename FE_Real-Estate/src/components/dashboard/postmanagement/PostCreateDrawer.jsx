// src/components/dashboard/postmanagement/PostCreateDrawer.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
    Drawer, Button, Switch, Tooltip, Tag, Spin, Modal, message, Grid
} from "antd";
import {
    CloseOutlined, InfoCircleOutlined, CreditCardOutlined
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
    createPropertyThunk,
    updatePropertyThunk,
    fetchPropertyEditByIdThunk,
    clearCurrentProperty,
} from "@/store/propertySlice";
import { fetchUserInventory } from "@/store/inventorySlice";

import {
    TitlePostSection,
    TradeInfoSection,
    PropertyDetailSection,
    PublicImagesSection,
    VideoLibrarySection,
    AmenitiesSection,
    ContactInfoSection,
    PostPreviewSection,
    OwnerAndConstructionSection
} from "./CreatePostSection";
import PostTypeSection from "./PostTypeDrawer";

import { useVNLocations, useAddressSuggestions, useListingTypes } from "@/hooks";
import dayjs from "dayjs";

/* ================= Header ================= */
const Header = React.memo(function Header({ step, onClose, isEdit }) {
    const title = isEdit
        ? step === "form"
            ? "Chi tiết / Chỉnh sửa tin"
            : "Chọn gói & thanh toán"
        : step === "form"
            ? "Tạo tin đăng"
            : "Lựa chọn loại tin đăng và thanh toán";
    return (
        <div className="mx-2 mt-2 rounded-2xl bg-[#eef4ff] border border-[#e5ecff] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="text-[18px] md:text-[20px] font-semibold text-[#0f223a]">{title}</div>
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

/* =========== map detail -> formData =========== */
function mapDetailToFormData(d) {
    if (!d) return null;
    return {
        title: d.title ?? "",
        description: d.description ?? "",
        categoryId: d.categoryId ?? "",
        propertyType: d.propertyType ?? "sell",
        priceType: d.priceType ?? "SELL_PRICE",
        price: d.price ?? "",

        images: Array.isArray(d.imageUrls) ? d.imageUrls : [],
        videoUrls: Array.isArray(d.videoUrls) ? d.videoUrls : ["", ""],
        amenityIds: Array.isArray(d.amenityIds) ? d.amenityIds : [],

        provinceId: d.cityId ?? "",
        districtId: d.districtId ?? "",
        wardId: d.wardId ?? "",

        suggestedAddress: d.displayAddress || "",
        displayAddress: d.displayAddress || d.addressFull || "",
        streetName: d.addressStreet || "",
        houseNumber: d.houseNumber || "",
        addressSuggestions: [],
        streetOptions: [],

        position: d.position || "",
        direction: d.direction || "",
        landArea: d.landArea ?? "",
        bedrooms: d.bedrooms ?? 0,
        bathrooms: d.bathrooms ?? 0,
        width: d.width ?? "",
        length: d.height ?? "",
        legalDocument: d.legalStatus || "",

        contact: { name: "", phone: "", email: "", zalo: "" },

        listingType: d.listingType || null,
        listingTypePolicyId: d.listingTypePolicyId ?? null,
        authorName: d.authorName || "",
        authorEmail: d.authorEmail || "",

        ownerAuth: {
            isOwner: d.ownerAuth?.isOwner ?? true,
            ownerName: d.ownerAuth?.ownerName ?? d.ownerName ?? "",
            idNumber: d.ownerAuth?.idNumber ?? "",
            issueDate: d.ownerAuth?.issueDate ? dayjs(d.ownerAuth.issueDate) : null,
            issuePlace: d.ownerAuth?.issuePlace ?? "",
            relationship: d.ownerAuth?.relationship ?? "",
        },
        constructionImages: Array.isArray(d.constructionImages) ? d.constructionImages : [],
    };
}

function createInitialForm() {
    return {
        title: "", description: "", categoryId: "",
        propertyType: "sell", priceType: "SELL_PRICE", price: "",
        images: [], videoUrls: ["", ""], amenityIds: [],
        contact: { name: "", phone: "", email: "", zalo: "" },
        provinceId: "", districtId: "", wardId: "", suggestedAddress: "",
        addressSuggestions: [], streetName: "", streetOptions: [], houseNumber: "",
        displayAddress: "", position: "", landArea: "", legalDocument: "",
        bedrooms: 0, bathrooms: 0, width: "", length: "",
        direction: "",
        listingType: null,
        listingTypePolicyId: null,
        ownerAuth: { isOwner: true, ownerName: "", idNumber: "", issueDate: null, issuePlace: "", relationship: "" },
        constructionImages: [],
    };
}

/* ================= MAIN: PostCreateDrawer ================= */
export default function PostCreateDrawer({
    open,
    onClose,
    onSaveDraft,
    onContinue,
    user,
    onCreated,
    editingId,
    isEdit = false,
}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;     // < 640px
    const isTablet = screens.sm && !screens.md;

    const drawerWidth = isMobile ? "100vw" : (isTablet ? 640 : 760);
    const wrapperInsets = isMobile
        ? { insetBlockStart: 0, insetBlockEnd: 0, insetInlineEnd: 0 }
        : { insetBlockStart: 24, insetBlockEnd: 24, insetInlineEnd: 24 };

    const { currentProperty, loadingDetail } = useSelector((s) => ({
        currentProperty: s.property.currentProperty,
        loadingDetail: s.property.loadingDetail,
    }));

    const upperStatus = (currentProperty?.status || "").toUpperCase();
    const isDraft = upperStatus === "DRAFT";
    const needsResubmit = upperStatus === "WARNED" || upperStatus === "REJECTED";

    const posting = useSelector((s) => s.property?.creating);

    const [step, setStep] = useState("form");
    const [loading, setLoading] = useState(false);
    const [postTypeId, setPostTypeId] = useState(null);
    const [formData, setFormData] = useState(createInitialForm);
    const [errors, setErrors] = useState({});
    const [showPromptEdit, setShowPromptEdit] = useState(false);

    const displayNameFromUser = useCallback(
        (u) =>
            u?.fullName ||
            u?.name ||
            [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
            "",
        []
    );

    /* ===== Địa giới & gói tin ===== */
    const {
        provinces, districts, wards,
        loadingDistricts, loadingWards,
        loadDistricts, loadWards, reloadAllByIds,
    } = useVNLocations(open);

    const { items: listingTypes, loading: loadingTypes, error: listingError } = useListingTypes(open);
    const { items: invItems } = useSelector((s) => s.inventory || { items: [] });
    useEffect(() => { if (open) dispatch(fetchUserInventory()); }, [open, dispatch]);

    const invMap = useMemo(() => {
        const m = {};
        (invItems || []).forEach((it) => { if (it?.itemType) m[it.itemType] = it.quantity ?? 0; });
        return m;
    }, [invItems]);

    /* ---- Reset + prefill contact (CREATE) hoặc fetch detail (EDIT) ---- */
    useEffect(() => {
        if (!open) return;

        if (!editingId) {
            setStep("form");
            setLoading(false);
            setPostTypeId(null);
            setErrors({});
            dispatch(clearCurrentProperty());

            const dn = displayNameFromUser(user);
            setFormData({
                ...createInitialForm(),
                contact: {
                    name: dn || "",
                    email: user?.email || "",
                    phone: user?.phone || user?.phoneNumber || "",
                    zalo: user?.zalo || user?.zaloPhone || user?.phone || user?.phoneNumber || "",
                },
            });
            return;
        }

        // CHỈNH SỬA
        dispatch(fetchPropertyEditByIdThunk(editingId));
        setStep("form");
    }, [open, editingId, user, displayNameFromUser, dispatch]);

    /* ===== Khi có currentProperty (edit) -> map ra form + merge contact ===== */
    useEffect(() => {
        if (!open || !editingId || !currentProperty) return;
        const mapped = mapDetailToFormData(currentProperty);
        if (!mapped) return;

        setFormData((prev) => {
            const dn = displayNameFromUser(user);
            const mergedContact = {
                name: prev.contact?.name || mapped.contact?.name || currentProperty.authorName || dn || "",
                email: prev.contact?.email || mapped.authorEmail || currentProperty.authorEmail || user?.email || "",
                phone: prev.contact?.phone || user?.phone || user?.phoneNumber || "",
                zalo: prev.contact?.zalo || user?.zalo || user?.zaloPhone || user?.phone || user?.phoneNumber || "",
            };

            return {
                ...prev,
                ...mapped,
                contact: mergedContact,
            };
        });

        if (mapped.listingTypePolicyId) setPostTypeId(mapped.listingTypePolicyId);

        (async () => {
            await reloadAllByIds(mapped.provinceId, mapped.districtId);
            if (mapped.districtId) await loadWards(mapped.districtId);
        })();
    }, [open, editingId, currentProperty, user, displayNameFromUser, reloadAllByIds, loadWards]);

    /* ===== gói mặc định / map text -> id ===== */
    useEffect(() => {
        if (!open || !listingTypes?.length) return;

        if (isEdit && !postTypeId && !formData.listingTypePolicyId && formData.listingType) {
            const found = listingTypes.find((x) => x.listingType === formData.listingType);
            if (found) {
                setPostTypeId(found.id);
                setFormData((p) => ({ ...p, listingTypePolicyId: found.id }));
                return;
            }
        }

        if (!isEdit && !postTypeId && !formData.listingTypePolicyId) {
            const normal = listingTypes.find((x) => x.listingType === "NORMAL") || listingTypes[0];
            setPostTypeId(normal?.id ?? null);
            setFormData((p) => ({ ...p, listingTypePolicyId: normal?.id ?? null }));
        }
    }, [open, isEdit, listingTypes, postTypeId, formData.listingType, formData.listingTypePolicyId]);

    /* ===== change handlers ===== */
    const onFieldChange = useCallback((name, value) => {
        setFormData((p) => ({ ...p, [name]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
        if (name === "provinceId") { setFormData((p) => ({ ...p, districtId: "", wardId: "" })); loadDistricts(value); }
        if (name === "districtId") { setFormData((p) => ({ ...p, wardId: "" })); loadWards(value); }
        if (name === "suggestedAddress") { setFormData((p) => ({ ...p, displayAddress: value })); }
    }, [loadDistricts, loadWards]);

    useAddressSuggestions(formData, setFormData, provinces, districts, wards);

    /* ===== sang bước type ===== */
    const goToTypeStep = useCallback(() => {
        if (isEdit) { setStep("type"); onContinue?.(formData); return; }

        const isEmpty = (v) =>
            v == null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

        const required = ["title", "description", "categoryId", "price", "position", "landArea", "legalDocument"];
        const msgMap = {
            suggestedAddress: "Vui lòng chọn Địa chỉ đề xuất",
            position: "Vui lòng chọn Vị trí",
            landArea: "Vui lòng nhập Diện tích đất",
            legalDocument: "Vui lòng chọn Giấy tờ pháp lý",
        };

        const requiredErrs = {};
        for (const k of required) if (isEmpty(formData[k])) requiredErrs[k] = msgMap[k] || "Trường này là bắt buộc";

        if (Object.keys(requiredErrs).length) { setErrors((prev) => ({ ...prev, ...requiredErrs })); return; }

        setLoading(true);
        setTimeout(() => { setLoading(false); setStep("type"); onContinue?.(formData); }, 400);
    }, [isEdit, formData, onContinue]);

    /* ===== ACTION: UPDATE (isEdit) ===== */
    const onUpdate = useCallback(async () => {
        try {
            const idToType = {};
            (listingTypes || []).forEach((x) => (idToType[x.id] = x.listingType));
            const selectedType =
                idToType[postTypeId ?? formData.listingTypePolicyId] || formData.listingType || null;
            const isVipLike = selectedType === "VIP" || selectedType === "PREMIUM";
            const isChangingType = selectedType && selectedType !== formData.listingType;
            const leftQty = isVipLike ? (invMap?.[selectedType] ?? 0) : Infinity;

            if (isVipLike && isChangingType && leftQty <= 0) { setShowPromptEdit(true); return; }

            const payload = { ...formData, listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId };
            const submitMode = needsResubmit ? "publish" : undefined;

            await dispatch(
                updatePropertyThunk({
                    id: editingId,
                    formData: payload,
                    listingTypePolicyId: payload.listingTypePolicyId,
                    submitMode
                })
            ).unwrap();
            message.success("Cập nhật tin thành công!");
            onCreated?.();
            onClose?.();
        } catch (e) { message.error(e || "Cập nhật tin thất bại"); }
    }, [dispatch, editingId, formData, postTypeId, onCreated, onClose, listingTypes, invMap, needsResubmit]);

    const onPublishDraft = useCallback(async () => {
        try {
            const idToType = {};
            (listingTypes || []).forEach((x) => (idToType[x.id] = x.listingType));
            const selectedType =
                idToType[postTypeId ?? formData.listingTypePolicyId] || formData.listingType || null;

            const isVipLike = selectedType === "VIP" || selectedType === "PREMIUM";
            const leftQty = isVipLike ? (invMap?.[selectedType] ?? 0) : Infinity;
            if (isVipLike && leftQty <= 0) { setShowPromptEdit(true); return; }

            const payload = { ...formData, listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId };

            await dispatch(
                updatePropertyThunk({
                    id: editingId,
                    formData: payload,
                    listingTypePolicyId: payload.listingTypePolicyId,
                    submitMode: "publish",
                })
            ).unwrap();

            message.success("Đăng tin thành công! Tin đã gửi duyệt.");
            onCreated?.();
            onClose?.();
        } catch (e) { message.error(e || "Đăng tin thất bại"); }
    }, [dispatch, editingId, formData, postTypeId, listingTypes, invMap, onCreated, onClose]);

    /* ===== Footer ===== */
    const footerNode = useMemo(() => {
        if (step === "form") {
            return (
                <div className="w-full flex justify-end gap-2 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 bg-white/70 backdrop-blur border-t border-[#e3e9f5]">
                    <Button onClick={onClose}>{isEdit ? "Đóng" : "Huỷ"}</Button>
                    <Button
                        onClick={async () => {
                            try {
                                const payload = { ...formData, listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId };
                                await dispatch(
                                    createPropertyThunk({
                                        formData: payload,
                                        listingTypePolicyId: payload.listingTypePolicyId,
                                        submitMode: "draft",
                                    })
                                ).unwrap();
                                message.success("Đã lưu nháp!");
                                onCreated?.();
                                onClose?.();
                            } catch (e) { message.error(e || "Lưu nháp thất bại"); }
                        }}
                    >
                        Lưu nháp
                    </Button>
                    <Button type="primary" loading={loading} onClick={goToTypeStep}>Tiếp tục</Button>
                </div>
            );
        }

        if (isEdit) {
            return (
                <div className="flex items-center justify-between px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 border-t border-[#e3e9f5] bg-[#f8faff]/90 backdrop-blur">
                    <Button onClick={() => setStep("form")}>&larr; Quay lại</Button>
                    <div className="flex items-center gap-2">
                        {isDraft ? (
                            <Button type="primary" loading={posting} className="bg-[#1b264f] hover:bg-[#22347c]" onClick={onPublishDraft}>
                                Đăng tin
                            </Button>
                        ) : (
                            <Button type="primary" loading={posting} className="bg-[#1b264f] hover:bg-[#22347c]" onClick={onUpdate}>
                                Cập nhật
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <FooterType
                setStep={setStep}
                formData={formData}
                postTypeId={postTypeId}
                inventory={invMap}
                listingTypes={listingTypes}
                onCreated={onCreated}
            />
        );
    }, [
        step, onClose, formData, loading, goToTypeStep,
        postTypeId, invMap, listingTypes, onCreated, isEdit, posting, onUpdate, onPublishDraft, isDraft
    ]);

    const showBlockingSpin = loadingDetail;

    return (
        <>
            <Drawer
                key={editingId ? `edit-${editingId}` : "create"}
                open={open}
                onClose={onClose}
                placement="right"
                width={drawerWidth}
                title={null}
                closable={false}
                destroyOnClose
                maskClosable
                styles={{
                    wrapper: wrapperInsets,
                    content: {
                        // full-height flex container để body tự co giãn/scroll
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: isMobile ? 0 : 16,
                        overflow: "hidden",
                        boxShadow: isMobile ? "none" : "0 12px 36px rgba(0,0,0,0.14)",
                    },
                    body: {
                        padding: 0,
                        background: step === "form" ? "#E9EEF8" : "#f8faff",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0, // CHÌA KHÓA: cho phép phần nội dung bên trong flex-1 scroll
                    },
                    mask: { backgroundColor: "rgba(15,23,42,.35)", backdropFilter: "blur(3px)" },
                }}
            >
                {/* Header sticky */}
                <div className="sticky top-0 z-10">
                    <Header step={step} onClose={onClose} isEdit={isEdit} />
                </div>

                {/* Overlay loading when fetching edit detail */}
                {showBlockingSpin && (
                    <div className="absolute inset-0 z-20 grid place-items-center bg-white/60">
                        <Spin tip="Đang tải chi tiết tin..." size="large" />
                    </div>
                )}

                {/* === BODY + FOOTER (sticky bottom) === */}
                <div className="flex flex-col min-h-0 flex-1">
                    {/* CONTENT */}
                    {step === "form" ? (
                        <div className="flex-1 min-h-0">
                            <div className="h-full overflow-y-auto px-3 md:px-4 py-4 space-y-4 pb-24">
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

                                {/* ====== SECTION GỘP: Chính chủ + Ảnh xây dựng ====== */}
                                <OwnerAndConstructionSection
                                    ownerValue={formData.ownerAuth}
                                    onOwnerChange={(next) => setFormData((p) => ({ ...p, ownerAuth: next }))}
                                    imagesValue={formData.constructionImages}
                                    onImagesChange={(next) => setFormData((p) => ({ ...p, constructionImages: next }))}
                                    errors={errors?.ownerAuth || {}}
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
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0">
                            <div className="h-full overflow-y-auto px-4 py-4 space-y-6 bg-[#f8faff] pb-28">
                                <PublicImagesSection
                                    images={formData.images}
                                    onChange={(arr) => setFormData((p) => ({ ...p, images: arr }))}
                                />
                                <PostTypeSection
                                    value={postTypeId ?? formData.listingTypePolicyId ?? null}
                                    currentTypeText={formData.listingType}
                                    onChange={(id) => {
                                        setPostTypeId(id);
                                        setFormData((p) => ({ ...p, listingTypePolicyId: id }));
                                    }}
                                    items={listingTypes}
                                    loading={loadingTypes}
                                    error={listingError}
                                    inventory={invMap}
                                />
                                <div className="rounded-2xl border border-[#e3e9f5] bg-[#f6f9ff]/40 p-4">
                                    <PostPreviewSection
                                        data={formData}
                                        postType={(function () {
                                            const map = {}; (listingTypes || []).forEach((x) => (map[x.id] = x.listingType));
                                            const t = map[postTypeId] || map[formData.listingTypePolicyId] || "NORMAL";
                                            return t === "NORMAL" ? "free" : t.toLowerCase();
                                        })()}
                                        editable
                                        onImagesChange={(next) => setFormData((p) => ({ ...p, images: next }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOOTER (sticky bottom) */}
                    <div className="sticky bottom-0 z-10">{footerNode}</div>
                </div>
            </Drawer>

            {/* Modal nhắc mua thêm (Edit) */}
            <Modal centered open={showPromptEdit} footer={null} onCancel={() => setShowPromptEdit(false)} title={null}>
                <div className="text-center space-y-3">
                    <div className="text-lg font-semibold text-[#0f223a]">Bạn không còn lượt cho gói đã chọn</div>
                    <p className="text-gray-600">
                        Bạn đang chuyển sang gói VIP/PREMIUM nhưng số lượt còn lại bằng 0. Bạn có muốn mua thêm không?
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        <Button onClick={() => setShowPromptEdit(false)}>Để sau</Button>
                        <Button
                            type="primary"
                            icon={<CreditCardOutlined />}
                            onClick={() => {
                                setShowPromptEdit(false);
                                navigate("/dashboard/purchase");
                            }}
                        >
                            Mua thêm
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

/* ========== FooterType cho tạo mới ========== */
function FooterType({
    setStep,
    formData,
    postTypeId,
    inventory = {},
    listingTypes = [],
    onCreated,
}) {
    const navigate = useNavigate();
    const [showPrompt, setShowPrompt] = useState(false);
    const dispatch = useDispatch();
    const posting = useSelector((s) => s.property?.creating);

    const idToTypeMap = useMemo(() => {
        const m = {};
        (listingTypes || []).forEach((x) => (m[x.id] = x.listingType));
        return m;
    }, [listingTypes]);

    const currentType = idToTypeMap?.[postTypeId];
    const isVipLike = currentType === "VIP" || currentType === "PREMIUM";
    const qty = isVipLike ? (inventory?.[currentType] ?? 0) : Infinity;
    const outOfStock = isVipLike && qty <= 0;

    const [autoRepostVal, setAutoRepostVal] = useState(false);

    const handlePost = async () => {
        if (outOfStock) { setShowPrompt(true); return; }
        const payload = {
            ...formData,
            listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId,
            autoRepost: autoRepostVal,
        };
        try {
            await dispatch(
                createPropertyThunk({
                    formData: payload,
                    listingTypePolicyId: payload.listingTypePolicyId,
                    submitMode: "publish",
                })
            ).unwrap();
            message.success("Đăng tin thành công!");
            onCreated?.();
        } catch (e) { message.error(e || "Đăng tin thất bại"); }
    };

    return (
        <>
            <div className="flex items-center justify-between px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 border-t border-[#e3e9f5] bg-[#f8faff]/90 backdrop-blur">
                <Button onClick={() => setStep("form")}>&larr; Quay lại</Button>
                <div className="flex items-center gap-2">
                    <Switch checked={autoRepostVal} onChange={setAutoRepostVal} />
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

            <Modal centered open={showPrompt} footer={null} onCancel={() => setShowPrompt(false)} title={null}>
                <div className="text-center space-y-3">
                    <div className="text-lg font-semibold text-[#0f223a]">
                        Bạn không còn lượt đăng cho gói {currentType}
                    </div>
                    <p className="text-gray-600">
                        Gói <b>{currentType}</b> đã hết số lượng. Bạn có muốn mua thêm không?
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        <Button onClick={() => setShowPrompt(false)}>Để sau</Button>
                        <Button
                            type="primary"
                            icon={<CreditCardOutlined />}
                            onClick={() => {
                                setShowPrompt(false);
                                navigate("/dashboard/purchase");
                            }}
                        >
                            Tiếp tục
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

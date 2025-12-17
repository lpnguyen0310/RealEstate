import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
    Drawer, Button, Switch, Tooltip, Tag, Spin, Modal, message, Grid, Upload, Space
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
    toggleAutoRenewThunk,
} from "@/store/propertySlice";
import { fetchUserInventory } from "@/store/inventorySlice";

import {
    TitlePostSection,
    TradeInfoSection,
    PropertyDetailSection,
    PublicImagesSection,
    VideoLibrarySection,
    AmenitiesSection,
    PostPreviewSection,
    OwnerAndConstructionSection
} from "./CreatePostSection";
import PostTypeSection from "./PostTypeDrawer";

import { useVNLocations, useAddressSuggestions, useListingTypes } from "@/hooks";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

/* ===== 1. CẤU HÌNH GIỚI HẠN ẢNH ===== */
const IMAGE_LIMITS = {
    NORMAL: 3,    // 1 ảnh lớn + 2 ảnh nhỏ
    VIP: 7,       // 1 ảnh lớn + 6 ảnh nhỏ
    PREMIUM: 15,  // Khoảng 15 ảnh
    DEFAULT: 3    // Mặc định
};

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

/* ===== Excel helpers ===== */
function ExcelImportBar({ onImport, onDownloadTemplate }) {
    return (
        <div className="mx-3 md:mx-4 my-3 p-3 border border-[#e3e9f5] bg-white rounded-xl flex items-center justify-between">
            <div className="text-sm text-[#0f223a] font-medium">Nhập nhanh thông tin từ Excel</div>
            <Space>
                <Button onClick={onDownloadTemplate}>Tải mẫu Excel</Button>
                <Upload
                    accept=".xlsx,.xls"
                    showUploadList={false}
                    beforeUpload={(file) => { onImport(file); return false; }}
                >
                    <Button type="primary">Nhập từ Excel</Button>
                </Upload>
            </Space>
        </div>
    );
}

function toBool(v, def = false) {
    if (v === true || v === false) return v;
    if (v === 1 || v === "1" || v === "true") return true;
    if (v === 0 || v === "0" || v === "false") return false;
    return def;
}

const splitList = (v) =>
    (typeof v === "string" ? v.split(",") : Array.isArray(v) ? v : [])
        .map(s => String(s).trim())
        .filter(Boolean);

const parseNumber = (v) => {
    if (v == null || v === "") return "";
    const n = Number(String(v).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : "";
};

const parseIntOr0 = (v) => {
    const n = parseInt(String(v).trim(), 10);
    return Number.isFinite(n) ? n : 0;
};

/* =========== map detail -> formData =========== */
function mapDetailToFormData(d) {
    if (!d) return null;

    const isOwner = toBool(d.isOwner ?? d.is_owner, false);
    const fbName = d.contactName || d.authorName || "";
    const fbPhone = d.contactPhone || d.phoneNumber || "";
    const fbEmail = d.contactEmail || d.authorEmail || "";

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
        usableArea: d.usableArea ?? d.floorArea ?? "",
        floors: d.floors ?? d.numberOfFloors ?? 0,
        bedrooms: d.bedrooms ?? 0,
        bathrooms: d.bathrooms ?? 0,
        width: d.width ?? "",
        length: d.height ?? "",
        legalDocument: d.legalStatus || "",

        contact: {
            name: fbName,
            phone: fbPhone,
            email: fbEmail,
            zalo: d.zaloPhone || "",
        },

        listingType: d.listingType || null,
        listingTypePolicyId: d.listingTypePolicyId ?? null,

        ownerAuth: {
            isOwner,
            ownerName: d.contactName || d.ownerName || "",
            phoneNumber: d.contactPhone || d.ownerPhone || "",
            ownerEmail: d.contactEmail || d.ownerEmail || "",
            idNumber: d.ownerAuth?.idNumber || d.owner_id_number || "",
            issueDate: d.ownerAuth?.issueDate
                ? dayjs(d.ownerAuth.issueDate)
                : (d.owner_issue_date ? dayjs(d.owner_issue_date) : null),
            issuePlace: d.ownerAuth?.issuePlace || d.owner_issue_place || "",
            relationship: d.ownerAuth?.relationship || d.contactRelationship || d.relationship || "",
            agreed: toBool(d.ownerAuth?.agreed ?? d.owner_agreed, false),
        },

        constructionImages: Array.isArray(d.constructionImages) ? d.constructionImages : [],
        autoRepost: d.autoRenew !== undefined ? d.autoRenew : (!!d.autoRepost),
        legalFiles: {
            deedFiles: Array.isArray(d.deedFileUrls) ? d.deedFileUrls : (Array.isArray(d.deedFiles) ? d.deedFiles : []),
            authFiles: Array.isArray(d.authorizationFileUrls) ? d.authorizationFileUrls : (Array.isArray(d.authFiles) ? d.authFiles : []),
        },

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
        usableArea: "",
        floors: 0,
        bedrooms: 0, bathrooms: 0, width: "", length: "",
        direction: "",
        listingType: null,
        listingTypePolicyId: null,
        ownerAuth: {
            isOwner: true,
            ownerName: "",
            phoneNumber: "",
            ownerEmail: "",
            idNumber: "",
            issueDate: null,
            issuePlace: "",
            relationship: "",
            agreed: false,
        },
        constructionImages: [],
        autoRepost: false,
        legalFiles: {
            deedFiles: [],      // sổ đỏ / sổ hồng (URL cloudinary)
            authFiles: [],      // giấy ủy quyền (URL cloudinary)
        },
    };
}

const findProvinceId = (provinces, nameOrId) => {
    if (!nameOrId) return "";
    const asNum = Number(nameOrId);
    if (Number.isFinite(asNum)) {
        const ok = provinces.find(p => String(p.id) === String(asNum));
        if (ok) return ok.id;
    }
    const lower = String(nameOrId).toLowerCase();
    const m = provinces.find(p => p.name?.toLowerCase() === lower);
    return m?.id || "";
};
const findDistrictId = (districts, nameOrId) => {
    if (!nameOrId) return "";
    const asNum = Number(nameOrId);
    if (Number.isFinite(asNum)) {
        const ok = districts.find(p => String(p.id) === String(asNum));
        if (ok) return ok.id;
    }
    const lower = String(nameOrId).toLowerCase();
    const m = districts.find(p => p.name?.toLowerCase() === lower);
    return m?.id || "";
};
const findWardId = (wards, nameOrId) => {
    if (!nameOrId) return "";
    const asNum = Number(nameOrId);
    if (Number.isFinite(asNum)) {
        const ok = wards.find(p => String(p.id) === String(asNum));
        if (ok) return ok.id;
    }
    const lower = String(nameOrId).toLowerCase();
    const m = wards.find(p => p.name?.toLowerCase() === lower);
    return m?.id || "";
};

const excelRowToForm = (row) => {
    const images = splitList(row.ImageURLs);
    const videos = splitList(row.VideoURLs);
    const amenities = splitList(row.AmenityIds).map(x => Number(x)).filter(Number.isFinite);
    const isOwner = toBool(row.IsOwner, true);

    const issueDate =
        row.OwnerIssueDate
            ? dayjs(row.OwnerIssueDate, ["DD/MM/YYYY", "YYYY-MM-DD", "D/M/YYYY"], true)
            : null;

    return {
        title: row.Title || "",
        description: row.Description || "",
        categoryId: row.CategoryId || "",
        propertyType: (row.PropertyType || "sell").toLowerCase(),
        priceType: row.PriceType || "SELL_PRICE",
        price: parseNumber(row.Price),

        images,
        videoUrls: videos.length ? videos : ["", ""],
        amenityIds: amenities,

        provinceId: row.ProvinceId || row.Province || "",
        districtId: row.DistrictId || row.District || "",
        wardId: row.WardId || row.Ward || "",
        suggestedAddress: row.SuggestedAddress || "",
        displayAddress: row.DisplayAddress || row.SuggestedAddress || "",
        streetName: row.StreetName || "",
        houseNumber: row.HouseNumber || "",

        position: row.Position || "",
        direction: row.Direction || "",
        landArea: parseNumber(row.LandArea),
        usableArea: parseNumber(row.UsableArea),
        floors: parseIntOr0(row.Floors),
        bedrooms: parseIntOr0(row.Bedrooms),
        bathrooms: parseIntOr0(row.Bathrooms),
        width: parseNumber(row.Width),
        length: parseNumber(row.Length),
        legalDocument: row.LegalDocument || "",

        contact: {
            name: row.ContactName || "",
            phone: row.ContactPhone || "",
            email: row.ContactEmail || "",
            zalo: row.Zalo || "",
        },

        listingType: row.ListingType || null,
        listingTypePolicyId: row.ListingTypePolicyId || null,

        ownerAuth: {
            isOwner,
            ownerName: row.OwnerName || "",
            phoneNumber: row.OwnerPhone || "",
            ownerEmail: row.OwnerEmail || "",
            idNumber: row.OwnerIdNumber || "",
            issueDate: issueDate && issueDate.isValid() ? issueDate : null,
            issuePlace: row.OwnerIssuePlace || "",
            relationship: row.Relationship || "",
            agreed: toBool(row.OwnerAgreed, false),
        },

        constructionImages: splitList(row.ConstructionImageURLs),
    };
};

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
    const isMobile = !screens.sm;
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
    const isDraft = upperStatus === "DRAFT"; // Biến check trạng thái Draft
    const needsResubmit = ["WARNED", "REJECTED", "PUBLISHED"].includes(upperStatus);
    const isExpiringSoon = upperStatus === "EXPIRINGSOON" || upperStatus === "EXPIRING_SOON";
    const isExpired = upperStatus === "EXPIRED" || upperStatus === "REJECTED";
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

    /* ===== 2. TÍNH TOÁN GIỚI HẠN ẢNH ===== */
    const currentListingTypeObj = useMemo(() => {
        if (!listingTypes || !postTypeId) return null;
        return listingTypes.find(t => t.id === postTypeId);
    }, [listingTypes, postTypeId]);

    const typeCode = currentListingTypeObj?.listingType || formData.listingType || "NORMAL";
    const maxImages = IMAGE_LIMITS[typeCode] || IMAGE_LIMITS.DEFAULT;

    /* ===== 3. TỰ ĐỘNG CẮT ẢNH KHI ĐỔI GÓI ===== */
    useEffect(() => {
        if (formData.images.length > maxImages) {
            message.warning(`Gói ${typeCode} chỉ cho phép tối đa ${maxImages} ảnh. Hệ thống đã tự động cắt bớt.`);
            setFormData(prev => ({
                ...prev,
                images: prev.images.slice(0, maxImages)
            }));
        }
    }, [maxImages, typeCode, formData.images.length]);

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

        dispatch(fetchPropertyEditByIdThunk(editingId));
        setStep("form");
    }, [open, editingId, user, displayNameFromUser, dispatch]);

    useEffect(() => {
        if (!open || !editingId || !currentProperty) return;
        const mapped = mapDetailToFormData(currentProperty);
        if (!mapped) return;

        setFormData((prev) => {
            const mergedContact = {
                name: mapped.contact?.name ?? "",
                email: mapped.contact?.email ?? "",
                phone: mapped.contact?.phone ?? "",
                zalo: mapped.contact?.zalo ?? "",
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
    }, [open, editingId, currentProperty, reloadAllByIds, loadWards]);

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

    useEffect(() => {
        if (!open) return;
        setFormData((prev) => {
            const o = prev.ownerAuth || {};
            if (!o.isOwner) return prev;

            const needName = !o.ownerName && (prev.contact?.name || "");
            const needPhone = !o.phoneNumber && (prev.contact?.phone || "");
            const needEmail = !o.ownerEmail && (prev.contact?.email || "");

            if (!needName && !needPhone && !needEmail) return prev;

            return {
                ...prev,
                ownerAuth: {
                    ...o,
                    ownerName: o.ownerName || prev.contact?.name || "",
                    phoneNumber: o.phoneNumber || prev.contact?.phone || "",
                    ownerEmail: o.ownerEmail || prev.contact?.email || "",
                },
            };
        });
    }, [open]);

    const handleImportExcel = useCallback(async (file) => {
        try {
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            if (!rows.length) {
                message.warning("File Excel rỗng.");
                return;
            }

            const row = rows[0];
            const mapped = excelRowToForm(row);

            // ===== CẮT ẢNH KHI IMPORT =====
            const importedType = mapped.listingType || "NORMAL";
            const limitForImport = IMAGE_LIMITS[importedType] || IMAGE_LIMITS.DEFAULT;
            mapped.images = mapped.images.slice(0, limitForImport);

            setFormData((prev) => ({ ...prev, ...mapped }));

            let provinceId = mapped.provinceId;
            let districtId = mapped.districtId;
            let wardId = mapped.wardId;

            if (provinceId && !Number.isFinite(Number(provinceId))) {
                provinceId = findProvinceId(provinces, provinceId);
            }
            if (provinceId) {
                await loadDistricts(provinceId);
            }

            if (districtId && !Number.isFinite(Number(districtId))) {
                districtId = findDistrictId(districts, districtId);
            }
            if (districtId) {
                await loadWards(districtId);
            }

            if (wardId && !Number.isFinite(Number(wardId))) {
                wardId = findWardId(wards, wardId);
            }

            setFormData((prev) => ({
                ...prev,
                provinceId: provinceId || prev.provinceId,
                districtId: districtId || prev.districtId,
                wardId: wardId || prev.wardId,
            }));

            message.success(`Đã nhập dữ liệu! (Giới hạn ${limitForImport} ảnh)`);
        } catch (err) {
            console.error(err);
            message.error("Không đọc được file Excel.");
        }
    }, [provinces, districts, wards, loadDistricts, loadWards]);

    const downloadExcelTemplate = useCallback(() => {
        const header = [
            "Title", "Description", "CategoryId", "PropertyType", "PriceType", "Price",
            "ProvinceId", "DistrictId", "WardId", "StreetName", "HouseNumber",
            "SuggestedAddress", "DisplayAddress",
            "Position", "Direction", "LandArea", "UsableArea", "Floors", "Bedrooms", "Bathrooms", "Width", "Length", "LegalDocument",
            "ContactName", "ContactPhone", "ContactEmail", "Zalo",
            "IsOwner", "OwnerName", "OwnerPhone", "OwnerEmail",
            "OwnerIdNumber", "OwnerIssueDate", "OwnerIssuePlace", "Relationship", "OwnerAgreed",
            "ImageURLs", "VideoURLs", "AmenityIds", "ConstructionImageURLs",
            "ListingType", "ListingTypePolicyId"
        ];

        const example = [{
            Title: "Nhà phố 2 tầng trung tâm",
            Description: "Nhà đẹp, sổ hồng riêng...",
            CategoryId: 1,
            PropertyType: "sell",
            PriceType: "SELL_PRICE",
            Price: 3500000000,
            ProvinceId: 79,
            DistrictId: 760,
            WardId: 26734,
            StreetName: "Lê Lợi",
            HouseNumber: "12",
            SuggestedAddress: "12 Lê Lợi, Q1, TP.HCM",
            DisplayAddress: "",
            Position: "Mặt tiền",
            Direction: "Đông Nam",
            LandArea: 56,
            UsableArea: 95,
            Floors: 2,
            Bedrooms: 3,
            Bathrooms: 3,
            Width: 4,
            Length: 14,
            LegalDocument: "Sổ hồng",
            ContactName: "Nguyễn Văn A",
            ContactPhone: "0909123456",
            ContactEmail: "a@example.com",
            Zalo: "0909123456",
            IsOwner: true,
            OwnerName: "Nguyễn Văn A",
            OwnerPhone: "0909123456",
            OwnerEmail: "a@example.com",
            OwnerIdNumber: "0790xxxxxxx",
            OwnerIssueDate: "15/10/2022",
            OwnerIssuePlace: "CA TP.HCM",
            Relationship: "",
            OwnerAgreed: true,
            ImageURLs: "https://.../img1.jpg, https://.../img2.jpg",
            VideoURLs: "https://youtu.be/xxx",
            AmenityIds: "1,2,5",
            ConstructionImageURLs: "",
            ListingType: "NORMAL",
            ListingTypePolicyId: ""
        }];

        const ws = XLSX.utils.json_to_sheet(example, { header });
        ws["!cols"] = header.map(() => ({ wch: 22 }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "post_template_with_ids.xlsx");
    }, []);

    const goToTypeStep = useCallback(() => {
        if (isEdit) { setStep("type"); onContinue?.(formData); return; }

        const isEmpty = (v) =>
            v == null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

        const required = ["title", "description", "categoryId", "price", "provinceId", "districtId", "wardId", "position", "landArea", "legalDocument",
        ];
        const msgMap = {
            title: "Vui lòng nhập Tiêu đề",
            description: "Vui lòng nhập Mô tả",
            categoryId: "Vui lòng chọn Danh mục",
            price: "Vui lòng nhập Giá",
            provinceId: "Vui lòng chọn Tỉnh/Thành phố",
            districtId: "Vui lòng chọn Quận/Huyện",
            wardId: "Vui lòng chọn Phường/Xã",
            position: "Vui lòng chọn Vị trí",
            landArea: "Vui lòng nhập Diện tích đất",
            legalDocument: "Vui lòng chọn Giấy tờ pháp lý",
        };
        const requiredErrs = {};
        for (const k of required) if (isEmpty(formData[k])) requiredErrs[k] = msgMap[k] || "Trường này là bắt buộc";
        const isOwner = !!formData?.ownerAuth?.isOwner;
        const deedCount = formData?.legalFiles?.deedFiles?.length || 0;
        const authCount = formData?.legalFiles?.authFiles?.length || 0;

        if (deedCount === 0) requiredErrs["legalFiles.deedFiles"] = "Vui lòng tải sổ đỏ/sổ hồng";
        if (!isOwner && authCount === 0) requiredErrs["legalFiles.authFiles"] = "Vui lòng tải giấy ủy quyền (bắt buộc khi không chính chủ)";

        if (Object.keys(requiredErrs).length) { setErrors((prev) => ({ ...prev, ...requiredErrs })); return; }

        setLoading(true);
        setTimeout(() => { setLoading(false); setStep("type"); onContinue?.(formData); }, 400);
    }, [isEdit, formData, onContinue]);

    /* ================= UPDATED FOOTER LOGIC ================= */
    const footerNode = useMemo(() => {
        if (step === "form") {
            return (
                <div className="w-full flex justify-end gap-2 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 bg-white/70 backdrop-blur border-t border-[#e3e9f5]">
                    <Button onClick={onClose}>{isEdit ? "Đóng" : "Huỷ"}</Button>
                    <Button
                        onClick={async () => {
                            try {
                                const payload = { ...formData, listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId };

                                // LOGIC MỚI: Kiểm tra update hay create cho DRAFT
                                if (isEdit && editingId) {
                                    console.log("👉 UPDATE lưu nháp:", { id: editingId, payload });
                                    await dispatch(
                                        updatePropertyThunk({
                                            id: editingId,
                                            formData: payload,
                                            listingTypePolicyId: payload.listingTypePolicyId,
                                            submitMode: "DRAFT", // Giữ trạng thái Draft
                                        })
                                    ).unwrap();
                                    message.success("Đã cập nhật bản nháp!");
                                } else {
                                    console.log("👉 CREATE lưu nháp:", { payload });
                                    await dispatch(
                                        createPropertyThunk({
                                            formData: payload,
                                            listingTypePolicyId: payload.listingTypePolicyId,
                                            submitMode: "DRAFT",
                                        })
                                    ).unwrap();
                                    message.success("Đã tạo bản nháp mới!");
                                }

                                onCreated?.();
                                onClose?.();
                            } catch (e) {
                                message.error(e || "Lưu nháp thất bại");
                            }
                        }}
                    >
                        Lưu nháp
                    </Button>
                    <Button type="primary" loading={loading} onClick={goToTypeStep}>Tiếp tục</Button>
                </div>
            );
        }

        return (
            <FooterType
                setStep={setStep}
                formData={formData}
                setFormData={setFormData}
                postTypeId={postTypeId}
                inventory={invMap}
                listingTypes={listingTypes}
                onCreated={onCreated}
                isEdit={isEdit}
                editingId={editingId}
                onClose={onClose} // <-- Truyền onClose xuống Step 2
                isDraft={isDraft} // <-- Truyền trạng thái Draft xuống để xử lý text nút bấm
            />
        );
    }, [
        step, onClose, formData, loading, goToTypeStep,
        postTypeId, invMap, listingTypes, onCreated,
        isEdit, editingId, dispatch, isDraft
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
                        minHeight: 0,
                    },
                    mask: { backgroundColor: "rgba(15,23,42,.35)", backdropFilter: "blur(3px)" },
                }}
            >
                <div className="sticky top-0 z-10">
                    <Header step={step} onClose={onClose} isEdit={isEdit} />
                </div>

                {showBlockingSpin && (
                    <div className="absolute inset-0 z-20 grid place-items-center bg-white/60">
                        <Spin tip="Đang tải chi tiết tin..." size="large" />
                    </div>
                )}

                <div className="flex flex-col min-h-0 flex-1">
                    {step === "form" ? (
                        <div className="flex-1 min-h-0">
                            <ExcelImportBar
                                onImport={handleImportExcel}
                                onDownloadTemplate={downloadExcelTemplate}
                            />

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

                                <OwnerAndConstructionSection
                                    ownerValue={formData.ownerAuth}
                                    onOwnerChange={(next) => setFormData((p) => ({ ...p, ownerAuth: next }))}
                                    imagesValue={formData.constructionImages}
                                    onImagesChange={(next) => setFormData((p) => ({ ...p, constructionImages: next }))}
                                    errors={errors?.ownerAuth || {}}
                                    contactValue={formData.contact}
                                    onContactChange={(next) => setFormData((p) => ({ ...p, contact: next }))}
                                />

                                <VideoLibrarySection
                                    videoUrls={formData.videoUrls}
                                    onChange={(arr) => setFormData((p) => ({ ...p, videoUrls: arr }))}
                                />
                                <AmenitiesSection
                                    value={formData.amenityIds}
                                    onChange={(next) => setFormData((p) => ({ ...p, amenityIds: next }))}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0">
                            <div className="h-full overflow-y-auto px-4 py-4 space-y-6 bg-[#f8faff] pb-28">
                                {/* ===== 4. SỬA UI UPLOAD ẢNH (Chặn Upload) ===== */}
                                <PublicImagesSection
                                    images={formData.images}
                                    onChange={(arr) => {
                                        if (arr.length > maxImages) {
                                            message.warning(`Gói ${typeCode} giới hạn tối đa ${maxImages} ảnh.`);
                                            setFormData((p) => ({ ...p, images: arr.slice(0, maxImages) }));
                                        } else {
                                            setFormData((p) => ({ ...p, images: arr }));
                                        }
                                    }}
                                    appendedImages={formData.constructionImages}
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

                    <div className="sticky bottom-0 z-10">{footerNode}</div>
                </div>
            </Drawer>

            {/* Modal nhắc mua thêm (Edit - dùng chung nếu cần) */}
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

/* ========== FooterType (Updated with Save Draft) ========== */
function FooterType({
    setStep,
    formData,
    setFormData,
    postTypeId,
    inventory = {},
    listingTypes = [],
    onCreated,
    isEdit,
    editingId,
    onClose, // <-- Nhận prop onClose
    isDraft  // <-- Nhận trạng thái Draft
}) {
    const navigate = useNavigate();
    const [showPrompt, setShowPrompt] = useState(false);
    const [showPromptEdit, setShowPromptEdit] = useState(false);
    const dispatch = useDispatch();
    const posting = useSelector((s) => s.property?.creating);

    const idToTypeMap = useMemo(() => {
        const m = {};
        (listingTypes || []).forEach((x) => (m[x.id] = x.listingType));
        return m;
    }, [listingTypes]);

    const selectedTypeName = idToTypeMap?.[postTypeId] || "NORMAL";
    const isVipLike = selectedTypeName === "VIP" || selectedTypeName === "PREMIUM";
    const qty = isVipLike ? (inventory?.[selectedTypeName] ?? 0) : Infinity;
    const outOfStock = isVipLike && qty <= 0;

    const [autoRepostVal, setAutoRepostVal] = useState(formData.autoRepost);

    useEffect(() => {
        setAutoRepostVal(!!formData.autoRepost);
    }, [formData.autoRepost]);

    const handleAutoRepostChange = async (checked) => {
        setAutoRepostVal(checked);
        if (setFormData) setFormData(prev => ({ ...prev, autoRepost: checked }));

        if (isEdit && editingId) {
            try {
                await dispatch(toggleAutoRenewThunk({ id: editingId, enable: checked })).unwrap();
                message.success(`Đã ${checked ? "bật" : "tắt"} tự động đăng lại`);
            } catch (e) {
                setAutoRepostVal(!checked);
                if (setFormData) setFormData(prev => ({ ...prev, autoRepost: !checked }));
                message.error("Lỗi cập nhật trạng thái: " + e);
            }
        }
    };

    // --- HÀM LƯU NHÁP Ở BƯỚC 2 ---
    const handleSaveDraft = async () => {
        try {
            const payload = {
                ...formData,
                listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId,
                autoRepost: autoRepostVal,
            };

            if (isEdit && editingId) {
                // Update existing Draft
                await dispatch(updatePropertyThunk({
                    id: editingId,
                    formData: payload,
                    listingTypePolicyId: payload.listingTypePolicyId,
                    submitMode: "DRAFT",
                })).unwrap();
                message.success("Đã cập nhật bản nháp!");
            } else {
                // Create new Draft
                await dispatch(createPropertyThunk({
                    formData: payload,
                    listingTypePolicyId: payload.listingTypePolicyId,
                    submitMode: "DRAFT",
                })).unwrap();
                message.success("Đã tạo bản nháp mới!");
            }
            onCreated?.();
            onClose?.();
        } catch (e) {
            message.error(e || "Lưu nháp thất bại");
        }
    };

    const handleCreate = async () => {
        if (outOfStock) {
            setShowPrompt(true);
            return;
        }

        const payload = {
            ...formData,
            listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId,
            autoRepost: formData.autoRepost,
        };

        try {
            await dispatch(createPropertyThunk({
                formData: payload,
                listingTypePolicyId: payload.listingTypePolicyId,
                submitMode: "PUBLISHED",
            })).unwrap();
            message.success("Đăng tin thành công!");
            onCreated?.();
        } catch (e) {
            message.error(e || "Đăng tin thất bại");
        }
    };

    const handleUpdate = async () => {
        const oldType = formData.listingType;
        const isChangingType = selectedTypeName && selectedTypeName !== oldType;

        if (isVipLike && isChangingType && qty <= 0) {
            setShowPromptEdit(true);
            return;
        }

        const payload = {
            ...formData,
            listingTypePolicyId: postTypeId ?? formData.listingTypePolicyId,
            autoRepost: formData.autoRepost,
        };

        try {
            await dispatch(updatePropertyThunk({
                id: editingId,
                formData: payload,
                listingTypePolicyId: payload.listingTypePolicyId,
                submitMode: "PUBLISHED",
            })).unwrap();

            message.success("Cập nhật tin thành công!");
            onCreated?.();
        } catch (e) {
            message.error(e || "Cập nhật thất bại");
        }
    };

    return (
        <>
            <div className="flex items-center justify-between px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 border-t border-[#e3e9f5] bg-[#f8faff]/90 backdrop-blur">
                <Button onClick={() => setStep("form")}>&larr; Quay lại</Button>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch checked={autoRepostVal} onChange={handleAutoRepostChange} />
                        <span className="text-gray-700 text-sm hidden sm:inline">Tự động đăng lại</span>
                        <Tooltip title="Tự động đăng lại tin khi hết hạn">
                            <InfoCircleOutlined className="text-gray-500 text-xs" />
                        </Tooltip>
                    </div>

                    {/* --- NÚT LƯU NHÁP & ĐĂNG TIN --- */}
                    <div className="flex gap-2">
                        <Button onClick={handleSaveDraft}>
                            Lưu nháp
                        </Button>
                        <Button
                            type="primary"
                            loading={posting}
                            className="bg-[#1b264f] hover:bg-[#22347c]"
                            onClick={isEdit ? handleUpdate : handleCreate}
                        >
                            {/* Logic hiển thị text: 
                                - Nếu đang sửa tin ĐÃ ĐĂNG (Active/Expired) -> Hiện 'Cập nhật'
                                - Nếu đang tạo mới HOẶC đang sửa bản NHÁP -> Hiện 'Đăng tin'
                            */}
                            {isEdit && !isDraft ? "Cập nhật" : "Đăng tin"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal nhắc mua thêm (CREATE) */}
            <Modal centered open={showPrompt} footer={null} onCancel={() => setShowPrompt(false)} title={null}>
                <div className="text-center space-y-3">
                    <div className="text-lg font-semibold text-[#0f223a]">
                        Bạn không còn lượt đăng cho gói {selectedTypeName}
                    </div>
                    <p className="text-gray-600">
                        Gói <b>{selectedTypeName}</b> đã hết số lượng. Bạn có muốn mua thêm không?
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        <Button onClick={() => setShowPrompt(false)}>Để sau</Button>
                        <Button type="primary" icon={<CreditCardOutlined />} onClick={() => { setShowPrompt(false); navigate("/dashboard/purchase"); }}>
                            Mua thêm
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal nhắc mua thêm (UPDATE - chỉ hiện khi đổi gói) */}
            <Modal centered open={showPromptEdit} footer={null} onCancel={() => setShowPromptEdit(false)} title={null}>
                <div className="text-center space-y-3">
                    <div className="text-lg font-semibold text-[#0f223a]">Nâng cấp gói tin</div>
                    <p className="text-gray-600">
                        Bạn đang chuyển sang gói <b>{selectedTypeName}</b> nhưng số lượng còn lại bằng 0.
                        Vui lòng mua thêm để thực hiện nâng cấp.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        <Button onClick={() => setShowPromptEdit(false)}>Hủy nâng cấp</Button>
                        <Button type="primary" icon={<CreditCardOutlined />} onClick={() => { setShowPromptEdit(false); navigate("/dashboard/purchase"); }}>
                            Mua ngay
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
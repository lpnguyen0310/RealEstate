import React, { useMemo, useState, useEffect } from "react";
import { Card } from "antd";
import {
    EnvironmentOutlined,
    BorderOuterOutlined,
    HomeOutlined,
    CarOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import ImagePickerModal from "../ModalImage/ImagePickerModal";
import { formatVND, priceText, makeUrl } from "@/utils/validators";

const Ribbon = ({ text }) => (
    <div className="absolute left-2 top-2 z-10">
        <div className="px-2 py-1 rounded-md bg-[#ffb020] text-white text-[12px] font-semibold shadow">
            {text}
        </div>
    </div>
);

export default function PostPreviewSection({
    data,
    postType = "free",
    editable = true,
    onImagesChange,
}) {
    const {
        title,
        description,
        price,
        landArea,
        images = [],
        displayAddress,
        suggestedAddress,
        position,
        bedrooms,
        bathrooms,
        constructionImages = [], // ⭐ thêm để preview ảnh xây dựng
    } = data || {};

    // objectURL cho File/Blob trong mảng images chính
    const [blobUrls, setBlobUrls] = useState([]);
    useEffect(() => {
        const urls = [];
        images.forEach((it) => {
            if (it instanceof File || it instanceof Blob) {
                urls.push(URL.createObjectURL(it));
            }
        });
        setBlobUrls(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [images]);

    // gộp ảnh chính + ảnh xây dựng để HIỂN THỊ
    const imgUrls = useMemo(() => {
        // 1) ảnh chính (images)
        const mappedMain = images.map(makeUrl);
        let bi = 0;
        const mainUrls = mappedMain
            .map((u) => u || blobUrls[bi++] || "")
            .filter(Boolean);

        // 2) ảnh xây dựng (constructionImages) – thường là string URL
        const consUrls = (constructionImages || [])
            .map(makeUrl)
            .filter(Boolean);

        return [...mainUrls, ...consUrls];
    }, [images, constructionImages, blobUrls]);

    const addrMain = displayAddress || suggestedAddress || "—";

    const pricePerM2 = useMemo(() => {
        const p = Number(price || 0);
        const a = Number(landArea || 0);
        if (!p || !a) return "";
        return `(~${formatVND(Math.round(p / a))}/m²)`;
    }, [price, landArea]);

    const ribbonText =
        postType === "premium" ? "Premium" :
            postType === "vip" ? "Vip" :
                null;

    // ===== EDIT: open picker & move image to slot =====
    const [pickerOpen, setPickerOpen] = useState(false);
    const [slotIndex, setSlotIndex] = useState(0);

    const openPickerAt = (idx) => {
        if (!editable) return;
        setSlotIndex(idx);
        setPickerOpen(true);
    };

    const moveImageToSlot = (pickedIndex) => {
        if (pickedIndex == null || !onImagesChange) return;

        // Chỉ thao tác trên mảng images chính
        const next = images.slice();
        if (pickedIndex >= next.length) {
            // Phòng hờ, thực tế sẽ không xảy ra
            setPickerOpen(false);
            return;
        }

        const [picked] = next.splice(pickedIndex, 1);
        // Nếu slotIndex > length thì splice sẽ đẩy xuống cuối
        next.splice(slotIndex, 0, picked);
        setPickerOpen(false);
        onImagesChange(next);
    };

    const addFiles = (fileList) => {
        if (!fileList?.length || !onImagesChange) return;
        const next = images.concat(Array.from(fileList));
        setPickerOpen(false);
        onImagesChange(next);
    };

    // Chỉ cho phép hover/click reorder trên ảnh thuộc images (index < images.length)
    const Clickable = ({ idx, children }) => {
        const canEdit = editable && idx < images.length;

        return (
            <button
                type="button"
                onClick={() => { if (canEdit) openPickerAt(idx); }}
                className={canEdit ? "relative group w-full" : "relative w-full"}
                style={{ cursor: canEdit ? "pointer" : "default" }}
            >
                {children}
                {canEdit && (
                    <div
                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition
                         bg-black/0 group-hover:bg-black/10"
                    />
                )}
            </button>
        );
    };

    const BaseImageBlock = ({ ribbon, showThumbs }) => (
        <div>
            <div className="rounded-xl overflow-hidden border border-[#e8eefc] bg-[#f5f7ff]">
                <Clickable idx={0}>
                    {ribbon && <Ribbon text={ribbon} />}
                    <img
                        src={imgUrls[0] || "https://placehold.co/800x600/png?text=No+Image"}
                        alt="cover"
                        className="w-full h-[220px] md:h-[260px] object-cover"
                        loading="lazy"
                    />
                </Clickable>
            </div>

            {showThumbs && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                    {[1, 2, 3].map((i) =>
                        imgUrls[i] ? (
                            <Clickable key={i} idx={i}>
                                <div className="rounded-lg overflow-hidden border border-[#e8eefc] bg-[#f5f7ff]">
                                    <img
                                        src={imgUrls[i]}
                                        alt={`thumb-${i}`}
                                        className="w-full h-[70px] object-cover"
                                    />
                                </div>
                            </Clickable>
                        ) : (
                            <button
                                key={i}
                                onClick={() => openPickerAt(i)}
                                className="grid place-items-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] h-[70px] text-[#8aa0c2]"
                            >
                                <PlusOutlined />
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );

    const FreeImage = () => <BaseImageBlock ribbon={null} showThumbs={false} />;
    const VipImages = () => <BaseImageBlock ribbon={ribbonText} showThumbs={true} />;

    const PremiumImages = () => {
        const slots = [0, 1, 2, 3, 4];
        return (
            <div className="rounded-xl overflow-hidden border border-[#e8eefc] bg-[#f5f7ff] p-2">
                <div className="grid grid-cols-3 gap-2">
                    {slots.map((idx, i) => {
                        const isTopRow = i < 3;
                        const h = isTopRow ? 140 : 120;
                        const u = imgUrls[idx];
                        return (
                            <div key={i} className="relative rounded-lg overflow-hidden border border-[#e8eefc]">
                                {i === 0 && ribbonText && <Ribbon text={ribbonText} />}
                                {u ? (
                                    <Clickable idx={idx}>
                                        <img
                                            src={u}
                                            alt={`p-${i}`}
                                            className="w-full"
                                            style={{ height: h, objectFit: "cover" }}
                                        />
                                    </Clickable>
                                ) : (
                                    <button
                                        onClick={() => openPickerAt(idx)}
                                        className="grid place-items-center text-[#8aa0c2]"
                                        style={{ height: h, background: "#f8fafc", width: "100%" }}
                                    >
                                        <PlusOutlined />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const ImageBlock =
        postType === "premium" ? PremiumImages :
            postType === "vip" ? VipImages :
                FreeImage;

    return (
        <div className="space-y-3">
            <div className="text-[20px] font-semibold text-[#0f223a]">Xem trước tin đăng</div>
            <div className="h-[2px] w-full bg-[#0f223a]/80 mb-2" />

            <Card
                bodyStyle={{ padding: 14 }}
                className="rounded-2xl border border-[#e3e9f5] bg-white shadow-sm"
            >
                {postType === "premium" ? (
                    <div className="space-y-4">
                        <ImageBlock />
                        <div className="min-w-0">
                            <TitleAndContent
                                title={title}
                                price={price}
                                pricePerM2={pricePerM2}
                                addrMain={addrMain}
                                position={position}
                                landArea={landArea}
                                bedrooms={bedrooms}
                                bathrooms={bathrooms}
                                description={description}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="w-full md:w-[320px] shrink-0">
                            <ImageBlock />
                        </div>
                        <div className="min-w-0 flex-1">
                            <TitleAndContent
                                title={title}
                                price={price}
                                pricePerM2={pricePerM2}
                                addrMain={addrMain}
                                position={position}
                                landArea={landArea}
                                bedrooms={bedrooms}
                                bathrooms={bathrooms}
                                description={description}
                            />
                        </div>
                    </div>
                )}
            </Card>

            <div className="rounded-xl border border-[#f6c7c7] bg-[#fdecec] text-[#812f2f] px-4 py-3 text-[14px]">
                <span className="font-medium pr-1">ℹ️</span>
                Bằng cách nhấn nút “Đăng tin”, bạn đồng ý với{" "}
                <a href="#" className="text-[#1d74ff] underline">Điều khoản dịch vụ</a> và{" "}
                <a href="#" className="text-[#1d74ff] underline">Chính sách</a> của nền tảng.
            </div>

            {/* Modal chọn ảnh */}
            <ImagePickerModal
                open={pickerOpen}
                images={images}
                onClose={() => setPickerOpen(false)}
                onPick={moveImageToSlot}
                onAddFiles={addFiles}
            />
        </div>
    );
}

function TitleAndContent({
    title,
    price,
    pricePerM2,
    addrMain,
    position,
    landArea,
    bedrooms,
    bathrooms,
    description,
}) {
    return (
        <>
            <div className="text-[16px] font-semibold text-[#0f223a] leading-6 line-clamp-2 break-words">
                {title || "—"}
            </div>

            <div className="mt-1 text-[28px] font-bold text-[#1d74ff]">
                {priceText(price)}{" "}
                <span className="text-[12px] font-medium text-[#6b7a99] align-middle">
                    {pricePerM2}
                </span>
            </div>

            <div className="mt-1 flex items-start gap-2 text-[14px] text-[#4b5d7d]">
                <EnvironmentOutlined className="mt-0.5 text-[#1d74ff]" />
                <span className="truncate">{addrMain}</span>
            </div>

            {position ? (
                <div className="mt-0.5 text-[14px] italic text-[#9aa8c0] line-clamp-1">
                    {position} <span className="text-[#5b7bff] ml-2">( Cũ )</span>
                </div>
            ) : null}

            <div className="mt-2 flex items-center gap-4 flex-wrap text-[14px] text-[#3b4a6b]">
                <span className="inline-flex items-center gap-1">
                    <BorderOuterOutlined />
                    {landArea ? `${Number(landArea)} m²` : "—"}
                </span>
                <span className="inline-flex items-center gap-1">
                    <HomeOutlined />
                    {typeof bedrooms === "number" ? bedrooms : "-"}
                    <span className="ml-1">Phòng ngủ</span>
                </span>
                <span className="inline-flex items-center gap-1">
                    <CarOutlined />
                    {typeof bathrooms === "number" ? bathrooms : "-"}
                    <span className="ml-1">Phòng tắm</span>
                </span>
            </div>

            <div className="mt-2 text-[14px] text-[#4b5d7d] leading-6 line-clamp-3 break-words">
                {description || "—"}
            </div>
        </>
    );
}

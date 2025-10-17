import React, { useMemo, useEffect, useState, useRef } from "react";
import { Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { makeUrl } from "@/utils/validators";

export default function ImagePickerModal({
    open,
    images = [],
    onClose,
    onPick,         // (pickedIndex) => void
    onAddFiles,     // (FileList) => void
}) {
    // hỗ trợ File/Blob => objectURL
    const [blobUrls, setBlobUrls] = useState([]);
    useEffect(() => {
        const urls = [];
        images.forEach((it) => {
            if (it instanceof File || it instanceof Blob) {
                const u = URL.createObjectURL(it);
                urls.push(u);
            }
        });
        setBlobUrls(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [images]);

    const imgUrls = useMemo(() => {
        const mapped = images.map(makeUrl);
        let bi = 0;
        return mapped.map((u) => (u || blobUrls[bi++] || "")).filter(Boolean);
    }, [images, blobUrls]);

    const inputRef = useRef(null);

    return (
        <Modal
            title="Thêm hình ảnh vào khung"
            open={open}
            onCancel={onClose}
            footer={null}
            width={720}
            destroyOnClose
        >
            <div className="grid grid-cols-5 gap-4">
                {imgUrls.map((u, i) => (
                    <button
                        key={i}
                        onClick={() => onPick?.(i)}
                        className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-[#f1f5f9] aspect-square"
                    >
                        <img src={u} alt={`opt-${i}`} className="w-full h-full object-cover" />
                    </button>
                ))}

                {/* Add tile */}
                <button
                    onClick={() => inputRef.current?.click()}
                    className="grid place-items-center rounded-2xl border-2 border-dashed border-[#cbd5e1] text-[#7b8aa2] aspect-square"
                >
                    <PlusOutlined />
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                hidden
                onChange={(e) => {
                    if (e.target.files?.length) onAddFiles?.(e.target.files);
                    e.target.value = "";
                }}
            />
        </Modal>
    );
}

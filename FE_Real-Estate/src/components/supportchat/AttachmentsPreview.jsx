// /src/components/supportchat/AttachmentsPreview.jsx
import React from "react";
import { formatBytes } from "./supportChatUtils";

export default function AttachmentsPreview({ attachments, onRemove }) {
    if (!attachments?.length) return null;

    return (
        <div className="px-3 pb-2">
            <div className="flex flex-wrap gap-2">
                {attachments.map((a) =>
                    a.type === "image" ? (
                        <div key={a.id} className="relative">
                            <img
                                src={a.url}
                                alt={a.name}
                                className="w-20 h-20 object-cover rounded-lg border"
                            />
                            <button
                                onClick={() => onRemove(a.id)}
                                className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full w-6 h-6 text-xs"
                                title="Xóa"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <div
                            key={a.id}
                            className="px-2 py-1 rounded-lg border text-xs flex items-center gap-2 bg-gray-50"
                        >
                            <span>📄</span>
                            <span className="max-w-[160px] truncate">{a.name}</span>
                            <span className="opacity-60">{formatBytes(a.size)}</span>
                            <button
                                onClick={() => onRemove(a.id)}
                                className="ml-1 text-gray-500 hover:text-red-600"
                                title="Xóa"
                            >
                                ✕
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

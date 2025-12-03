// /src/components/supportchat/ChatMessageList.jsx
import React, { useState } from "react";
import {
    fmtTime,
    clThumbFromUrl,
    clDownloadUrl,
    isImage,
    formatBytes,
} from "./supportChatUtils";
import { ReactionPopover, ReactionSummary } from "./Reactions";

export default function ChatMessageList({
    listRef,
    messages,
    currentUserId,
    reactionsByMsg,
    SZ,
    onReact,
}) {
    const [pickerState, setPickerState] = useState({
        msgId: null,
        align: "center",
        fileIndex: null,
    });

    const openPicker = (msgId, align, fileIndex = null) => {
        setPickerState((prev) =>
            prev.msgId === msgId && prev.fileIndex === fileIndex
                ? { msgId: null, align: "center", fileIndex: null }
                : { msgId, align, fileIndex }
        );
    };

    const closePicker = () =>
        setPickerState({ msgId: null, align: "center", fileIndex: null });

    const handlePick = (messageId, emoji) => {
        closePicker();
        onReact?.(messageId, emoji);
    };

    return (
        <div ref={listRef} className={`px-3 pt-3 overflow-y-auto ${SZ.msgH}`}>
            {messages.map((m) => {
                const imgs = (m.attachments || []).filter((a) => isImage(a));
                const files = (m.attachments || []).filter((a) => !isImage(a));
                const hasText = !!(m.content || "").trim();

                const isUser = m.role === "user";
                const align = isUser ? "justify-end" : "justify-start";
                const bubbleColor = isUser
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800";
                const msgId = String(m.messageId || m.id || "");
                const mySide = isUser ? "right" : "left";

                if (m.role === "system") {
                    return (
                        <div key={m.id} className="mb-5">
                            <div className="text-center text-[11px] text-gray-400 whitespace-pre-line">
                                {m.content}
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={m.id} className="mb-5">
                        {/* ===== TEXT BUBBLE ===== */}
                        {hasText && (
                            <div className={`flex ${align}`}>
                                <div
                                    className={`relative group w-fit max-w-[80%] inline-flex flex-col ${bubbleColor} rounded-2xl px-3 py-2 whitespace-pre-wrap break-words`}
                                >
                                    <div className="text-sm leading-5">{m.content}</div>
                                    <div
                                        className={`mt-1 text-[10px] ${isUser
                                                ? "text-white/80 self-end"
                                                : "text-gray-500 self-start"
                                            }`}
                                    >
                                        {fmtTime(m.ts)}
                                    </div>

                                    {/* Nút reaction bám bubble */}
                                    {currentUserId && (
                                        <div
                                            className={`absolute -bottom-5 ${isUser ? "right-2" : "left-2"
                                                } opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition`}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPicker(msgId, isUser ? "right" : "left", null);
                                                }}
                                                className={`h-7 w-7 grid place-items-center rounded-full ${isUser
                                                        ? "bg-white/20 text-white"
                                                        : "bg-white text-gray-700 border"
                                                    } shadow`}
                                                title="Thả cảm xúc"
                                            >
                                                👍
                                            </button>
                                        </div>
                                    )}

                                    <ReactionPopover
                                        visible={
                                            pickerState.msgId === msgId &&
                                            pickerState.fileIndex === null
                                        }
                                        align={pickerState.align}
                                        onPick={(emoji) => handlePick(msgId, emoji)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ===== GALLERY ẢNH ===== */}
                        {!!imgs.length && (
                            <div className={`flex ${align}`}>
                                <div
                                    className={`${isUser ? "items-end" : "items-start"
                                        } flex flex-col w-full`}
                                >
                                    <div
                                        className={`mt-2 grid gap-2 ${imgs.length === 1
                                                ? "grid-cols-1 max-w-[320px]"
                                                : "grid-cols-[repeat(auto-fill,minmax(96px,1fr))] max-w-[360px]"
                                            }`}
                                    >
                                        {imgs.map((a, i) => {
                                            const openHref = a.url;
                                            const thumb = a._local
                                                ? a.url
                                                : clThumbFromUrl(a.url, { w: 520, h: 520 });
                                            return (
                                                <div key={i} className="relative group">
                                                    <a
                                                        href={openHref}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block"
                                                    >
                                                        <img
                                                            src={thumb}
                                                            alt={a.name || `image-${i}`}
                                                            className={`rounded-xl ${imgs.length === 1
                                                                    ? "max-w-[320px] max-h-[360px] w-auto h-auto"
                                                                    : "w-[120px] h-[120px] object-cover"
                                                                }`}
                                                        />
                                                    </a>

                                                    {/* Nút reaction overlay trên từng ảnh */}
                                                    {currentUserId && (
                                                        <button
                                                            className="absolute bottom-1 right-1 h-7 w-7 grid place-items-center rounded-full bg-white/90 text-gray-700 shadow border opacity-0 group-hover:opacity-100 transition"
                                                            title="Thả cảm xúc"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                openPicker(
                                                                    msgId,
                                                                    isUser ? "right" : "left",
                                                                    i
                                                                );
                                                            }}
                                                        >
                                                            👍
                                                        </button>
                                                    )}

                                                    <div
                                                        className={`absolute z-50 -top-10 ${isUser ? "right-0" : "left-0"
                                                            }`}
                                                    >
                                                        <ReactionPopover
                                                            visible={
                                                                pickerState.msgId === msgId &&
                                                                pickerState.fileIndex === i
                                                            }
                                                            align={pickerState.align}
                                                            onPick={(emoji) => handlePick(msgId, emoji)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Nếu không có text, vẫn hiện giờ + nút reaction chung */}
                                    {!hasText && (
                                        <>
                                            <div className="mt-1 text-[10px] text-gray-500 whitespace-nowrap leading-none self-end">
                                                {fmtTime(m.ts)}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===== FILE CARDS ===== */}
                        {!!files.length && (
                            <div className={`flex ${align}`}>
                                <div className="mt-2 grid grid-cols-1 gap-2 w-full max-w-[360px]">
                                    {files.map((a, i) => {
                                        const openHref = a.url;
                                        const dlHref = clDownloadUrl(a.url, a.name);
                                        const lower = (a.name || "").toLowerCase();
                                        const icon = lower.endsWith(".pdf")
                                            ? "📕"
                                            : /\.(doc|docx)$/.test(lower)
                                                ? "📝"
                                                : /\.(xls|xlsx)$/.test(lower)
                                                    ? "📗"
                                                    : /\.(ppt|pptx)$/.test(lower)
                                                        ? "📙"
                                                        : "📄";

                                        return (
                                            <div
                                                key={i}
                                                className={`relative group flex items-center justify-between rounded-xl px-3 py-2 bg-white text-gray-800 border ${isUser ? "border-blue-100" : "border-gray-200"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-lg">{icon}</span>
                                                    <div className="min-w-0">
                                                        <a
                                                            href={openHref}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block text-sm truncate text-blue-600 hover:underline"
                                                            title={a.name}
                                                        >
                                                            {a.name || "file"}
                                                        </a>
                                                        <div className="text-[11px] text-gray-500">
                                                            {a.size ? formatBytes(a.size) : ""}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 pl-2">
                                                    <a
                                                        href={openHref}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="h-7 w-7 grid place-items-center rounded-md bg-gray-100 hover:bg-gray-200"
                                                        title="Mở"
                                                    >
                                                        📂
                                                    </a>
                                                    <a
                                                        href={dlHref}
                                                        className="h-7 w-7 grid place-items-center rounded-md bg-gray-100 hover:bg-gray-200"
                                                        title="Tải xuống"
                                                    >
                                                        ⬇
                                                    </a>
                                                </div>

                                                {/* Nút reaction góc card */}
                                                {currentUserId && (
                                                    <>
                                                        <button
                                                            className="absolute -top-2 -right-2 h-7 w-7 grid place-items-center rounded-full bg-white text-gray-700 shadow border opacity-0 group-hover:opacity-100 transition"
                                                            title="Thả cảm xúc"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                openPicker(
                                                                    msgId,
                                                                    isUser ? "right" : "left",
                                                                    i
                                                                );
                                                            }}
                                                        >
                                                            👍
                                                        </button>
                                                        <div
                                                            className={`absolute z-50 -top-10 ${isUser ? "right-0" : "left-0"
                                                                }`}
                                                        >
                                                            <ReactionPopover
                                                                visible={
                                                                    pickerState.msgId === msgId &&
                                                                    pickerState.fileIndex === i
                                                                }
                                                                align={pickerState.align}
                                                                onPick={(emoji) => handlePick(msgId, emoji)}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ===== REACTION SUMMARY ===== */}
                        <div className={`flex ${align}`}>
                            <ReactionSummary
                                data={reactionsByMsg[msgId]}
                                side={mySide}
                                onReact={(emoji) => handlePick(msgId, emoji)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

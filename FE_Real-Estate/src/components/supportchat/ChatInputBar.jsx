import React, { useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import EmojiPortal from "./EmojiPortal";

export default function ChatInputBar({ input, setInput, inputRef, onSend, onAddFiles }) {
    const [showEmoji, setShowEmoji] = useState(false);
    const emojiBtnRef = useRef(null);
    const fileImageInputRef = useRef(null);
    const fileAnyInputRef = useRef(null);

    return (
        <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    rows={1}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 min-h-[38px] resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-[140px] overflow-y-auto"
                />

                {/* Emoji */}
                <div className="relative">
                    <button
                        ref={emojiBtnRef}
                        onClick={() => setShowEmoji((v) => !v)}
                        className={`h-[38px] w-[38px] flex items-center justify-center rounded-xl ${showEmoji ? "bg-gray-200" : "bg-gray-50 hover:bg-gray-100"
                            } text-lg`}
                        title="Chèn emoji"
                    >
                        😀
                    </button>
                    <EmojiPortal
                        open={showEmoji}
                        anchorEl={emojiBtnRef.current}
                        onClose={() => setShowEmoji(false)}
                        width={320}
                        height={380}
                    >
                        <div className="shadow-xl border border-gray-200 rounded-2xl overflow-hidden bg-white">
                            <EmojiPicker
                                onEmojiClick={(e) => setInput((v) => v + e.emoji)}
                                theme="light"
                                height={380}
                                width={320}
                                searchDisabled
                                skinTonesDisabled
                                lazyLoadEmojis
                            />
                        </div>
                    </EmojiPortal>
                </div>

                {/* Image picker */}
                <button
                    onClick={() => fileImageInputRef.current?.click()}
                    className="h-[38px] w-[38px] flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100"
                    title="Gửi ảnh"
                >
                    🖼️
                </button>
                <input
                    ref={fileImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length) onAddFiles(files);
                        e.target.value = "";
                    }}
                />

                {/* Any file picker */}
                <button
                    onClick={() => fileAnyInputRef.current?.click()}
                    className="h-[38px] w-[38px] flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100"
                    title="Đính kèm tệp"
                >
                    📎
                </button>
                <input
                    ref={fileAnyInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length) onAddFiles(files);
                        e.target.value = "";
                    }}
                />

                <button
                    onClick={onSend}
                    className="h-[38px] px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                    Gửi
                </button>
            </div>
        </div>
    );
}

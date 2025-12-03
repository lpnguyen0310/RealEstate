// /src/components/supportchat/EmojiPortal.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

export default function EmojiPortal({ open, anchorEl, onClose, children, width = 320, height = 380 }) {
    if (!open || !anchorEl) return null;
    const rect = anchorEl.getBoundingClientRect();
    let top = rect.top - height - 8;
    let left = rect.right - width;
    if (top < 8) top = rect.bottom + 8;
    const maxLeft = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = maxLeft;

    useEffect(() => {
        const esc = (e) => e.key === "Escape" && onClose?.();
        const rs = () => onClose?.();
        window.addEventListener("resize", rs);
        document.addEventListener("keydown", esc);
        return () => {
            window.removeEventListener("resize", rs);
            document.removeEventListener("keydown", esc);
        };
    }, [onClose]);

    return ReactDOM.createPortal(
        <>
            <div style={{ position: "fixed", inset: 0, zIndex: 10049 }} onMouseDown={onClose} />
            <div
                style={{ position: "fixed", top, left, width, height, zIndex: 10050 }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    );
}

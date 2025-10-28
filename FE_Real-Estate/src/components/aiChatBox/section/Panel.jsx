import React from "react";
import { cn } from "../aiUtils";

export default function Panel({ refEl, open, sizeClass, children }) {
    return (
        <div
            ref={refEl}
            className={cn(
                `fixed ${sizeClass} right-4 z-40 max-w-[92vw] transition-all duration-300`,
                open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
        >
            <div className={cn("overflow-hidden rounded-2xl backdrop-blur-xl", "bg-white/90 ring-1 ring-black/10 shadow-2xl flex flex-col")}>
                {children}
            </div>
        </div>
    );
}

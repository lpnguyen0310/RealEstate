// src/components/sections/BannerCta.jsx
import React from "react";
import clsx from "clsx";


export default function BannerCta({
    title,
    description,
    buttonLabel = "Khám phá ngay",
    href = "#",
    bg,
    side = "right",
    tone = "light",
    minH = 280,
}) {
    return (
        <section className="mt-12">
            <div
                className={clsx(
                    "relative overflow-hidden rounded-3xl shadow-lg bg-cover bg-center"
                )}
                style={{ backgroundImage: `url(${bg})`, minHeight: minH }}
            >
                {/* overlay nhẹ để chữ nổi hơn */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

                <div className="relative max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-10">
                    <div className={clsx("w-full md:w-[560px]", side === "right" ? "md:ml-auto" : "md:mr-auto")}>
                        <div
                            className={clsx(
                                "rounded-3xl shadow-xl border p-6 md:p-8",
                                tone === "dark"
                                    ? "bg-gradient-to-r from-white/60 via-white/40 to-white/20 text-[#0f1b3d] border-white/40 backdrop-blur-md"
                                    : "bg-white/90 text-[#1b2a57] border-white/60 backdrop-blur-md"
                            )}
                        >
                            <h3 className="text-[22px] md:text-[26px] font-extrabold">
                                {title}
                            </h3>

                            <p className="mt-3 text-gray-600 leading-relaxed">
                                {description}
                            </p>

                            <a
                                href={href}
                                className={clsx(
                                    "inline-flex items-center justify-center mt-5 h-11 px-5 rounded-xl font-semibold shadow",
                                    tone === "dark"
                                        ? "bg-[#1b4ed3] hover:bg-[#173fa2] text-white"
                                        : "bg-[#1f4fbf] hover:bg-[#173fa2] text-white"
                                )}
                            >
                                {buttonLabel}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

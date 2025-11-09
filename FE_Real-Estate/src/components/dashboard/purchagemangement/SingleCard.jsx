import { Card, Button } from "antd";
import Qty from "./Qty";

export default function SingleCard({ item, value = 0, onChange }) {
    return (
        <Card className="rounded-2xl border !border-[#3c64f4] shadow-sm overflow-visible">
            <div className="relative text-center flex flex-col gap-2 items-center">
                {item.tag && (
                    <span
                        className={[
                            "absolute -top-10 -right-6 sm:-top-12 sm:-right-8 z-10",
                            "px-3 h-7 inline-flex items-center rounded-full text-xs font-medium text-white",
                            item.tag === "Hiệu suất" ? "bg-amber-500" : "bg-orange-500",
                            "shadow-[0_8px_16px_rgba(0,0,0,0.15)]",
                            "after:content-[''] after:absolute after:top-full after:right-5",
                            "after:border-8 after:border-transparent after:border-t-current",
                        ].join(" ")}
                    >
                        {item.tag}
                    </span>
                )}

                <h3 className="text-[16px] sm:text-[18px] font-semibold">{item.title}</h3>

                <div className="text-[12px] sm:text-[13px] text-gray-600 leading-tight">
                    <div>{item.desc}</div>
                </div>

                <div className={`text-[14px] sm:text-[15px] ${item.price === 0 ? "text-green-600" : "text-[#1a3b7c]"} font-medium`}>
                    {item.price === 0 ? "Miễn phí" : `${item.price.toLocaleString()} VNĐ`}
                </div>

                {item.price === 0 ? (
                    <Button type="primary" className="bg-[#0f2f63]">Đăng Tin</Button>
                ) : (
                    <Qty value={value} onChange={onChange} />
                )}
            </div>
        </Card>
    );
}

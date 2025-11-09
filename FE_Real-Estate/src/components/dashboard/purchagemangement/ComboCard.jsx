import { Card } from "antd";
import Qty from "./Qty";

export default function ComboCard({ item, value = 0, onChange }) {
    return (
        <Card className="rounded-2xl border !border-[#3c64f4] overflow-hidden" bodyStyle={{ padding: 0 }}>
            {/* Header gradient full-width */}
            <div className="h-12 sm:h-14 w-full bg-gradient-to-r from-[#a9c3ff] to-[#3059ff] flex items-center justify-center text-white font-semibold border-b border-[#e6edff] px-2 text-center">
                <span className="text-sm sm:text-base">{item.title}</span>
            </div>

            <div className="p-3 sm:p-4 text-center space-y-2">
                <div className="inline-block bg-[#ff6532]/10 text-[#ff6532] px-3 py-[2px] rounded-full text-xs font-medium">
                    {item.chip}
                </div>

                <div className="font-semibold text-sm sm:text-base">{item.sub}</div>

                <div className="text-gray-400 line-through text-xs sm:text-sm">
                    Giá gốc: {item.old.toLocaleString()} VNĐ
                </div>

                <div className="text-[#1a3b7c] text-[15px] sm:text-[16px] font-bold">
                    {item.price.toLocaleString()} VNĐ
                </div>

                <div className="text-xs text-blue-500">Tiết kiệm {item.save}%</div>

                <div className="mt-2">
                    <Qty value={value} onChange={onChange} />
                </div>
            </div>
        </Card>
    );
}

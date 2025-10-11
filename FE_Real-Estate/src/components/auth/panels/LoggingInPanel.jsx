import { Spin, Progress } from "antd";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";

export default function LoggingInPanel({ onDone }) {
    const [percent, setPercent] = useState(50);
    const [phase, setPhase] = useState("running"); // running | success
    const doneCalled = useRef(false);

    useEffect(() => {
        // Tăng dần tới 100
        const interval = setInterval(() => {
            setPercent((p) => {
                if (p >= 100) return 100;
                const next = p + 3; // tốc độ
                return next >= 100 ? 100 : next;
            });
        }, 60);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (percent >= 100 && !doneCalled.current) {
            // hiển thị trạng thái success một nhịp ngắn rồi báo done
            setPhase("success");
            doneCalled.current = true;
            const t = setTimeout(() => {
                onDone?.(); // 👉 báo cho LoginModal đóng
            }, 200); // giữ ✓ 200ms
            return () => clearTimeout(t);
        }
    }, [percent, onDone]);

    return (
        <div className="w-full text-center animate-fade-in">
            <h2 className="text-gray-900 font-bold text-[22px] mb-5">Đang đăng nhập</h2>

            <div className="flex flex-col items-center justify-center gap-4 mt-8">
                {phase === "running" ? (
                    <Spin size="large" tip="Xin vui lòng chờ..." />
                ) : (
                    <div className="flex items-center gap-2 mt-2">
                        <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 22 }} />
                        <span className="text-gray-700 font-medium">Đăng nhập thành công</span>
                    </div>
                )}

                <div className="w-[80%]">
                    <Progress
                        percent={percent}
                        status={phase === "running" ? "active" : "success"}
                        showInfo={false}
                    />
                </div>

                <div className="text-gray-500 text-sm">
                    Đang tải thông tin tài khoản và chuẩn bị phiên làm việc…
                </div>
            </div>
        </div>
    );
}

// src/layouts/AdminLayout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { logoutThunk } from "@/store/authSlice";
import AdminSidebar from "../components/admidashboard/AdminSidebar.jsx";

export default function AdminLayout() {
    const nav = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);

    const [pinned, setPinned] = useState(false);
    const [hovered, setHovered] = useState(false);

    const handleLogout = async () => {
        try { await dispatch(logoutThunk()).unwrap(); nav("/", { replace: true }); } catch { }
    };

    return (
        <div className="flex h-svh overflow-hidden bg-[#F7F8FC]">
            <AdminSidebar
                pinned={pinned}
                setPinned={setPinned}
                hovered={hovered}
                setHovered={setHovered}
            />

            <div className="flex-1 flex flex-col">
                <div className="sticky top-0 z-30 bg-[#F7F8FC] px-6 pt-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-[#0f2f63]">
                            Bảng điều khiển (Admin)
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-[#31507a]">
                                {user?.fullName || user?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 rounded-lg bg-[#0f2f63] text-white text-sm"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto px-6 pb-6">
                    <Outlet context={{ user }} />
                </main>
            </div>
        </div>
    );
}

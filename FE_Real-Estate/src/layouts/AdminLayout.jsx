// src/layouts/AdminLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMemo, useState } from "react";
import { logoutThunk } from "@/store/authSlice";
import AdminSidebar from "../components/admidashboard/AdminSidebar.jsx";
import { LogOut, Home } from "lucide-react";
import { ADMIN_MENUS } from "@/data/SideBar/menuDataAdmin";

export default function AdminLayout() {
    const nav = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);

    const [pinned, setPinned] = useState(false);
    const [hovered, setHovered] = useState(false);

    const initials = useMemo(() => {
        const base = (user?.fullName || user?.email || "U").trim();
        if (!base) return "U";
        const parts = base.split(/\s+/);
        const chars =
            parts.length === 1
                ? parts[0].slice(0, 2)
                : (parts[0][0] || "") + (parts[parts.length - 1][0] || "");
        return chars.toUpperCase();
    }, [user]);

    // === Tính mục menu hiện tại theo URL ===
    const { pageTitle, crumbLabel } = useMemo(() => {
        const pathname = location.pathname.replace(/\/+$/, ""); // bỏ dấu "/" cuối nếu có
        // Cho điểm khớp: 3 = bằng nhau, 2 = prefix + '/', 1 = prefix thường
        const scored = ADMIN_MENUS.map((m) => {
            const to = m.to?.replace(/\/+$/, "") || "";
            let rank = 0;
            if (pathname === to) rank = 3;
            else if (to && pathname.startsWith(`${to}/`)) rank = 2;
            else if (to && pathname.startsWith(to)) rank = 1;
            return { ...m, rank, len: to.length };
        })
            .filter((m) => m.rank > 0)
            .sort((a, b) => b.rank - a.rank || b.len - a.len);

        const current = scored[0] || null;

        const label = current?.breadcrumb || current?.text || "Dashboard";
        // Bạn có thể tùy chọn title khác ở đây, tạm dùng cùng 1 nhãn
        return { pageTitle: label, crumbLabel: label };
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await dispatch(logoutThunk()).unwrap();
            nav("/", { replace: true });
        } catch {
            // ignore
        }
    };

    const handleGoHome = () => {
        nav("/", { replace: true });
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
                {/* === TOP BAR === */}
                <header className="sticky top-0 z-30 mb-[15px]">
                    <div className="px-4 lg:px-6 pt-4 bg-[#F7F8FC]">
                        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-[0_6px_24px_rgba(15,47,99,0.08)]">
                            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:py-4">
                                {/* LEFT: Title + Breadcrumb */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-[#0f2f63]">
                                        <h1 className="truncate text-lg lg:text-xl font-semibold">
                                            {pageTitle}
                                        </h1>
                                        <span className="hidden sm:inline-block rounded-md bg-[#e9f0ff] text-[#31507a] text-[11px] font-semibold px-2 py-0.5">
                                            LIVE
                                        </span>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#607aa6]">
                                        <button
                                            onClick={handleGoHome}
                                            className="truncate hover:underline"
                                            title="Trang chính"
                                        >
                                            Trang chủ
                                        </button>
                                        <span>/</span>
                                        <span className="truncate text-[#0f2f63] font-medium">
                                            {crumbLabel}
                                        </span>
                                    </div>
                                </div>

                                {/* RIGHT: Home + User + Logout */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button
                                        onClick={handleGoHome}
                                        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-[#dfe6f3] bg-white text-[#0f2f63] text-sm font-medium hover:bg-[#f1f4f9] transition"
                                        title="Về trang chính"
                                    >
                                        <Home size={16} />
                                        <span className="hidden sm:inline">Trang chính</span>
                                    </button>

                                    <div className="hidden sm:flex items-center gap-3 px-2 py-1.5 rounded-xl border border-[#dfe6f3] bg-white/80">
                                        <div className="relative h-8 w-8 rounded-full bg-[#0f2f63] text-white grid place-items-center text-xs font-bold select-none">
                                            {initials}
                                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-sm font-medium text-[#0f2f63] max-w-[180px] truncate">
                                                {user?.fullName || user?.email}
                                            </div>
                                            <div className="text-[11px] text-[#607aa6]">Quản trị viên</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="!text-white inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-[#0f2f63] text-white text-sm font-medium hover:brightness-110 active:brightness-95 transition"
                                        title="Đăng xuất"
                                    >
                                        <LogOut size={16} />
                                        <span className="hidden sm:inline">Đăng xuất</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* === MAIN === */}
                <main className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">
                    <Outlet context={{ user }} />
                </main>
            </div>
        </div>
    );
}

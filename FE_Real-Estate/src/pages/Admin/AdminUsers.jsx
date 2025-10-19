import { useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { UsersTable,FiltersBar,UserDetailDrawer,StatCard,IMG_USERS, IMG_AGENTS, IMG_ACTIVE, IMG_LOCKED,styles } from "../../components/admidashboard/user";
import { fmtDate as fmtDateUtil } from "../../utils/validators";

// Mock sample
const INITIAL_USERS = [
    { id: 1, fullName: "Nguyễn Văn A", email: "a@example.com", phone: "0912345678", role: "USER", status: "ACTIVE", postsCount: 3, balance: 1200000, createdAt: "2025-04-12T09:30:00Z", address: "Q.1, TP.HCM", deleteRequested: false },
    { id: 2, fullName: "Trần Thị B", email: "b@example.com", phone: "0988888888", role: "AGENT", status: "ACTIVE", postsCount: 12, balance: 0, createdAt: "2025-05-02T10:00:00Z", address: "Q.3, TP.HCM", deleteRequested: true },
    { id: 3, fullName: "Admin", email: "admin@site.com", phone: "0900000000", role: "ADMIN", status: "LOCKED", postsCount: 0, balance: 0, createdAt: "2025-03-20T08:10:00Z", address: "Hà Nội", deleteRequested: false },
    { id: 4, fullName: "Phạm C", email: "c@example.com", phone: "0933333333", role: "USER", status: "PENDING", postsCount: 1, balance: 500000, createdAt: "2025-06-15T13:00:00Z", address: "", deleteRequested: false },
];

const fmtDate = fmtDateUtil;

export default function AdminUsersMUI() {
    // data + filters
    const [users, setUsers] = useState(INITIAL_USERS);
    const [q, setQ] = useState("");
    const [role, setRole] = useState("ALL");
    const [status, setStatus] = useState("ALL");

    // paging
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Drawer
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState(null);

    const filtered = useMemo(() => {
        const kw = q.trim().toLowerCase();
        return users
            .filter((u) => (role === "ALL" ? true : u.role === role))
            .filter((u) => (status === "ALL" ? true : u.status === status))
            .filter((u) =>
                kw
                    ? (u.fullName || "").toLowerCase().includes(kw) ||
                    (u.email || "").toLowerCase().includes(kw) ||
                    (u.phone || "").includes(kw)
                    : true
            )
            .map(u => ({ ...u, createdAtText: fmtDate(u.createdAt) }));
    }, [users, q, role, status]);

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(totalItems, page * pageSize);
    const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

    // Actions
    const lockUser = (id) => setUsers(p => p.map(u => u.id === id ? { ...u, status: "LOCKED" } : u));
    const unlockUser = (id) => setUsers(p => p.map(u => u.id === id ? { ...u, status: "ACTIVE" } : u));
    const markDeleteRequested = (id) => setUsers(p => p.map(u => u.id === id ? { ...u, deleteRequested: true } : u));
    const rejectDeleteRequest = (id) => setUsers(p => p.map(u => u.id === id ? { ...u, deleteRequested: false } : u));
    const approveDelete = (id) => setUsers(p => p.filter(u => u.id !== id));

    // KPIs
    const kpis = useMemo(() => {
        const total = users.length;
        const agents = users.filter((u) => u.role === "AGENT").length;
        const active = users.filter((u) => u.status === "ACTIVE").length;
        const locked = users.filter((u) => u.status === "LOCKED").length;
        return { total, agents, active, locked };
    }, [users]);

    const resetFilters = () => { setQ(""); setRole("ALL"); setStatus("ALL"); setPage(1); };

    return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", bgcolor: "#f8f9fc", p: 3 }}>
            <Box sx={{ width: "100%", maxWidth: 1440 }}>
                {/* KPI Cards */}
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mb={2}>
                    <StatCard title="Tổng người dùng" value={kpis.total} img={IMG_USERS} bg="linear-gradient(135deg,#eaf1ff 0%,#f7fbff 100%)" tint="#2b59ff" />
                    <StatCard title="Số môi giới (AGENT)" value={kpis.agents} img={IMG_AGENTS} bg="linear-gradient(135deg,#f3e9ff 0%,#fbf7ff 100%)" tint="#7a33ff" />
                    <StatCard title="Đang hoạt động" value={kpis.active} img={IMG_ACTIVE} bg="linear-gradient(135deg,#eaffe9 0%,#f8fff7 100%)" tint="#0ea85f" />
                    <StatCard title="Bị khóa" value={kpis.locked} img={IMG_LOCKED} bg="linear-gradient(135deg,#ffeaea 0%,#fff7f7 100%)" tint="#e03434" />
                </Stack>

                {/* Filters */}
                <FiltersBar
                    q={q} setQ={setQ}
                    role={role} setRole={setRole}
                    status={status} setStatus={setStatus}
                    onReset={resetFilters}
                />

                {/* Table */}
                <UsersTable
                    rows={pageData}
                    page={page}
                    totalPages={totalPages}
                    start={start}
                    end={end}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    onOpenDetail={(r) => { setDetail(r); setOpen(true); }}
                    onLock={lockUser}
                    onUnlock={unlockUser}
                    onMarkDeleteRequested={markDeleteRequested}
                    onRejectDelete={rejectDeleteRequest}
                    onApproveDelete={(id) => {
                        if (window.confirm(`Xác nhận xóa vĩnh viễn tài khoản #${id}? Hành động không thể hoàn tác.`)) {
                            approveDelete(id);
                        }
                    }}
                />

                {/* Drawer chi tiết */}
                <UserDetailDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    detail={detail}
                    fmtDate={fmtDate}
                    onLock={lockUser}
                    onUnlock={unlockUser}
                    onApproveDelete={approveDelete}
                    onRejectDelete={rejectDeleteRequest}
                    onMarkDeleteRequested={markDeleteRequested}
                />
            </Box>
        </Box>
    );
}

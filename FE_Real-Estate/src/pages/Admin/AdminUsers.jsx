import { useMemo, useState, useEffect, useCallback, useRef, useTransition } from "react";
import { Box, Stack, CircularProgress, LinearProgress } from "@mui/material";
import {
    UsersTable,
    FiltersBar,
    UserDetailDrawer,
    StatCard,
    IMG_USERS,
    IMG_AGENTS,
    IMG_ACTIVE,
    IMG_LOCKED,
} from "../../components/admidashboard/user";
import ConfirmModal from "@/utils/ConfirmModal";
import { fmtDate as fmtDateUtil } from "../../utils/validators";
import { adminUsersApi } from "@/api/adminApi/adminUsersApi";
import { message } from "antd";

const fmtDate = fmtDateUtil;

export default function AdminUsersMUI() {
    /* ========== FILTERS / PAGING ========== */
    const [q, setQ] = useState("");
    const [role, setRole] = useState("ALL");
    const [status, setStatus] = useState("ALL");
    const [page, setPage] = useState(1); // UI 1-based
    const [pageSize, setPageSize] = useState(10);

    /* ========== DATA ========== */
    const [rows, setRows] = useState([]);
    const [totalItems, setTotalItems] = useState(0);

    // 2 mức loading
    const [initialLoading, setInitialLoading] = useState(true); // chỉ lần đầu
    const [softLoading, setSoftLoading] = useState(false); // cho lọc/trang/hành động
    const firstLoadRef = useRef(true);
    const debounceRef = useRef(null);

    /* ========== DRAWER ========== */
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState(null);

    /* ========== CONFIRM MODAL ========== */
    const [confirmCfg, setConfirmCfg] = useState({
        open: false,
        title: "",
        message: "",
        confirmText: "Xác nhận",
        severity: "default",
        onConfirm: null,
    });
    const [confirmLoading, setConfirmLoading] = useState(false);
    const openConfirm = (cfg) => setConfirmCfg((p) => ({ ...p, ...cfg, open: true }));
    const closeConfirm = () => {
        if (!confirmLoading) setConfirmCfg((p) => ({ ...p, open: false, onConfirm: null }));
    };
    const runConfirm = async () => {
        if (!confirmCfg.onConfirm) return;
        try {
            setConfirmLoading(true);
            await confirmCfg.onConfirm();
            closeConfirm();
        } finally {
            setConfirmLoading(false);
        }
    };

    /* ========== LOAD LIST FROM API (2 chế độ) ========== */
    const fetchList = useCallback(
        async ({ soft = false } = {}) => {
            // Lần đầu: show spinner; các lần sau: overlay mảnh, KHÔNG clear rows
            if (firstLoadRef.current && !soft) {
                setInitialLoading(true);
            } else {
                setSoftLoading(true);
            }

            try {
                const res = await adminUsersApi.list({
                    q: q || undefined,
                    role,
                    status,
                    page: Math.max(0, page - 1), // 0-based cho BE
                    size: pageSize,
                });

                const pageData = res?.data?.content ? res.data : res;
                const content = pageData?.content ?? [];
                const total = pageData?.totalElements ?? 0;

                const mapped = content.map((u) => {
                    const beStatus =
                        u.status ??
                        ((() => {
                            const raw = u.isActive ?? u.active ?? true;
                            return raw === true || raw === 1 || raw === "1" || String(raw).toLowerCase() === "true"
                                ? "ACTIVE"
                                : "LOCKED";
                        })());

                    const lockRequested = !!(u.lockRequested ?? u.lock_request ?? u.lockFlag);
                    const deleteRequested = !!(u.deleteRequested ?? u.delete_request ?? u.deleteFlag);
                    const displayStatus = lockRequested || deleteRequested ? "PENDING" : beStatus;

                    return {
                        id: u.id ?? u.userId,
                        fullName: u.fullName || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
                        email: u.email,
                        phone: u.phone,
                        role: (Array.isArray(u.roles) && u.roles[0]) || u.role || "USER",
                        status: beStatus, // ACTIVE | LOCKED (thực)
                        displayStatus, // ACTIVE | LOCKED | PENDING (hiển thị)
                        lockRequested,
                        deleteRequested,
                        postsCount: u.postsCount ?? 0,
                        balance: u.balance ?? 0,
                        createdAt: u.createdAt ?? u.createdDate ?? u.postedAt ?? null,
                        address: u.address ?? "",
                    };
                });

                // Không bao giờ setRows([]) trong lúc loading để tránh giật
                setRows(mapped);
                setTotalItems(total);
            } catch (err) {
                console.error(err);
                message.error(err?.response?.data?.message || "Không tải được danh sách người dùng.");
                // Giữ nguyên dữ liệu cũ nếu lỗi => tránh flash
            } finally {
                firstLoadRef.current = false;
                setInitialLoading(false);
                setSoftLoading(false);
            }
        },
        [q, role, status, page, pageSize]
    );

    // Lần đầu
    useEffect(() => {
        fetchList({ soft: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounce cho mọi thay đổi filter/paging sau lần đầu
    useEffect(() => {
        if (firstLoadRef.current) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchList({ soft: true });
        }, 250); // chỉnh 200-400ms tùy cảm giác
        return () => clearTimeout(debounceRef.current);
    }, [q, role, status, page, pageSize, fetchList]);

    /* ========== PAGINATION / RENDER DATA ========== */
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(totalItems, page * pageSize);

    const pageData = useMemo(
        () => rows.map((u) => ({ ...u, createdAtText: fmtDate(u.createdAt) })),
        [rows]
    );

    /* ========== OPTIMISTIC UPDATE ========== */
    const updateRowLocal = (id, patch) => {
        setRows((prev) =>
            prev.map((u) => {
                if (u.id !== id) return u;
                const next = { ...u, ...patch };
                const pending = !!(next.lockRequested || next.deleteRequested);
                next.displayStatus = pending ? "PENDING" : (next.status || u.status);
                return next;
            })
        );
        setDetail((d) => {
            if (!d || d.id !== id) return d;
            const next = { ...d, ...patch };
            const pending = !!(next.lockRequested || next.deleteRequested);
            next.displayStatus = pending ? "PENDING" : (next.status || d.status);
            return next;
        });
    };

    const INFO_FILTER_MSG =
        "Đang lọc ACTIVE nên tài khoản vừa khóa có thể không còn hiển thị trong danh sách.";

    /* ========== ACTIONS (API + optimistic + soft refetch) ========== */
    const confirmLock = (rowOrId) => {
        const row = typeof rowOrId === "object" ? rowOrId : rows.find((x) => x.id === rowOrId);
        if (!row) return;

        const isApprove = !!row.lockRequested;
        openConfirm({
            title: isApprove ? "Duyệt yêu cầu khóa" : "Khóa tài khoản",
            message: isApprove
                ? `Xác nhận duyệt khóa tài khoản #${row.id}?`
                : `Bạn có chắc muốn khóa tài khoản #${row.id}? Người dùng sẽ không thể đăng nhập.`,
            confirmText: isApprove ? "Duyệt khóa" : "Khóa",
            severity: "warning",
            onConfirm: async () => {
                await adminUsersApi.lock(row.id); // BE gộp lock & approve-lock
                updateRowLocal(row.id, { status: "LOCKED", lockRequested: false, deleteRequested: false });
                message.success(isApprove ? "Đã duyệt khóa tài khoản." : "Đã khóa tài khoản.");
                if (!isApprove && status === "ACTIVE") message.info(INFO_FILTER_MSG);
                // Soft refetch để đồng bộ lại tổng/trang mà không giật bảng
                fetchList({ soft: true });
            },
        });
    };

    const confirmRejectLock = (id) =>
        openConfirm({
            title: "Từ chối yêu cầu khóa",
            message: `Bạn có chắc muốn từ chối yêu cầu khóa của tài khoản #${id}?`,
            confirmText: "Từ chối",
            severity: "default",
            onConfirm: async () => {
                await adminUsersApi.rejectLock(id);
                updateRowLocal(id, { lockRequested: false });
                message.success("Đã từ chối yêu cầu khóa.");
                fetchList({ soft: true });
            },
        });

    const confirmUnlock = (id) =>
        openConfirm({
            title: "Mở khóa tài khoản",
            message: `Bạn có chắc muốn mở khóa tài khoản #${id}?`,
            confirmText: "Mở khóa",
            severity: "default",
            onConfirm: async () => {
                await adminUsersApi.unlock(id);
                updateRowLocal(id, { status: "ACTIVE", lockRequested: false, deleteRequested: false });
                message.success("Đã mở khóa tài khoản.");
                fetchList({ soft: true });
            },
        });

    const confirmApproveDelete = (id) =>
        openConfirm({
            title: "Xóa vĩnh viễn tài khoản",
            message: `Xác nhận xóa tài khoản #${id}? Hành động không thể hoàn tác. Toàn bộ dữ liệu liên quan sẽ bị xóa.`,
            confirmText: "Xóa vĩnh viễn",
            severity: "error",
            onConfirm: async () => {
                await adminUsersApi.hardDelete(id); // ✅ xoá thật
                message.success("Đã xóa vĩnh viễn tài khoản.");
                fetchList({ soft: true });
            },
        });

    const confirmRejectDelete = (id) =>
        openConfirm({
            title: "Từ chối yêu cầu xóa",
            message: `Bạn có chắc muốn từ chối yêu cầu xóa của tài khoản #${id}?`,
            confirmText: "Từ chối",
            severity: "default",
            onConfirm: async () => {
                await adminUsersApi.rejectDelete(id);
                updateRowLocal(id, { deleteRequested: false });
                message.success("Đã từ chối yêu cầu xóa.");
                fetchList({ soft: true });
            },
        });

    /* ========== KPIs (tạm tính theo trang hiện tại) ========== */
    const kpis = useMemo(() => {
        const total = totalItems;
        const agents = rows.filter((u) => u.role === "AGENT").length;
        const active = rows.filter((u) => u.status === "ACTIVE").length;
        const locked = rows.filter((u) => u.status === "LOCKED").length;
        return { total, agents, active, locked };
    }, [rows, totalItems]);

    /* ========== HELPERS ========== */
    const resetFilters = () => {
        setQ("");
        setRole("ALL");
        setStatus("ALL");
        setPage(1);
    };

    /* ========== RENDER ========== */
    const showInitialSpinner = initialLoading && rows.length === 0;

    return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", bgcolor: "#f8f9fc", p: 3 }}>
            <Box sx={{ width: "100%", maxWidth: 1440, position: "relative" }}>
                {/* Soft loading overlay — không làm giật layout */}
                {softLoading && (
                    <Box sx={{ position: "sticky", top: 0, left: 0, right: 0, zIndex: 5 }}>
                        <LinearProgress />
                    </Box>
                )}

                {/* KPI Cards */}
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mb={2}>
                    <StatCard
                        title="Tổng người dùng"
                        value={kpis.total}
                        img={IMG_USERS}
                        bg="linear-gradient(135deg,#eaf1ff 0%,#f7fbff 100%)"
                        tint="#2b59ff"
                    />
                    <StatCard
                        title="Số môi giới (AGENT)"
                        value={kpis.agents}
                        img={IMG_AGENTS}
                        bg="linear-gradient(135deg,#f3e9ff 0%,#fbf7ff 100%)"
                        tint="#7a33ff"
                    />
                    <StatCard
                        title="Đang hoạt động"
                        value={kpis.active}
                        img={IMG_ACTIVE}
                        bg="linear-gradient(135deg,#eaffe9 0%,#f8fff7 100%)"
                        tint="#0ea85f"
                    />
                    <StatCard
                        title="Bị khóa"
                        value={kpis.locked}
                        img={IMG_LOCKED}
                        bg="linear-gradient(135deg,#ffeaea 0%,#fff7f7 100%)"
                        tint="#e03434"
                    />
                </Stack>

                {/* Filters */}
                <FiltersBar
                    q={q}
                    setQ={setQ}
                    role={role}
                    setRole={setRole}
                    status={status}
                    setStatus={setStatus}
                    onReset={resetFilters}
                />

                {/* Initial Loading (toàn trang, chỉ lần đầu) */}
                {showInitialSpinner && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                )}

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
                    onOpenDetail={(r) => {
                        setDetail(r);
                        setOpen(true);
                    }}
                    onLock={confirmLock} // nhận row hoặc id
                    onUnlock={confirmUnlock}
                    onRejectLock={confirmRejectLock}
                    onRejectDelete={confirmRejectDelete}
                    onApproveDelete={confirmApproveDelete}
                    // Không truyền loading mạnh vào Table để tránh skeleton giật
                    loading={false}
                />

                {/* Drawer chi tiết */}
                <UserDetailDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    detail={detail}
                    fmtDate={fmtDate}
                    onLock={(id) => confirmLock(id)}
                    onUnlock={(id) => confirmUnlock(id)}
                    onApproveDelete={(id) => confirmApproveDelete(id)}
                    onRejectDelete={(id) => confirmRejectDelete(id)}
                />

                {/* Modal xác nhận dùng chung */}
                <ConfirmModal
                    open={confirmCfg.open}
                    title={confirmCfg.title}
                    message={confirmCfg.message}
                    confirmText={confirmCfg.confirmText}
                    severity={confirmCfg.severity}
                    loading={confirmLoading}
                    onClose={closeConfirm}
                    onConfirm={runConfirm}
                />
            </Box>
        </Box>
    );
}

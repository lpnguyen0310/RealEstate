// src/pages/Admin/AdminPostsMUI.jsx
import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { fmtDate, normalizeStatuses,countByStatus,money} from "../../utils/validators";
import {
  KpiGrid,
  PillBar,
  FiltersBar,
  PostsTable,
  PostDetailDrawer,
} from "../../components/admidashboard/post";

/* ---------- Mock data (đủ field cho Drawer) ---------- */
const INITIAL_POSTS = [
  {
    id: "TD-1001",
    title: "Căn hộ 2PN – Q.1, view sông",
    category: "Căn hộ",
    listingType: "NORMAL",
    area: 75,
    displayAddress: "Quận 1, TP.HCM",
    description: "Căn hộ 2PN, đã có sổ, view sông thoáng mát, nội thất đầy đủ.",
    images: [
      "https://images.unsplash.com/photo-1505691723518-36a5ac3b2ccb?q=80&w=1200",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200",
    ],
    price: 5200000000,
    status: "PENDING",
    createdAt: "2025-06-20T08:30:00Z",
    expiresAt: "2025-07-20T08:30:00Z",
    author: { name: "Nguyễn Văn A", email: "a@example.com" },
    audit: [{ at: "20/06/2025 15:30", by: "system", type: "CREATED", message: "Người dùng tạo tin" }],
  },
  {
    id: "TD-1002",
    title: "Nhà phố 4x20, Q.7 – nội thất cao cấp",
    category: "Nhà phố",
    listingType: "PREMIUM",
    area: 80,
    displayAddress: "Quận 7, TP.HCM",
    description: "Nhà phố 1 trệt 2 lầu, nội thất cao cấp, khu dân cư an ninh.",
    images: ["https://images.unsplash.com/photo-1600585154340-1e4ce9a1428b?q=80&w=1200"],
    price: 8200000000,
    status: "PUBLISHED",
    createdAt: "2025-06-05T09:10:00Z",
    expiresAt: dayjs().add(5, "day").toISOString(),
    author: { name: "Trần Thị B", email: "b@example.com" },
    audit: [{ at: "05/06/2025 16:10", by: "Admin", type: "APPROVED", message: "Duyệt 30 ngày (PREMIUM)" }],
  },
  {
    id: "TD-1003",
    title: "Đất nền 100m2 – Bình Chánh",
    category: "Đất nền",
    listingType: "NORMAL",
    area: 100,
    displayAddress: "Bình Chánh, TP.HCM",
    description: "Sổ riêng, đường vào 6m, gần trường học, chợ.",
    images: [],
    price: 1800000000,
    status: "REJECTED",
    createdAt: "2025-05-17T14:15:00Z",
    expiresAt: "2025-06-17T14:15:00Z",
    author: { name: "Admin", email: "admin@site.com" },
    audit: [{ at: "18/05/2025 10:22", by: "Admin", type: "REJECTED", message: "Thiếu giấy tờ pháp lý" }],
  },
];

/* ---------- Page component ---------- */
export default function AdminPostsMUI() {
  const [posts, setPosts] = useState(INITIAL_POSTS);

  // filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");       // lọc Category
  const [listingType, setListingType] = useState(""); // lọc Loại tin

  // tab + paging
  const [selectedTab, setSelectedTab] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // drawer
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  // quyết định duyệt
  const [decision, setDecision] = useState({ listingType: "NORMAL", durationDays: 30, reason: "" });

  // normalize trạng thái hết hạn / sắp hết hạn
  const normalized = useMemo(() => normalizeStatuses(posts), [posts]);

  // đếm theo trạng thái
  const counts = useMemo(() => countByStatus(normalized), [normalized]);

  // filter
  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return normalized
      .filter((p) => (selectedTab ? p.status === selectedTab : true))
      .filter((p) =>
        kw ? p.title.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw) || p.author?.name?.toLowerCase().includes(kw) : true
      )
      .filter((p) => (category ? p.category === category : true))
      .filter((p) => (listingType ? (p.listingType || "NORMAL") === listingType : true));
  }, [normalized, q, selectedTab, category, listingType]);

  // paging
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // actions
  const approve = (id) =>
    setPosts((p) =>
      p.map((x) =>
        x.id === id
          ? {
              ...x,
              status: "PUBLISHED",
              listingType: decision.listingType,
              expiresAt: dayjs().add(decision.durationDays || 30, "day").toISOString(),
              audit: [
                ...(x.audit || []),
                {
                  at: dayjs().format("DD/MM/YYYY HH:mm"),
                  by: "Admin",
                  type: "APPROVED",
                  message: decision.reason || `Duyệt ${decision.durationDays} ngày (${decision.listingType})`,
                },
              ],
            }
          : x
      )
    );

  const reject = (id) =>
    setPosts((p) =>
      p.map((x) =>
        x.id === id
          ? {
              ...x,
              status: "REJECTED",
              audit: [
                ...(x.audit || []),
                {
                  at: dayjs().format("DD/MM/YYYY HH:mm"),
                  by: "Admin",
                  type: "REJECTED",
                  message: decision.reason || "Từ chối tin",
                },
              ],
            }
          : x
      )
    );

  const hide = (id) => setPosts((p) => p.map((x) => (x.id === id ? { ...x, status: "HIDDEN" } : x)));
  const unhide = (id) => setPosts((p) => p.map((x) => (x.id === id ? { ...x, status: "PUBLISHED" } : x)));
  const hardDelete = (id) => setPosts((p) => p.filter((x) => x.id !== id));

  const onOpenDetail = (r) => {
    setDetail({ ...r, priceLabel: money(r.price) });
    setDecision({ listingType: r.listingType || "NORMAL", durationDays: 30, reason: "" });
    setOpen(true);
  };

  const resetFilters = () => {
    setQ("");
    setCategory("");
    setListingType("");
    setPage(1);
  };

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center", bgcolor: "#f8f9fc", p: 3 }}>
      <Box sx={{ width: "100%", maxWidth: 1440 }}>
        {/* KPI */}
        <KpiGrid
          total={posts.length}
          pending={counts.PENDING}
          active={counts.PUBLISHED + counts.EXPIRING_SOON}
          expSoon={counts.EXPIRING_SOON}
          expired={counts.EXPIRED}
        />

        {/* Thanh pill trạng thái */}
        <PillBar
          selected={selectedTab}
          onSelect={(key) => {
            setSelectedTab(key);
            setPage(1);
          }}
          counts={counts}
        />

        {/* Thanh tìm kiếm + bộ lọc */}
        <FiltersBar
          q={q}
          setQ={setQ}
          category={category}
          setCategory={setCategory}
          listingType={listingType}
          setListingType={setListingType}
          onSearch={() => setPage(1)}
          onReset={resetFilters}
        />

        {/* Bảng */}
        <PostsTable
          rows={pageData}
          page={page}
          totalPages={totalPages}
          start={start}
          end={end}
          totalItems={totalItems}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          onOpenDetail={onOpenDetail}
          onApprove={(id) => {
            // có thể yêu cầu note khi approve nếu muốn
            approve(id);
          }}
          onReject={(id) => {
            if (window.confirm("Từ chối tin này?")) reject(id);
          }}
          onHide={hide}
          onUnhide={unhide}
          onHardDelete={(id) => {
            if (window.confirm(`Xóa tin ${id}? Hành động không thể hoàn tác.`)) hardDelete(id);
          }}
          money={money}
          fmtDate={fmtDate}
          setDecision={setDecision}
        />

        {/* Drawer review */}
        <PostDetailDrawer
          open={open}
          onClose={() => setOpen(false)}
          detail={detail}
          decision={decision}
          setDecision={setDecision}
          money={money}
          fmtDate={fmtDate}
          onApprove={approve}
          onReject={reject}
        />
      </Box>
    </Box>
  );
}

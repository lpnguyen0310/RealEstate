// src/components/dashboard/postmanagement/PostList.jsx
import { Select, Pagination, Empty, Skeleton } from "antd";
import PostCard from "./PostCard";
import "../../../../public/css/post_list.css";

function PostCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_6px_24px_rgba(13,47,97,0.04)]">
            <div className="flex gap-4">
                <div className="w-[160px] h-[110px] overflow-hidden rounded-xl bg-gray-100">
                    <Skeleton.Image active style={{ width: "100%", height: "110px" }} />
                </div>
                <div className="flex-1">
                    <Skeleton
                        active
                        title={{ width: "80%" }}
                        paragraph={{ rows: 2, width: ["90%", "70%"] }}
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <Skeleton.Button active size="small" style={{ width: 120 }} />
                        <Skeleton.Button active size="small" shape="round" style={{ width: 80 }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PostList({
    items = [],
    total = 0,
    page = 1,
    pageSize = 5,
    onPageChange = () => { },
    onPageSizeChange = () => { },
    loading = false,
    // 🆕 callback khi click card
    onItemClick = () => { },
}) {
    const showEmpty = !loading && items.length === 0;

    return (
        <div className="space-y-4">
            {/* LIST */}
            <div className="space-y-4">
                {loading
                    ? Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                        <PostCardSkeleton key={`sk-${i}`} />
                    ))
                    : items.map((p) => (
                        <PostCard key={p.id} post={p} onOpenDetail={onItemClick} />
                    ))}

                {showEmpty && (
                    <div className="text-center text-gray-500 bg-white rounded-2xl border border-gray-100 p-8">
                        <Empty description="Chưa có tin nào." />
                    </div>
                )}
            </div>

            {/* PAGINATION BAR */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-[0_6px_24px_rgba(13,47,97,0.04)]">
                {/* left: page size + info */}
                <div className="flex items-center gap-3">
                    <Select
                        value={pageSize}
                        disabled={loading}
                        onChange={(v) => onPageSizeChange(v)}
                        options={[10, 20, 30, 50].map((n) => ({
                            label: n.toString(),
                            value: n,
                        }))}
                        className="!w-[90px] [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selection-item]:!leading-10"
                        popupMatchSelectWidth={false}
                    />
                    <span className="text-gray-500 mt-[8px]">
                        Hiển thị {total === 0 ? 0 : (page - 1) * pageSize + 1} đến{" "}
                        {Math.min(page * pageSize, total)} của {total}
                    </span>
                </div>

                {/* right: pagination */}
                <Pagination
                    className="flex items-center post-pagination"
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    onChange={onPageChange}
                    disabled={loading}
                />
            </div>
        </div>
    );
}

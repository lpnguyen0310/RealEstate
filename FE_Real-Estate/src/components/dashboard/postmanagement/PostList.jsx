import { Select, Pagination } from "antd";
import PostCard from "./PostCard";
import "../../../../public/css/post_list.css";

export default function PostList({
    items = [],
    total = 0,
    page = 1,
    pageSize = 20,
    onPageChange = () => { },
    onPageSizeChange = () => { },
}) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="space-y-4">
            {/* LIST */}
            <div className="space-y-4">
                {items.map((p) => <PostCard key={p.id} post={p} />)}
                {items.length === 0 && (
                    <div className="text-center text-gray-500 bg-white rounded-2xl border border-gray-100 p-8">
                        Chưa có tin nào.
                    </div>
                )}
            </div>

            {/* PAGINATION BAR */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-[0_6px_24px_rgba(13,47,97,0.04)]">
                {/* left: page size + info */}
                <div className="flex items-center gap-3">
                    <Select
                        value={pageSize}
                        onChange={(v) => onPageSizeChange(v)}
                        options={[10, 20, 30, 50].map((n) => ({ label: n.toString(), value: n }))}
                        className="!w-[90px] [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selection-item]:!leading-10"
                        popupMatchSelectWidth={false}
                    />
                    <span className="text-gray-500 mt-[8px]">
                        Hiển thị {total === 0 ? 0 : (page - 1) * pageSize + 1} đến {Math.min(page * pageSize, total)} của {total}
                    </span>
                </div>

                {/* right: pagination */}
                <Pagination
                    className="flex items-center post-pagination "
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    onChange={onPageChange}
                    itemRender={(p, type, original) => {
                        const baseBtn =
                            "px-5 h-10 inline-flex items-center justify-center rounded-xl transition font-medium " +
                            "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";
                        const grayBtn = "bg-gray-300 text-gray-700 hover:bg-gray-400"; // xám đậm hơn
                        const numBtn =
                            "min-w-10 px-3 h-10 rounded-xl border border-gray-200 transition " +
                            "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";
                        const activeBtn = "bg-[#415a8c] text-white shadow-sm";

                        const totalPages = Math.max(1, Math.ceil(total / pageSize));
                        const isPrevDisabled = page <= 1;
                        const isNextDisabled = page >= totalPages;

                        if (type === "prev") {
                            return (
                                <button
                                    className={`${baseBtn} ${grayBtn} ${isPrevDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}
                                    tabIndex={-1}
                                    onMouseDown={(e) => e.preventDefault()} // ngăn browser focus
                                >
                                    Trước
                                </button>
                            );
                        }
                        if (type === "next") {
                            return (
                                <button
                                    className={`${baseBtn} ${grayBtn} ${isNextDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}
                                    tabIndex={-1}
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    Tiếp Theo
                                </button>
                            );
                        }
                        if (type === "page") {
                            const isActive = p === page;
                            return (
                                <button
                                    className={`${numBtn} ${isActive ? activeBtn : "bg-white text-gray-700 hover:bg-gray-50"} !focus:outline-none !focus-visible:outline-none !focus:ring-0`}
                                    tabIndex={-1}
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    {p}
                                </button>
                            );
                        }
                        return original;
                    }}
                />

            </div>
        </div>
    );
}

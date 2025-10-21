import useFavorites from "@/hooks/useFavorites";
import { Empty } from "antd";
import { Link } from "react-router-dom";

export default function SavedPosts() {
  const { list } = useFavorites();
  if (!list.length) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Empty description="Chưa có tin nào được lưu" />
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((p) => (
        <Link key={p.id} to={p.href} className="block group">
          <div className="rounded-xl border bg-white overflow-hidden hover:shadow">
            <img src={p.thumb} alt="" className="w-full h-[180px] object-cover" />
            <div className="p-4">
              <div className="font-semibold line-clamp-2 mb-1">{p.title}</div>
              <div className="text-sm text-gray-500">{p.savedAgo}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

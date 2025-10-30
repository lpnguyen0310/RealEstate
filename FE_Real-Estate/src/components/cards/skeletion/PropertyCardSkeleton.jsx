import SkeletonBlock from "../skeletion/SkeletonBlock";

export default function PropertyCardSkeleton() {
    return (
        <div className="rounded-[20px] border bg-white p-3 sm:p-4">
            {/* Ảnh */}
            <SkeletonBlock className="w-full aspect-[4/3] rounded-[16px]" />

            {/* Tiêu đề + info */}
            <SkeletonBlock className="mt-4 h-5 w-3/4" />
            <SkeletonBlock className="mt-2 h-4 w-1/2" />
            <SkeletonBlock className="mt-3 h-4 w-2/3" />

            {/* Tag/giá */}
            <div className="mt-3 flex gap-2">
                <SkeletonBlock className="h-6 w-16 rounded-full" />
                <SkeletonBlock className="h-6 w-24 rounded-full" />
            </div>
        </div>
    );
}

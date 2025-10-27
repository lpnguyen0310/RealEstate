// // src/hooks/useFavorites.js
// import { useCallback, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//     makeSelectIsSaved,
//     selectSavedListEnhanced as selectSavedList,
//     selectSavedCount,
//     toggleSaved,
//     removeSaved,
// } from "@/store/favoriteSlice";

// /**
//  * Hook tiện dụng cho thao tác với danh sách tin đã lưu (favorites)
//  * @param {number|string|null} id - id của bài đăng muốn kiểm tra (tùy chọn)
//  * @returns {object} - { isSaved, toggle, remove, list, count }
//  */
// export default function useFavorites(id) {
//     const dispatch = useDispatch();

//     const selectIsSaved = useMemo(
//         () => (id != null ? makeSelectIsSaved(id) : null),
//         [id]
//     );

//     const isSaved = useSelector((s) =>
//         selectIsSaved ? selectIsSaved(s) : false
//     );

//     // === Danh sách và tổng số tin đã lưu ===
//     const list = useSelector(selectSavedList);
//     const count = useSelector(selectSavedCount);

//     // === Toggle lưu / bỏ lưu (có payload để đồng bộ meta) ===
//     const toggle = useCallback(
//         (payload) => dispatch(toggleSaved(payload)),
//         [dispatch]
//     );

//     // === Xóa riêng một item khỏi danh sách ===
//     const remove = useCallback(
//         (itemId) => dispatch(removeSaved(itemId)),
//         [dispatch]
//     );

//     return useMemo(
//         () => ({
//             isSaved,
//             toggle,
//             remove,
//             list,
//             count,
//         }),
//         [isSaved, toggle, remove, list, count]
//     );
// }

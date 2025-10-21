// src/hooks/useFavorites.js
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    makeSelectIsSaved,
    selectSavedListEnhanced as selectSavedList, // nếu bạn đã có selector enhanced
    selectSavedCount,
    toggleSaved,
    removeSaved,
} from "@/store/favoriteSlice";

export default function useFavorites(id) {
    const dispatch = useDispatch();

    const selectIsSaved = useMemo(
        () => (id != null ? makeSelectIsSaved(id) : null),
        [id]
    );
    const isSaved = useSelector((s) => (selectIsSaved ? selectIsSaved(s) : false));

    const list = useSelector(selectSavedList);
    const count = useSelector(selectSavedCount);

    const toggle = useCallback(
        (payload) => dispatch(toggleSaved(payload)),
        [dispatch]
    );

    const remove = useCallback(
        (itemId) => dispatch(removeSaved(itemId)),
        [dispatch]
    );

    return { isSaved, toggle, remove, list, count };
}

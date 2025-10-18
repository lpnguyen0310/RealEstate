import { useEffect, useState } from "react";
import { getListingTypes } from "@/api/listingType";

function useListingTypes(open) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;
        let mounted = true;
        setLoading(true);
        setError(null);

        getListingTypes()
            .then((list) => {
                if (!mounted) return;
                setItems((list || []).filter((x) => String(x.isActive) === "1"));
            })
            .catch((e) => mounted && setError(e?.message || "Load listing types failed"))
            .finally(() => mounted && setLoading(false));

        return () => { mounted = false; };
    }, [open]);

    return { items, loading, error };
}

export default useListingTypes;

import { useEffect, useState } from "react";
import { amenityApi } from "../api/amenityApi";

export default function useAmenities() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await amenityApi.getAll();
        if (alive) setData(list ?? []);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}

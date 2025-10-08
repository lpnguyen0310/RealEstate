import { useEffect, useState, useCallback } from "react";

export default function useCountdown(initial = 60) {
  const [value, setValue] = useState(initial);
  const restart = useCallback((n = initial) => setValue(n), [initial]);

  useEffect(() => {
    if (value <= 0) return;
    const t = setInterval(() => setValue((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [value]);

  return { value, restart, setValue };
}

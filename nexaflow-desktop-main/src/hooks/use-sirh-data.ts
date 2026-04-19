import { useState, useEffect } from 'react';

declare global {
  interface Window { electron?: any }
}

export function useSirhData(query: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    window.electron?.queryDB(query).then((rows: any[]) => {
      if (!mounted) return;
      setData(rows);
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false };
  }, [query]);

  return { data, loading };
}

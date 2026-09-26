'use client';

import { useEffect, useState } from 'react';

interface DataFreshness {
  dataAge: string;
  isStale: boolean;
}

export function useDataFreshness(lastUpdated: Date | null): DataFreshness {
  const [freshness, setFreshness] = useState<DataFreshness>({
    dataAge: '--',
    isStale: false,
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!lastUpdated) return;
      const elapsedSeconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

      if (elapsedSeconds < 60) {
        setFreshness({ dataAge: `${elapsedSeconds}s ago`, isStale: false });
      } else if (elapsedSeconds < 3600) {
        setFreshness({
          dataAge: `${Math.floor(elapsedSeconds / 60)}m ago`,
          isStale: elapsedSeconds > 300,
        });
      } else {
        setFreshness({
          dataAge: `${Math.floor(elapsedSeconds / 3600)}h ago`,
          isStale: true,
        });
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [lastUpdated]);

  return freshness;
}

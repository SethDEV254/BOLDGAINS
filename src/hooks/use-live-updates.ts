'use client';

import { useEffect, useRef } from 'react';

export function useLiveUpdates(onUpdate: () => void) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const source = new EventSource('/api/events');
    source.addEventListener('update', () => callbackRef.current());
    return () => source.close();
  }, []);
}

'use client';

import { useEffect, useState } from 'react';

import { DEFAULT_LANDING } from '@/lib/landingDefaults';

// Load the editable landing content from the local API, falling back to the
// bundled defaults until it arrives (so the page renders instantly).
export function useLandingContent() {
  const [content, setContent] = useState(DEFAULT_LANDING);

  useEffect(() => {
    let alive = true;
    fetch('/api/landing-content')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data && typeof data === 'object') setContent(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return content;
}

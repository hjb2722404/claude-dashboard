import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'claude-dashboard-bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  const toggle = useCallback((sessionId: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((sessionId: string) => bookmarks.has(sessionId), [bookmarks]);

  return { bookmarks, toggle, isBookmarked };
}

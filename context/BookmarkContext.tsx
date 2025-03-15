'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Contest } from '@/types/contest';

interface BookmarkContextType {
  bookmarks: Contest[];
  toggleBookmark: (contest: Contest) => void;
  isBookmarked: (contestId: number) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Contest[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('bookmarks');
    if (stored) {
      setBookmarks(JSON.parse(stored));
    }
  }, []);

  const toggleBookmark = (contest: Contest) => {
    setBookmarks(prev => {
      const isBookmarked = prev.some(b => b.id === contest.id);
      const newBookmarks = isBookmarked
        ? prev.filter(b => b.id !== contest.id)
        : [...prev, contest];
      localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  const isBookmarked = (contestId: number) => {
    return bookmarks.some(b => b.id === contestId);
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) throw new Error('useBookmarks must be used within BookmarkProvider');
  return context;
};

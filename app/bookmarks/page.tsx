'use client';
import { useBookmarks } from '@/context/BookmarkContext';
import { ContestCard } from '@/components/ContestCard';

export default function BookmarksPage() {
  const { bookmarks } = useBookmarks();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Bookmarked Contests</h1>
      {bookmarks.length === 0 ? (
        <p className="text-gray-600 text-center">No bookmarked contests yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  );
}

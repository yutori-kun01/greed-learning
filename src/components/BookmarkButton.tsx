'use client';

import { useState, useTransition } from 'react';
import { toggleBookmark } from '@/actions/bookmarks';
import Icon from '@/components/Icon';

export default function BookmarkButton({
  courseId,
  initialBookmarked,
  size = 32,
  variant = 'overlay',
}: {
  courseId: string;
  initialBookmarked: boolean;
  size?: number;
  variant?: 'overlay' | 'plain';
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    startTransition(async () => {
      try {
        await toggleBookmark(courseId);
      } catch {
        setBookmarked(!next); // revert on failure
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={bookmarked ? 'ブックマークを解除' : 'ブックマークに追加'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: variant === 'overlay' ? 'rgba(0,0,0,.55)' : 'var(--line)',
        border: 'none',
        color: bookmarked ? 'var(--gold)' : (variant === 'overlay' ? '#fff' : 'var(--text-2)'),
        cursor: 'pointer',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.5),
      }}
    >
      <Icon name="bookmark" />
    </button>
  );
}

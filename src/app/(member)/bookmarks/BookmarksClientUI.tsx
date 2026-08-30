'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleBookmark } from '@/actions/bookmarks';

type BookmarkedCourse = {
  id: string;
  title: string;
  description: string | null;
};

export default function BookmarksClientUI({ courses }: { courses: BookmarkedCourse[] }) {
  const [items, setItems] = useState(courses);
  const [, startTransition] = useTransition();

  const removeBookmark = (id: string) => {
    setItems(prev => prev.filter(c => c.id !== id)); // optimistic
    startTransition(async () => {
      try {
        await toggleBookmark(id);
      } catch {
        setItems(courses); // revert to server-confirmed state on failure
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">ブックマーク</h1>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {items.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)', position: 'relative' }}>
              <button
                onClick={() => removeBookmark(c.id)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  color: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
                title="ブックマークを解除"
              >
                ×
              </button>
            </div>
            <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>{c.title}</h3>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                {c.description}
              </div>
              <Link href={`/courses/${c.id}`} className="btn btn-ghost btn-block" style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}>
                学習を開始
              </Link>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '14px', gridColumn: '1 / -1' }}>
            ブックマークはありません。
          </div>
        )}
      </div>
    </div>
  );
}

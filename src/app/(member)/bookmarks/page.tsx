'use client';

import { useState } from 'react';
import Link from 'next/link';

const ALL_BOOKMARKS = [
  { id: 'strategy-01', title: '01. リード獲得の全体設計', desc: 'N8Nの基本から応用まで...' },
  { id: 'content-04', title: '04. コンテンツ量産の仕組み化', desc: 'テンプレート化で工数を削減する方法' },
  { id: 'traffic-07', title: '07. 広告運用の基礎', desc: '少額予算からはじめる広告設計' },
  { id: 'automation-05', title: '05. ステップメールの自動化', desc: '集客からナーチャリングまでを自動化' },
];

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState(ALL_BOOKMARKS);

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">ブックマーク</h1>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {bookmarks.map(b => (
          <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="thumb" style={{ aspectRatio: '2.2/1', background: '#101d31', position: 'relative' }}>
              <button
                onClick={() => removeBookmark(b.id)}
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
              <h3 className="card-title" style={{ marginBottom: '16px' }}>{b.title}</h3>
              <div style={{ fontSize: '12px', color: '#7d8b9f', marginBottom: '16px' }}>
                {b.desc}
              </div>
              <Link href={`/courses/${b.id}`} className="btn btn-ghost btn-block" style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}>
                学習を開始
              </Link>
            </div>
          </div>
        ))}
        {bookmarks.length === 0 && (
          <div style={{ color: '#7d8b9f', fontSize: '14px', gridColumn: '1 / -1' }}>
            ブックマークはありません。
          </div>
        )}
      </div>
    </div>
  );
}

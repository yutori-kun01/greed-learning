'use client';

import { useState } from 'react';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([1, 2, 3, 4]);

  const removeBookmark = (id: number) => {
    setBookmarks(bookmarks.filter(b => b !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">ブックマーク</h1>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {bookmarks.map(i => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="thumb" style={{ aspectRatio: '2.2/1', background: '#101d31', position: 'relative' }}>
              <button 
                onClick={() => removeBookmark(i)}
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
              <h3 className="card-title" style={{ marginBottom: '16px' }}>保存したコース {i}</h3>
              <div style={{ fontSize: '12px', color: '#7d8b9f', marginBottom: '16px' }}>
                N8Nの基本から応用まで...
              </div>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 'auto' }}>学習を開始</button>
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

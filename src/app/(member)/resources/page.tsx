'use client';

import { useState } from 'react';

const RESOURCES = [
  { icon: '📄', title: 'PDFテンプレート', desc: '業務効率化のための標準フォーマット' },
  { icon: '✅', title: 'チェックリスト', desc: '自動化フロー公開前の確認リスト' },
  { icon: '🎬', title: 'ボーナス動画', desc: '特別ウェビナーのアーカイブ録画' },
  { icon: '📁', title: 'スワイプファイル集', desc: '高コンバージョンを記録したLPの構造' },
  { icon: '🔑', title: 'キーワードリスト', desc: 'SEO対策向けの厳選キーワード' },
  { icon: '✉️', title: 'メールテンプレート', desc: 'ステップメールに使える雛形' },
];

type Status = 'idle' | 'downloading' | 'done';

export default function ResourcesPage() {
  const [status, setStatus] = useState<Record<number, Status>>({});

  const handleDownload = (index: number) => {
    if (status[index] === 'downloading') return;
    setStatus(prev => ({ ...prev, [index]: 'downloading' }));
    setTimeout(() => {
      setStatus(prev => ({ ...prev, [index]: 'done' }));
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">リソース・特典</h1>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {RESOURCES.map((res, i) => {
          const s = status[i] || 'idle';
          return (
            <div key={i} className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{res.icon}</div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>{res.title}</h3>
              <p style={{ color: '#7d8b9f', fontSize: '13px', marginBottom: '24px', flexGrow: 1 }}>{res.desc}</p>
              <button
                className={`btn ${s === 'done' ? 'btn-ghost' : 'btn-gold'}`}
                style={{ width: '100%' }}
                disabled={s === 'downloading'}
                onClick={() => handleDownload(i)}
              >
                {s === 'downloading' ? 'ダウンロード中...' : s === 'done' ? '✓ ダウンロード済み' : 'ダウンロード'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

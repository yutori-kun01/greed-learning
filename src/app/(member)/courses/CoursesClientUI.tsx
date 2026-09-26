'use client';
import React, { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import Link from 'next/link';
import BookmarkButton from '@/components/BookmarkButton';
import { categoriesFrom } from '@/lib/courseCategories';

type SortKey = 'new' | 'progress' | 'remaining';

type Course = {
  id: string;
  number: string;
  title: string;
  desc: string | null;
  progress: number;
  lessons: number;
  minutes: number;
  cat: string;
  badge: string | null;
  locked?: boolean;
  bookmarked?: boolean;
};

export default function CoursesClientUI({ courses, query = '' }: { courses: Course[]; query?: string }) {
  const [activeCat, setActiveCat] = useState('all');
  const [sort, setSort] = useState<SortKey>('new');

  // 検索語はヘッダーの検索ボックスから ?q= で渡ってくる。
  const categories = useMemo(() => categoriesFrom(courses), [courses]);
  const needle = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const matched = courses.filter(c => {
      if (activeCat !== 'all' && c.cat !== activeCat) return false;
      if (needle && !`${c.number} ${c.title} ${c.desc ?? ''}`.toLowerCase().includes(needle)) return false;
      return true;
    });

    // 「新着順」はサーバーから渡された順（作成日順）のまま。
    if (sort === 'progress') return [...matched].sort((a, b) => b.progress - a.progress);
    if (sort === 'remaining') return [...matched].sort((a, b) => a.progress - b.progress);
    return matched;
  }, [courses, activeCat, needle, sort]);

  return (
    <section className="courses">
      <div className="toolbar">
        <div className="chips" role="tablist" aria-label="カテゴリー">
          {categories.map(c => (
            <button 
              key={c.id}
              className={`chip ${activeCat === c.id ? 'is-active' : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="select">
          <select aria-label="並び替え" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="new">新着順</option>
            <option value="progress">進捗が高い順</option>
            <option value="remaining">残りが多い順</option>
          </select>
          <Icon name="chevron" />
        </label>
      </div>

      <h2 className="section-title">
        {query ? `「${query}」の検索結果` : 'すべての講座'}
        <span id="count">（{filtered.length}）</span>
      </h2>

      <div className="grid">
        {filtered.map(c => (
          <Link href={`/courses/${c.id}`} key={c.id}>
            <article className="card" tabIndex={0} style={{ height: '100%' }}>
              <div className="thumb">
                {c.badge && <span className={`badge ${c.badge === 'NEW' ? 'badge-blue' : 'badge-gold'}`}>{c.badge}</span>}
                {c.locked && (
                  <span
                    className="badge"
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.55)', color: '#fff' }}
                  >
                    🔒 会員限定
                  </span>
                )}
                <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 3 }}>
                  <BookmarkButton courseId={c.id} initialBookmarked={!!c.bookmarked} size={28} />
                </div>
                <div style={{ width: '100%', height: '100%', background: 'var(--panel-3)' }}></div>
              </div>
              <div className="card-body">
                <h3 className="card-title">{c.number}. {c.title}</h3>
                <p className="card-desc">{c.desc}</p>
                <div className="progress">
                  <span className="bar"><span style={{ width: `${c.progress}%` }}></span></span>
                  <b>{c.progress}%</b>
                </div>
                <div className="card-meta">
                  <span><Icon name="lesson" />{c.lessons}レッスン</span>
                  <span><Icon name="clock" />{c.minutes}分</span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="empty">
          {query ? `「${query}」に一致する講座がありません。` : '該当する講座がありません。'}
        </div>
      )}
    </section>
  );
}

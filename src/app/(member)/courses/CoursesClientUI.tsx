'use client';
import React, { useState } from 'react';
import Icon from '@/components/Icon';
import Link from 'next/link';
import BookmarkButton from '@/components/BookmarkButton';
import CoverArt from '@/components/CoverArt';

type Category = { id: string; name: string };
type Tag = { id: string; name: string };
type SortKey = 'new' | 'progress' | 'remaining';

const UNCATEGORIZED = '__none__';

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
  thumbnailUrl?: string | null;
  locked?: boolean;
  bookmarked?: boolean;
  tagIds: string[];
  /** Still waiting on the customer journey: shown greyed out, not clickable. */
  journeyLocked: boolean;
  requirements: Array<{ text: string; met: boolean }>;
  journeyUnlocked: boolean;
  secret: boolean;
};

export default function CoursesClientUI({
  courses,
  categories,
  tags,
  initialTags = [],
}: {
  courses: Course[];
  categories: Category[];
  tags: Tag[];
  initialTags?: string[];
}) {
  const [activeCat, setActiveCat] = useState('all');
  const [activeTags, setActiveTags] = useState<string[]>(initialTags);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('new');

  // Tabs come from カテゴリ管理. 未分類 appears only when some course has no
  // (or a deleted) category, so it never shows as an empty tab.
  const known = new Set(categories.map((c) => c.id));
  const hasUncategorized = courses.some((c) => !known.has(c.cat));
  const tabs = [
    { id: 'all', label: 'すべて' },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
    ...(hasUncategorized ? [{ id: UNCATEGORIZED, label: '未分類' }] : []),
  ];

  const tagName = new Map(tags.map((t) => [t.id, t.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  // Only tags some listed course carries; an unused tag would filter to nothing.
  const usedTagIds = new Set(courses.flatMap((c) => c.tagIds));
  const filterTags = tags.filter((t) => usedTagIds.has(t.id));

  const toggleTag = (id: string) =>
    setActiveTags((current) => (current.includes(id) ? current.filter((t) => t !== id) : [...current, id]));

  // Every word must match somewhere: number, title, description, category or a tag.
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const filtered = courses
    .map((c, index) => ({ c, index }))
    .filter(({ c }) => {
      if (activeCat === UNCATEGORIZED ? known.has(c.cat) : activeCat !== 'all' && c.cat !== activeCat) return false;
      // Selected tags narrow the list: a course must carry all of them.
      if (!activeTags.every((t) => c.tagIds.includes(t))) return false;
      if (words.length > 0) {
        const haystack = [
          c.number,
          c.title,
          c.desc ?? '',
          categoryName.get(c.cat) ?? '',
          ...c.tagIds.map((t) => `#${tagName.get(t) ?? ''}`),
        ].join(' ').toLowerCase();
        if (!words.every((w) => haystack.includes(w))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Courses arrive oldest first, so "new" is the reverse of that order.
      if (sort === 'progress') return b.c.progress - a.c.progress || b.index - a.index;
      if (sort === 'remaining') return a.c.progress - b.c.progress || b.index - a.index;
      return b.index - a.index;
    })
    .map(({ c }) => c);

  const activeLabel = tabs.find((t) => t.id === activeCat)?.label ?? 'すべて';
  const title = [
    activeCat === 'all' ? 'すべての講座' : activeLabel,
    ...activeTags.map((t) => `#${tagName.get(t) ?? ''}`),
  ].join(' ');

  return (
    <section className="courses">
      <label className="search course-search">
        <Icon name="search" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="講座名・説明・カテゴリ・タグで検索"
          aria-label="講座を検索"
        />
      </label>

      <div className="toolbar">
        <div className="chips" role="tablist" aria-label="カテゴリー">
          {tabs.map(c => (
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
          <select aria-label="並び替え" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="new">新着順</option>
            <option value="progress">進捗が高い順</option>
            <option value="remaining">残りが多い順</option>
          </select>
          <Icon name="chevron" />
        </label>
      </div>

      {filterTags.length > 0 && (
        <div className="tag-filter" aria-label="タグで絞り込み">
          <span className="tag-filter-label"><Icon name="tag" /> タグ</span>
          <div className="tags">
            {filterTags.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tag ${activeTags.includes(t.id) ? 'is-active' : ''}`}
                aria-pressed={activeTags.includes(t.id)}
                onClick={() => toggleTag(t.id)}
              >
                #{t.name}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button type="button" className="tag" onClick={() => setActiveTags([])} style={{ color: 'var(--muted)' }}>
                × クリア
              </button>
            )}
          </div>
        </div>
      )}

      <h2 className="section-title">{title}<span id="count">（{filtered.length}）</span></h2>

      <div className="grid">
        {filtered.map((c) => (c.journeyLocked ? <LockedCard key={c.id} c={c} tagName={tagName} /> : (
          <Link href={`/courses/${c.id}`} key={c.id}>
            <article className="card" tabIndex={0} style={{ height: '100%' }}>
              <div className="thumb">
                <CoverArt src={c.thumbnailUrl} title={c.title} label={c.number ? `COURSE ${c.number}` : null} />
                {c.badge && <span className={`badge ${c.badge === 'NEW' ? 'badge-blue' : 'badge-gold'}`}>{c.badge}</span>}
                {c.locked ? (
                  <span
                    className="badge"
                    style={{ position: 'absolute', top: 8, right: 8, left: 'auto', background: 'rgba(0,0,0,.55)', color: '#fff' }}
                  >
                    🔒 会員限定
                  </span>
                ) : c.journeyUnlocked && (
                  <span className="unlock-badge">{c.secret ? '✨ 隠し講座' : '🔓 開放済み'}</span>
                )}
                <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 3 }}>
                  <BookmarkButton courseId={c.id} initialBookmarked={!!c.bookmarked} size={28} />
                </div>
                <div style={{ width: '100%', height: '100%', background: 'var(--panel-3)' }}></div>
              </div>
              <div className="card-body">
                <h3 className="card-title">{c.number}. {c.title}</h3>
                <p className="card-desc">{c.desc}</p>
                <CardTags ids={c.tagIds} tagName={tagName} />
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
        )))}
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          該当する講座がありません。
        </div>
      )}
    </section>
  );
}

function CardTags({ ids, tagName }: { ids: string[]; tagName: Map<string, string> }) {
  const names = ids.map((id) => tagName.get(id)).filter((n): n is string => Boolean(n));
  if (names.length === 0) return null;
  return (
    <div className="tags">
      {names.map((n) => <span key={n} className="tag">#{n}</span>)}
    </div>
  );
}

/** A course the journey has not opened yet: visible, greyed out, not a link. */
function LockedCard({ c, tagName }: { c: Course; tagName: Map<string, string> }) {
  return (
    <article className="card is-locked" style={{ height: '100%' }}>
      <div className="thumb">
        <CoverArt src={c.thumbnailUrl} title={c.title} label={c.number ? `COURSE ${c.number}` : null} />
        <span className="unlock-badge">🔒 未開放</span>
        <div style={{ width: '100%', height: '100%', background: 'var(--panel-3)' }}></div>
      </div>
      <div className="card-body">
        <h3 className="card-title">{c.number}. {c.title}</h3>
        <p className="card-desc">{c.desc}</p>
        <CardTags ids={c.tagIds} tagName={tagName} />
        <div className="lock-note" style={{ marginTop: 'auto' }}>
          <b>開放条件</b>
          {c.requirements.map((r) => (
            <span key={r.text} className={r.met ? 'is-met' : undefined}>
              {r.met ? '✓' : '・'} {r.text}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

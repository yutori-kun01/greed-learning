import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { getCourseProgressOverview } from '@/lib/courseProgress';
import { getGamificationSummary } from '@/lib/gamification';
import LevelCard from '@/components/gamification/LevelCard';
import BadgeShelf from '@/components/gamification/BadgeShelf';
import CoverArt from '@/components/CoverArt';

export default async function DashboardPage() {
  const me = await requireUser();
  const summary = await getGamificationSummary(me.id);

  const overview = await getCourseProgressOverview(me.id);
  const inProgress = overview.inProgress.slice(0, 3);
  const nextUp = overview.notStarted.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="panel">
        <h1 className="panel-title">ようこそ、{me.name}さん</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px' }}>
          {summary.currentStreak > 0
            ? `${summary.currentStreak}日連続で学習中です。今日も続けましょう。`
            : '今日から学習を始めて、連続記録をつくりましょう。'}
        </p>
      </div>

      <LevelCard summary={summary} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{summary.completedLessons}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>完了したレッスン</div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{summary.completedCourses}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>完走した講座</div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{summary.currentStreak}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            連続学習日数{summary.longestStreak > 0 && `（最長 ${summary.longestStreak}日）`}
          </div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{summary.totalPoints.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>獲得ポイント</div>
        </div>
      </div>

      <BadgeShelf earned={summary.badges} />

      <div>
        <h2 className="section-title">学習中の講座</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {inProgress.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              現在学習中の講座はありません。
            </div>
          ) : (
            inProgress.map((c) => (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)' }}>
                  <CoverArt src={c.thumbnailUrl} title={c.title} label={c.number ? `COURSE ${c.number}` : null} />
                  {c.badge && <span className="badge badge-gold">{c.badge}</span>}
                </div>
                <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>{c.title}</h3>
                  <div className="progress">
                    <div className="bar"><span style={{ width: `${c.percent}%` }}></span></div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', marginBottom: '16px' }}>
                    {c.done} / {c.total} レッスン完了（{c.percent}%）
                  </div>
                  <Link href={`/courses/${c.id}`} className="btn btn-gold btn-block" style={{ marginTop: 'auto', textAlign: 'center' }}>
                    学習を続ける
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {nextUp.length > 0 && (
        <div>
          <h2 className="section-title">次に始める講座</h2>
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {nextUp.map((c) => (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)' }}>
                  <CoverArt src={c.thumbnailUrl} title={c.title} label={c.number ? `COURSE ${c.number}` : null} />
                  {c.badge && <span className="badge badge-gold">{c.badge}</span>}
                </div>
                <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>{c.title}</h3>
                  <Link href={`/courses/${c.id}`} className="btn btn-ghost btn-block" style={{ marginTop: 'auto', textAlign: 'center' }}>
                    講座を見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { getGamificationSummary, getPointValues } from '@/lib/gamification';
import { getCourseJourneys, getMemberRewards } from '@/lib/journeyState';
import { describeRequirement } from '@/lib/journey';
import { POINT_EVENT_LABELS } from '@/lib/points';
import LevelCard from '@/components/gamification/LevelCard';
import RewardsClientUI from './RewardsClientUI';

export default async function RewardsPage() {
  const me = await requireUser();
  const [summary, rewards, journeys, points] = await Promise.all([
    getGamificationSummary(me.id),
    getMemberRewards(me.id),
    getCourseJourneys(me.id),
    getPointValues(),
  ]);

  // Courses still waiting on the journey, hidden ones excluded — they are
  // meant to be a surprise.
  const waiting = [...journeys.entries()]
    .filter(([, j]) => j.published && !j.unlocked && !j.hidden)
    .map(([id, j]) => ({ id, title: j.title, requirements: j.requirements.filter((r) => !r.met).map(describeRequirement) }));

  const loggedInToday = summary.loginBonusToday;
  const hasHidden = [...journeys.values()].some((j) => j.published && j.hidden);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 className="section-title">特典・ポイント</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginTop: -6 }}>
          ポイントは使っても減りません。学ぶほど累計が増え、特典や限定講座が次々と開放されます。
        </p>
      </div>

      <LevelCard summary={summary} />

      <div className="panel">
        <h2 className="panel-title">ポイントの貯め方</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {/* An award the admin turned off (0pt) is not advertised. */}
          {points.DAILY_LOGIN > 0 && (
            <EarnRow label="毎日のログイン" points={points.DAILY_LOGIN} note={loggedInToday ? '今日は獲得済み ✓' : '今日のぶんを獲得できます'} />
          )}
          {points.LESSON_COMPLETE > 0 && <EarnRow label="レッスン完了" points={points.LESSON_COMPLETE} />}
          {points.COURSE_COMPLETE > 0 && <EarnRow label="講座読了ボーナス" points={points.COURSE_COMPLETE} />}
          {points.STREAK_MILESTONE > 0 && <EarnRow label="連続学習の節目" points={points.STREAK_MILESTONE} note="3・7・14・30日…" />}
        </ul>
      </div>

      <RewardsClientUI rewards={rewards} />

      {waiting.length > 0 && (
        <div>
          <h2 className="section-title">開放待ちの講座<span>（{waiting.length}）</span></h2>
          <div className="panel" style={{ padding: 0 }}>
            {waiting.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < waiting.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.requirements.join(' ／ ')}</div>
                </div>
              </div>
            ))}
          </div>
          {hasHidden && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              ほかにも、条件を満たすと現れる隠し講座があります。<Link href="/courses" style={{ color: 'var(--gold-2)' }}>講座一覧へ</Link>
            </p>
          )}
        </div>
      )}

      {summary.recentEvents.length > 0 && (
        <div>
          <h2 className="section-title">最近のポイント履歴</h2>
          <div className="panel" style={{ padding: 0 }}>
            {summary.recentEvents.map((e, i) => (
              <div key={`${e.createdAt}-${i}`} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: 13, borderBottom: i < summary.recentEvents.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ flex: 1, color: 'var(--text-2)' }}>{POINT_EVENT_LABELS[e.type] ?? e.type}</span>
                <span style={{ color: 'var(--muted)', fontSize: 12, marginRight: 16 }}>
                  {new Date(e.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <b style={{ color: 'var(--gold-2)', minWidth: 60, textAlign: 'right' }}>+{e.points}pt</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EarnRow({ label, points, note }: { label: string; points: number; note?: string }) {
  return (
    <li style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-2)' }}>+{points}pt</div>
      {note && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{note}</div>}
    </li>
  );
}

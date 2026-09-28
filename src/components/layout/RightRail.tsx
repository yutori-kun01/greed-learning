import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import type { CourseProgressOverview } from '@/lib/courseProgress';
import CoverArt from '@/components/CoverArt';

type RailProps = { overview: CourseProgressOverview };

export default function RightRail({ overview }: RailProps) {
  const { overallPercent, courses, completed, inProgress, notStarted } = overview;
  const nextUp = inProgress[0] ?? notStarted[0] ?? null;

  return (
    <aside className="rail">
      <section className="panel">
        <h3 className="panel-title">学習の進捗サマリー</h3>
        <div className="summary">
          <div className="donut" style={{ '--value': overallPercent } as React.CSSProperties}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className="donut-track" cx="50" cy="50" r="42"></circle>
              <circle className="donut-value" cx="50" cy="50" r="42"></circle>
            </svg>
          </div>
          <div className="summary-text">
            <p className="summary-label">総合進捗</p>
            <p className="summary-value">{overallPercent}<span>%</span></p>
          </div>
        </div>
        <ul className="stats">
          <li><Icon name="check" /><span>完了講座</span><b>{completed.length}<em> / {courses.length}</em></b></li>
          <li><Icon name="play" /><span>学習中</span><b>{inProgress.length}</b></li>
          <li><Icon name="clock" /><span>未着手</span><b>{notStarted.length}</b></li>
        </ul>
        <Link href="/dashboard" className="btn btn-ghost btn-block">
          <Icon name="edit" />学習プランを確認
        </Link>
      </section>

      <section className="panel">
        <h3 className="panel-title">学習中の講座</h3>
        {inProgress.length === 0 && <p className="panel-note">学習中の講座はまだありません。</p>}
        <ul className="mini-list" id="inprogress">
          {inProgress.slice(0, 3).map(c => (
            <li key={c.id}>
              <Link href={`/courses/${c.id}`} className="mini">
                <span className="mini-thumb"><CoverArt src={c.thumbnailUrl} title={c.title} size="mini" /></span>
                <div>
                  <p className="mini-title">{c.title}</p>
                  <span className="progress">
                    <span className="bar"><span style={{ width: `${c.percent}%` }} /></span>
                    <b>{c.percent}%</b>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/learning" className="btn btn-ghost btn-block">
          <Icon name="arrow" />すべての学習中講座を見る
        </Link>
      </section>

      {nextUp && (
        <section className="panel">
          <h3 className="panel-title">おすすめの次のステップ</h3>
          <p className="panel-note">次に取り組むのにおすすめの講座です。</p>
          <Link href={`/courses/${nextUp.id}`} className="next-card" id="next" style={{ textDecoration: 'none' }}>
            <span className="next-thumb"><CoverArt src={nextUp.thumbnailUrl} title={nextUp.title} size="mini" /></span>
            <div>
              <p className="next-title">{nextUp.title}</p>
              {nextUp.description && <p className="next-desc">{nextUp.description}</p>}
            </div>
          </Link>
          <Link href={`/courses/${nextUp.id}`} className="btn btn-gold btn-block">
            <Icon name="play" />{nextUp.done > 0 ? '続きから学習する' : 'この講座を始める'}
          </Link>
        </section>
      )}
    </aside>
  );
}

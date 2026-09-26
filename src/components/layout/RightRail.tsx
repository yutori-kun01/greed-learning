import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import type { MemberProgress } from '@/lib/progress';

/**
 * Shows the member's own progress. Everything here used to be hardcoded sample
 * data, including course links that pointed at courses that do not exist.
 */
export default function RightRail({ progress }: { progress: MemberProgress }) {
  const { overallPercent, inProgress, nextCourse } = progress;
  const topInProgress = inProgress.slice(0, 3);

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
          <li>
            <Icon name="check" /><span>完了講座</span>
            <b>{progress.completedCourseCount}<em> / {progress.totalCourseCount}</em></b>
          </li>
          <li><Icon name="play" /><span>学習中</span><b>{progress.inProgressCourseCount}</b></li>
          <li><Icon name="clock" /><span>未着手</span><b>{progress.notStartedCourseCount}</b></li>
        </ul>
        <Link href="/dashboard" className="btn btn-ghost btn-block">
          <Icon name="edit" />学習プランを確認
        </Link>
      </section>

      <section className="panel">
        <h3 className="panel-title">学習中の講座</h3>
        {topInProgress.length === 0 ? (
          <p className="panel-note">まだ学習中の講座はありません。</p>
        ) : (
          <ul className="mini-list" id="inprogress">
            {topInProgress.map(course => (
              <li key={course.id}>
                <Link href={`/courses/${course.id}`} className="mini">
                  <span className="mini-thumb" style={{ background: 'var(--panel-3)', display: 'block', overflow: 'hidden' }}>
                    {course.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </span>
                  <div>
                    <p className="mini-title">{course.title}</p>
                    <span className="progress">
                      <span className="bar"><span style={{ width: `${course.percent}%` }} /></span>
                      <b>{course.percent}%</b>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/learning" className="btn btn-ghost btn-block">
          <Icon name="arrow" />すべての学習中講座を見る
        </Link>
      </section>

      {nextCourse && (
        <section className="panel">
          <h3 className="panel-title">おすすめの次のステップ</h3>
          <p className="panel-note">次に取り組むのにおすすめの講座です。</p>
          <Link href={`/courses/${nextCourse.id}`} className="next-card" id="next" style={{ textDecoration: 'none' }}>
            <span className="next-thumb" style={{ background: 'var(--panel-3)', display: 'block', overflow: 'hidden' }}>
              {nextCourse.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nextCourse.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </span>
            <div>
              <p className="next-title">{nextCourse.title}</p>
              <p className="next-desc">
                {nextCourse.description || `全${nextCourse.totalLessons}レッスン・${nextCourse.completedLessons}件完了`}
              </p>
            </div>
          </Link>
          <Link href={`/courses/${nextCourse.id}`} className="btn btn-gold btn-block">
            <Icon name="play" />{nextCourse.status === 'not_started' ? 'この講座を始める' : '学習を再開する'}
          </Link>
        </section>
      )}
    </aside>
  );
}

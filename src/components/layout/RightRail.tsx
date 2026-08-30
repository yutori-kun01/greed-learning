import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';

const IN_PROGRESS = [
  { id: 'strategy-01', title: '01. リード獲得の全体設計', progress: 68 },
  { id: 'content-04', title: '04. コンテンツ量産の仕組み化', progress: 35 },
  { id: 'traffic-07', title: '07. 広告運用の基礎', progress: 12 },
];

const NEXT_UP = {
  id: 'automation-05',
  title: '05. ステップメールの自動化',
  desc: '集客からナーチャリングまでを自動化する回。所要時間 約22分。',
};

export default function RightRail() {
  return (
    <aside className="rail">
      <section className="panel">
        <h3 className="panel-title">学習の進捗サマリー</h3>
        <div className="summary">
          <div className="donut" style={{ '--value': 52 } as React.CSSProperties}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className="donut-track" cx="50" cy="50" r="42"></circle>
              <circle className="donut-value" cx="50" cy="50" r="42"></circle>
            </svg>
          </div>
          <div className="summary-text">
            <p className="summary-label">総合進捗</p>
            <p className="summary-value">52<span>%</span></p>
          </div>
        </div>
        <ul className="stats">
          <li><Icon name="check" /><span>完了講座</span><b>3<em> / 12</em></b></li>
          <li><Icon name="play" /><span>学習中</span><b>5</b></li>
          <li><Icon name="clock" /><span>未着手</span><b>4</b></li>
        </ul>
        <Link href="/dashboard" className="btn btn-ghost btn-block">
          <Icon name="edit" />学習プランを確認
        </Link>
      </section>

      <section className="panel">
        <h3 className="panel-title">学習中の講座</h3>
        <ul className="mini-list" id="inprogress">
          {IN_PROGRESS.map(c => (
            <li key={c.id}>
              <Link href={`/courses/${c.id}`} className="mini">
                <span className="mini-thumb" style={{ background: 'var(--panel-3)', display: 'block' }} />
                <div>
                  <p className="mini-title">{c.title}</p>
                  <span className="progress">
                    <span className="bar"><span style={{ width: `${c.progress}%` }} /></span>
                    <b>{c.progress}%</b>
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

      <section className="panel">
        <h3 className="panel-title">おすすめの次のステップ</h3>
        <p className="panel-note">次に取り組むのにおすすめの講座です。</p>
        <Link href={`/courses/${NEXT_UP.id}`} className="next-card" id="next" style={{ textDecoration: 'none' }}>
          <span className="next-thumb" style={{ background: 'var(--panel-3)', display: 'block' }} />
          <div>
            <p className="next-title">{NEXT_UP.title}</p>
            <p className="next-desc">{NEXT_UP.desc}</p>
          </div>
        </Link>
        <Link href={`/courses/${NEXT_UP.id}`} className="btn btn-gold btn-block">
          <Icon name="play" />この講座を始める
        </Link>
      </section>
    </aside>
  );
}

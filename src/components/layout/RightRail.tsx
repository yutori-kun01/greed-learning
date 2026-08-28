import React from 'react';
import Icon from '../Icon';

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
        <button className="btn btn-ghost btn-block" type="button">
          <Icon name="edit" />学習プランを確認
        </button>
      </section>

      <section className="panel">
        <h3 className="panel-title">学習中の講座</h3>
        <ul className="mini-list" id="inprogress">
          {/* TODO: Add mock data mapping here */}
        </ul>
        <button className="btn btn-ghost btn-block" type="button">
          <Icon name="arrow" />すべての学習中講座を見る
        </button>
      </section>

      <section className="panel">
        <h3 className="panel-title">おすすめの次のステップ</h3>
        <p className="panel-note">次に取り組むのにおすすめの講座です。</p>
        <div className="next-card" id="next">
          {/* TODO: Add next course mock */}
        </div>
        <button className="btn btn-gold btn-block" type="button">
          <Icon name="play" />この講座を始める
        </button>
      </section>
    </aside>
  );
}

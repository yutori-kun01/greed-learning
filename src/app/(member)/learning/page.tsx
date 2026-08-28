import Link from 'next/link';

export default function LearningPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">学習中の講座</h1>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="thumb" style={{ aspectRatio: '2.2/1', background: '#101d31' }}></div>
            <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>実践的API連携講座 {i}</h3>
              <div className="progress">
                <div className="bar"><span style={{ width: `${i * 20 + 10}%` }}></span></div>
              </div>
              <div style={{ fontSize: '12px', color: '#7d8b9f', marginTop: '8px', marginBottom: '16px' }}>
                進捗: {i * 20 + 10}%
              </div>
              <button className="btn btn-gold btn-block" style={{ marginTop: 'auto' }}>詳細を見る</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

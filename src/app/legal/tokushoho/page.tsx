import { getSiteSettingsQuery } from '@/actions/settings';

const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--line)', fontSize: 14, lineHeight: 1.7 };
const labelStyle: React.CSSProperties = { color: 'var(--muted)', fontWeight: 600 };

export default async function TokushohoPage() {
  const settings = await getSiteSettingsQuery();

  const rows: [string, string][] = [
    ['販売事業者', settings?.operatorName || '（未設定）'],
    ['運営責任者', settings?.operatorRepresentative || '（未設定）'],
    ['所在地', settings?.operatorAddress || '（未設定）'],
    ['電話番号', settings?.operatorPhone || '（未設定）'],
    ['メールアドレス', settings?.operatorEmail || '（未設定）'],
    ['販売価格', '各プラン・各商品の詳細ページに表示する価格による（すべて税込表示）'],
    ['商品代金以外の必要料金', 'インターネット接続に伴う通信費用は会員のご負担となります'],
    ['お支払い方法', 'クレジットカード決済（Stripe）'],
    ['お支払い時期', 'サブスクリプションプランは契約時および以降各更新日に自動課金、単品コンテンツは購入時に課金されます'],
    ['サービス提供時期', '決済完了後、直ちにご利用いただけます'],
    ['返品・キャンセルについて', 'デジタルコンテンツの性質上、購入後の返金は原則として承っておりません。サブスクリプションは次回更新日の前までにお手続きいただくことでいつでも解約可能です'],
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>特定商取引法に基づく表記</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>特定商取引法第11条に基づき、以下の通り表示いたします。</p>

      <div>
        {rows.map(([label, value]) => (
          <div key={label} style={rowStyle}>
            <div style={labelStyle}>{label}</div>
            <div>{value}</div>
          </div>
        ))}
      </div>

      {settings?.tokushohoExtra && (
        <div style={{ marginTop: 24, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: 'var(--text-2)' }}>
          {settings.tokushohoExtra}
        </div>
      )}
    </div>
  );
}

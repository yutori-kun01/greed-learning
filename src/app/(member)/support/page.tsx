'use client';

import { useState } from 'react';

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: 'パスワードを忘れてしまいました', a: 'ログイン画面の「パスワード再設定」から手続きを行ってください。' },
    { q: '退会方法を教えてください', a: 'アカウント設定ページの一番下にある「退会する」ボタンからお手続きいただけます。' },
    { q: 'コースの視聴期限はありますか？', a: '会員である限り、すべてのコースを無期限でご視聴いただけます。' },
    { q: '領収書の発行は可能ですか？', a: 'マイページの「請求履歴」よりPDF形式でダウンロード可能です。' },
    { q: '動画が再生されません', a: 'ブラウザのキャッシュをクリアするか、別のブラウザでお試しください。' }
  ];

  const inputStyle = {
    display: 'block',
    width: '100%',
    background: '#101d31',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#e9eef7',
    fontSize: '13px',
    outline: 'none',
    marginTop: '6px',
    boxSizing: 'border-box' as const
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="section-title">よくある質問</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => (
            <div key={i} className="panel" style={{ padding: '16px' }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span style={{ fontWeight: 'bold', color: '#e9eef7' }}>{faq.q}</span>
                <span style={{ color: '#7d8b9f', fontSize: '12px' }}>{openIndex === i ? '▲' : '▼'}</span>
              </div>
              {openIndex === i && (
                <div style={{ color: '#7d8b9f', fontSize: '14px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="section-title" style={{ marginBottom: '16px' }}>お問い合わせ</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={(e) => e.preventDefault()}>
          <div>
            <label style={{ fontSize: '13px', color: '#b6c1d2' }}>お名前</label>
            <input type="text" style={inputStyle} placeholder="山田 太郎" />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#b6c1d2' }}>メールアドレス</label>
            <input type="email" style={inputStyle} placeholder="example@domain.com" />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#b6c1d2' }}>お問い合わせ内容</label>
            <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} placeholder="こちらにご記入ください..."></textarea>
          </div>
          <button type="submit" className="btn btn-gold" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            送信する
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { sendSupportMessage } from '@/actions/support';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState('');
  const [status, setStatus] = useState<SendStatus>('idle');

  const faqs = [
    { q: 'パスワードを忘れてしまいました', a: 'ログイン画面の「パスワード再設定」から手続きを行ってください。' },
    { q: '退会方法を教えてください', a: '下のフォームからご連絡ください。有料プランの解約は「設定 → プラン」の「お支払い情報を管理」からいつでも行えます。' },
    { q: 'コースの視聴期限はありますか？', a: '会員である限り、すべてのコースを無期限でご視聴いただけます。' },
    { q: '領収書の発行は可能ですか？', a: '「設定 → プラン」の「お支払い情報を管理」から、Stripeの請求履歴と領収書をダウンロードできます。' },
    { q: '動画が再生されません', a: 'ブラウザのキャッシュをクリアするか、別のブラウザでお試しください。' }
  ];

  const inputStyle = {
    display: 'block',
    width: '100%',
    background: 'var(--panel-2)',
    border: '1px solid var(--line)',
    borderRadius: '6px',
    padding: '10px 14px',
    color: 'var(--text)',
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
                <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{faq.q}</span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{openIndex === i ? '▲' : '▼'}</span>
              </div>
              {openIndex === i && (
                <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="section-title" style={{ marginBottom: '16px' }}>お問い合わせ</h2>
        {status === 'sent' ? (
          <div style={{ color: '#8ce0a8', fontSize: '14px', padding: '8px 0' }}>
            送信しました。担当者よりご登録のメールアドレス宛にご連絡いたします。
          </div>
        ) : (
          <form
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!message.trim()) {
                setSendError('お問い合わせ内容を入力してください');
                return;
              }
              setSendError('');
              setStatus('sending');
              try {
                const result = await sendSupportMessage(message);
                if (result.ok) {
                  setStatus('sent');
                } else {
                  setSendError(result.error);
                  setStatus('error');
                }
              } catch {
                setSendError('送信に失敗しました。時間をおいて再度お試しください');
                setStatus('error');
              }
            }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
              ご登録のお名前・メールアドレスで送信され、返信もそのアドレス宛に届きます。
            </p>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-2)' }}>お問い合わせ内容</label>
              <textarea
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                placeholder="こちらにご記入ください..."
                value={message}
                maxLength={5000}
                onChange={(e) => setMessage(e.target.value)}
              />
              {sendError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{sendError}</p>}
            </div>
            <button type="submit" className="btn btn-gold" style={{ alignSelf: 'flex-start', marginTop: '8px' }} disabled={status === 'sending'}>
              {status === 'sending' ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

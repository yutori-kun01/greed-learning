'use client';

import { useState } from 'react';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<SendStatus>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
            onSubmit={(e) => {
              e.preventDefault();
              const nextErrors: Record<string, string> = {};
              if (!form.name.trim()) nextErrors.name = 'お名前を入力してください';
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'メールアドレスの形式が正しくありません';
              if (!form.message.trim()) nextErrors.message = 'お問い合わせ内容を入力してください';
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) return;

              setStatus('sending');
              setTimeout(() => {
                setStatus('sent');
              }, 900);
            }}
          >
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-2)' }}>お名前</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="山田 太郎"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.name}</p>}
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-2)' }}>メールアドレス</label>
              <input
                type="email"
                style={inputStyle}
                placeholder="example@domain.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-2)' }}>お問い合わせ内容</label>
              <textarea
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                placeholder="こちらにご記入ください..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              {errors.message && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.message}</p>}
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

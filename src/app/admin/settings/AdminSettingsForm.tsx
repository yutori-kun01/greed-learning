'use client';
import React, { useState, useTransition } from 'react';
import { updateSiteSettings } from '@/actions/settings';
import { DEFAULT_TERMS_CONTENT, DEFAULT_PRIVACY_CONTENT } from '@/lib/legalDefaults';
import { ACCENT_COLORS, BG_PATTERNS, DEFAULT_SITE_NAME, sanitizeAccentColor, sanitizeBgPattern } from '@/lib/siteSettings.shared';
import ImagePicker from '@/components/ImagePicker';

const inputStyle = { display: 'block', width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px 14px', color: 'var(--text)', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' as const };
const labelStyle = { display: 'block', marginBottom: '24px' };
const textareaStyle = { ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.7 };

export default function AdminSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [accent, setAccent] = useState(
    sanitizeAccentColor(initialSettings?.accentColor) || ACCENT_COLORS[0].value
  );
  const [bgPattern, setBgPattern] = useState(sanitizeBgPattern(initialSettings?.bgPattern));
  const [logoUrl, setLogoUrl] = useState<string | null>(initialSettings?.logoUrl || null);
  const [termsContent, setTermsContent] = useState(initialSettings?.termsContent || DEFAULT_TERMS_CONTENT);
  const [privacyContent, setPrivacyContent] = useState(initialSettings?.privacyContent || DEFAULT_PRIVACY_CONTENT);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('accentColor', accent);
    formData.set('logoUrl', logoUrl || '');
    formData.set('bgPattern', bgPattern);
    formData.set('termsContent', termsContent);
    formData.set('privacyContent', privacyContent);

    startTransition(async () => {
      try {
        await updateSiteSettings(formData);
        alert('設定を保存しました');
      } catch (err) {
        alert(err instanceof Error ? err.message : '設定の保存に失敗しました');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
      <h1 className="section-title" style={{ fontSize: 24, marginBottom: 32 }}>サイト設定</h1>

      <div className="panel">
        <h2 className="panel-title">サイトの基本情報</h2>
        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>サイト名 / 講座名</span>
          <input type="text" name="siteName" style={inputStyle} defaultValue={initialSettings?.siteName || DEFAULT_SITE_NAME} required />
        </label>

        <div style={labelStyle}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 12 }}>ロゴ画像 (任意)</span>
          <ImagePicker
            value={logoUrl}
            onChange={setLogoUrl}
            shape="square"
            size={64}
            label="ロゴをアップロード"
            hint="正方形の画像を推奨。未設定の場合は標準アイコンを表示します。"
          />
          <input
            type="text"
            style={inputStyle}
            value={logoUrl || ''}
            onChange={(e) => setLogoUrl(e.target.value || null)}
            placeholder="https://... (画像URLを直接指定することもできます)"
          />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel-title">コミュニティ</h2>
        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>コミュニティ招待URL (任意)</span>
          <input type="url" name="discordUrl" style={inputStyle} defaultValue={initialSettings?.discordUrl || ''} placeholder="https://discord.gg/..." />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>入力するとサイドバーにリンクが表示されます。未設定の場合は表示されません。</p>
        </label>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel-title">デザイン・テーマカスタマイズ</h2>

        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 12 }}>アクセントカラー</span>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setAccent(color.value)}
                style={{
                  width: 40, height: 40, borderRadius: '50%', background: color.value, border: 'none',
                  outline: accent === color.value ? '3px solid var(--text)' : 'none',
                  outlineOffset: 2, cursor: 'pointer'
                }}
                title={color.name}
              />
            ))}
          </div>
        </label>

        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 12 }}>背景パターン</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {BG_PATTERNS.map(pattern => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => setBgPattern(pattern.id)}
                style={{
                  padding: '16px', background: 'var(--panel-2)', borderRadius: '8px', cursor: 'pointer',
                  border: `2px solid ${bgPattern === pattern.id ? accent : 'var(--line)'}`,
                  color: bgPattern === pattern.id ? 'var(--text)' : 'var(--text-2)',
                  textAlign: 'left', fontWeight: bgPattern === pattern.id ? 600 : 400
                }}
              >
                {pattern.label}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel-title">事業者情報（特定商取引法に基づく表記）</h2>
        <p style={{ fontSize: 12, color: 'var(--gold-2)', background: 'var(--gold-dim)', padding: '10px 12px', borderRadius: 6, marginBottom: 20 }}>
          決済（サブスク・単品購入）を提供する場合、特定商取引法に基づく表記が法律上必須です。ここで入力した内容は /legal/tokushoho に自動反映されます。
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>販売事業者名</span>
            <input type="text" name="operatorName" style={inputStyle} defaultValue={initialSettings?.operatorName || ''} placeholder="株式会社〇〇 / 屋号" />
          </label>
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>運営責任者</span>
            <input type="text" name="operatorRepresentative" style={inputStyle} defaultValue={initialSettings?.operatorRepresentative || ''} />
          </label>
        </div>

        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>所在地</span>
          <input type="text" name="operatorAddress" style={inputStyle} defaultValue={initialSettings?.operatorAddress || ''} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>電話番号</span>
            <input type="text" name="operatorPhone" style={inputStyle} defaultValue={initialSettings?.operatorPhone || ''} />
          </label>
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>連絡先メールアドレス</span>
            <input type="email" name="operatorEmail" style={inputStyle} defaultValue={initialSettings?.operatorEmail || ''} />
          </label>
        </div>

        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>その他特記事項 (任意)</span>
          <textarea name="tokushohoExtra" rows={3} style={textareaStyle} defaultValue={initialSettings?.tokushohoExtra || ''} placeholder="上記以外に表示したい事項があれば記入してください" />
        </label>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel-title">利用規約・プライバシーポリシー</h2>
        <p style={{ fontSize: 12, color: 'var(--gold-2)', background: 'var(--gold-dim)', padding: '10px 12px', borderRadius: 6, marginBottom: 20 }}>
          一般的な雛形を初期値として用意しています。事業内容・取扱う情報に応じて必ず内容をご確認・編集の上ご利用ください（法的な最終確認は専門家にご相談ください）。
        </p>

        <label style={labelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>利用規約</span>
            <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setTermsContent(DEFAULT_TERMS_CONTENT)}>デフォルトに戻す</button>
          </div>
          <textarea rows={14} style={textareaStyle} value={termsContent} onChange={e => setTermsContent(e.target.value)} />
        </label>

        <label style={labelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>プライバシーポリシー</span>
            <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setPrivacyContent(DEFAULT_PRIVACY_CONTENT)}>デフォルトに戻す</button>
          </div>
          <textarea rows={14} style={textareaStyle} value={privacyContent} onChange={e => setPrivacyContent(e.target.value)} />
        </label>

        <button type="submit" className="btn btn-gold" style={{ background: accent }} disabled={isPending}>
          {isPending ? '保存中...' : '設定を保存して反映'}
        </button>
      </div>
    </form>
  );
}

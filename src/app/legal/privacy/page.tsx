import { getSiteSettingsQuery } from '@/actions/settings';
import { DEFAULT_PRIVACY_CONTENT } from '@/lib/legalDefaults';

export default async function PrivacyPage() {
  const settings = await getSiteSettingsQuery();
  const content = settings?.privacyContent || DEFAULT_PRIVACY_CONTENT;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>プライバシーポリシー</h1>
      <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.9, color: 'var(--text-2)' }}>
        {content}
      </div>
      {(settings?.operatorEmail) && (
        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-2)' }}>お問い合わせ先：{settings.operatorEmail}</p>
      )}
    </div>
  );
}

import { getSiteSettingsQuery } from '@/actions/settings';
import { DEFAULT_TERMS_CONTENT } from '@/lib/legalDefaults';

export default async function TermsPage() {
  const settings = await getSiteSettingsQuery();
  const content = settings?.termsContent || DEFAULT_TERMS_CONTENT;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>利用規約</h1>
      <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.9, color: 'var(--text-2)' }}>
        {content}
      </div>
    </div>
  );
}

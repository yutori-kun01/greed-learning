import { getDb } from '@/db';
import { resources } from '@/db/schema';

export default async function ResourcesPage() {
  const db = getDb(process.env.DB as unknown as D1Database);
  const items = await db.select().from(resources).orderBy(resources.sortOrder);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">リソース・特典</h1>
      {items.length === 0 ? (
        <p style={{ color: '#7d8b9f' }}>現在利用できるリソースはありません。</p>
      ) : (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {items.map((res) => (
            <div key={res.id} className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {res.imageUrl ? (
                <img src={res.imageUrl} alt={res.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />
              ) : (
                <div style={{ width: '100%', height: 140, background: '#1a2942', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  📄
                </div>
              )}
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>{res.title}</h3>
              <p style={{ color: '#7d8b9f', fontSize: '13px', marginBottom: '24px', flexGrow: 1 }}>{res.description}</p>
              {res.fileUrl ? (
                <a href={res.fileUrl} target="_blank" rel="noreferrer" className="btn btn-gold" style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}>ダウンロード</a>
              ) : (
                <button className="btn btn-outline" style={{ width: '100%' }} disabled>準備中</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

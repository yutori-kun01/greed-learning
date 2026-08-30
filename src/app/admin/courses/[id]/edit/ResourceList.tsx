'use client';

import React from 'react';
import { deleteCourseResource } from '@/actions/resources';
import Icon from '@/components/Icon';

export default function ResourceList({ resources, courseId }: { resources: any[], courseId: string }) {
  if (resources.length === 0) {
    return <div className="panel" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>まだリソースがありません。</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {resources.map((res) => (
        <div key={res.id} className="panel" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
          <div style={{ fontSize: 20, marginRight: 12 }}>{res.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>{res.title}</div>
            {res.description && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{res.description}</div>}
          </div>
          <button
            onClick={async () => {
              if (confirm('本当に削除しますか？')) {
                await deleteCourseResource(res.id, courseId);
              }
            }}
            style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '8px' }}
            title="削除"
          >
            <Icon name="trash" />
          </button>
        </div>
      ))}
    </div>
  );
}

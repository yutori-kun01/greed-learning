'use client';

import React, { useState } from 'react';
import { deleteLesson } from '@/actions/lessons';
import Icon from '@/components/Icon';
import LessonForm, { type EditableLesson } from './LessonForm';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const rest = seconds % 60;
  return ` ・ ${Math.floor(seconds / 60)}分${rest ? `${rest}秒` : ''}`;
}

export default function LessonList({
  lessons,
  courseId,
  nextOrder,
}: {
  lessons: EditableLesson[];
  courseId: string;
  nextOrder: number;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (lessons.length === 0) {
    return <div className="panel" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>まだレッスンがありません。</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lessons.map((lesson) =>
        editingId === lesson.id ? (
          <div key={lesson.id} className="panel" style={{ padding: '16px', border: '1px solid rgba(217, 180, 91, 0.4)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>レッスンを編集</div>
            <LessonForm courseId={courseId} nextOrder={nextOrder} lesson={lesson} onDone={() => setEditingId(null)} />
          </div>
        ) : (
          <div key={lesson.id} className="panel" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>{lesson.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                表示順序: {lesson.sortOrder}{formatDuration(lesson.duration)}{lesson.videoUrl ? ' ・ 動画あり' : ''}
              </div>
            </div>
            <button
              onClick={() => setEditingId(lesson.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '8px', fontSize: 13 }}
              title="編集"
            >
              編集
            </button>
            <button
              onClick={async () => {
                if (confirm('本当に削除しますか？')) {
                  await deleteLesson(lesson.id, courseId);
                }
              }}
              style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '8px' }}
              title="削除"
            >
              <Icon name="trash" />
            </button>
          </div>
        )
      )}
    </div>
  );
}

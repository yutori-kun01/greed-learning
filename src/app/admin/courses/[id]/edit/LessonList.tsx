'use client';

import React from 'react';
import { deleteLesson } from '@/actions/lessons';
import Icon from '@/components/Icon';

export default function LessonList({ lessons, courseId }: { lessons: any[], courseId: string }) {
  if (lessons.length === 0) {
    return <div className="panel" style={{ textAlign: 'center', padding: '24px', color: '#7d8b9f' }}>まだレッスンがありません。</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lessons.map((lesson) => (
        <div key={lesson.id} className="panel" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: '#e9eef7' }}>{lesson.title}</div>
            <div style={{ fontSize: '12px', color: '#7d8b9f' }}>順序: {lesson.sortOrder}</div>
          </div>
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
      ))}
    </div>
  );
}

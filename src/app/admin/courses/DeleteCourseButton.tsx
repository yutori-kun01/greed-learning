'use client';
import { useTransition } from 'react';
import { deleteCourse } from '@/actions/courses';

export default function DeleteCourseButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('本当に削除しますか？')) {
      startTransition(async () => {
        try {
          await deleteCourse(id);
        } catch (err) {
          alert('エラーが発生しました: ' + (err as Error).message);
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '12px' }}
    >
      {isPending ? '削除中...' : '削除'}
    </button>
  );
}

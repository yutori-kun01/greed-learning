import Link from 'next/link'
import React from 'react'
import { getCategories, getCourseTagMap, getCoursesForAdmin, getTags } from '@/lib/queries'
import { getDb } from '@/db'
import { coursePrerequisites } from '@/db/schema'
import DeleteCourseButton from './DeleteCourseButton'

export default async function AdminCoursesPage() {
  const badgePublished = { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }
  const badgeDraft = { background: 'var(--line-2)', color: 'var(--muted)', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }

  const courses = await getCoursesForAdmin()
  const categoryName = new Map((await getCategories()).map((c: { id: string; name: string }) => [c.id, c.name]))
  const tagName = new Map<string, string>((await getTags()).map((t: { id: string; name: string }) => [t.id, t.name]))
  const tagMap = await getCourseTagMap()
  const prereqRows = await getDb(process.env.DB as unknown as D1Database)
    .select({ courseId: coursePrerequisites.courseId })
    .from(coursePrerequisites)
  const hasPrereq = new Set(prereqRows.map((r: { courseId: string }) => r.courseId))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>講座管理</h1>
        <Link href="/admin/courses/new" className="btn btn-gold">新規作成</Link>
      </div>

      <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>No.</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>タイトル</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>カテゴリ</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>レッスン数</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>ステータス</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>講座がありません</td>
              </tr>
            ) : courses.map((course: any) => (
              <tr key={course.id}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{course.number}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  {course.title}
                  {(() => {
                    const names = (tagMap.get(course.id) ?? []).map((id) => tagName.get(id)).filter((n): n is string => Boolean(n))
                    const gated = hasPrereq.has(course.id) || course.unlockCompletedCourses || course.unlockPoints
                    if (names.length === 0 && !gated) return null
                    return (
                      <div className="tags" style={{ marginTop: 6, fontWeight: 400 }}>
                        {gated && <span className="tag" style={{ color: 'var(--gold-2)' }}>{course.isHidden ? '👻 隠し講座' : '🔒 解放条件あり'}</span>}
                        {names.map((n) => <span key={n} className="tag">#{n}</span>)}
                      </div>
                    )
                  })()}
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{(course.categoryId && categoryName.get(course.categoryId)) || '未分類'}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{course.lessonCount || 0}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
                  <span style={course.status === 'PUBLISHED' ? badgePublished : badgeDraft}>
                    {course.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/courses/${course.id}/edit`} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }}>編集</Link>
                    <DeleteCourseButton id={course.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

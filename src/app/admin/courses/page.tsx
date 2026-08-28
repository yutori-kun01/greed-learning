import Link from 'next/link'
import React from 'react'
import { getCourses } from '@/actions/courses'
import DeleteCourseButton from './DeleteCourseButton'

export default async function AdminCoursesPage() {
  const badgePublished = { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }
  const badgeDraft = { background: 'rgba(255,255,255,.08)', color: '#7d8b9f', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }

  const courses = await getCourses()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>講座管理</h1>
        <Link href="/admin/courses/new" className="btn btn-gold">新規作成</Link>
      </div>

      <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>No.</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>タイトル</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>カテゴリ</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>レッスン数</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>ステータス</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#7d8b9f', fontSize: '13px' }}>講座がありません</td>
              </tr>
            ) : courses.map((course) => (
              <tr key={course.id}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{course.number}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px', fontWeight: 600, color: '#e9eef7' }}>{course.title}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{course.categoryId}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{course.lessonCount || 0}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <span style={course.status === 'PUBLISHED' ? badgePublished : badgeDraft}>
                    {course.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
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

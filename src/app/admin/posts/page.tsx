import Link from 'next/link'
import React from 'react'
import { getPosts } from '@/actions/posts'
import DeletePostButton from './DeletePostButton'

export default async function AdminPostsPage() {
  const badges = {
    PUBLISHED: { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
    DRAFT: { background: 'rgba(255,255,255,.08)', color: '#7d8b9f', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
    MEMBERS_ONLY: { background: 'rgba(100,149,237,.15)', color: '#6495ed', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
    PAID: { background: 'rgba(217,180,91,.15)', color: '#f2d992', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }
  }

  const posts = await getPosts()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>記事管理</h1>
        <Link href="/admin/posts/new" className="btn btn-gold">新規作成</Link>
      </div>

      <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>タイトル</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>ステータス</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>公開日</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#7d8b9f', fontSize: '13px' }}>記事がありません</td>
              </tr>
            ) : posts.map((post: any) => (
              <tr key={post.id}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px', fontWeight: 600, color: '#e9eef7' }}>{post.title}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <span style={badges[post.status as keyof typeof badges]}>
                    {post.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ja-JP') : '-'}
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/posts/${post.id}/edit`} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }}>編集</Link>
                    <DeletePostButton id={post.id} />
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

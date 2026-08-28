'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export default function AdminSidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/admin', label: 'ダッシュボード' },
    { href: '/admin/courses', label: '講座管理' },
    { href: '/admin/posts', label: '記事管理' },
    { href: '/admin/users', label: 'ユーザー管理' },
  ]

  return (
    <div style={{ width: 220, flexShrink: 0, background: '#0c1526', borderRight: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ color: '#f2d992', fontWeight: 'bold', fontSize: '18px' }}>
          N8N MARKETING
          <span style={{ fontSize: '12px', marginLeft: '8px', color: '#7d8b9f', fontWeight: 'normal' }}>管理</span>
        </div>
      </div>
      <nav style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
          return (
            <Link 
              key={link.href} 
              href={link.href}
              style={{ 
                display: 'block', 
                padding: '10px 16px', 
                color: isActive ? '#f2d992' : '#b6c1d2', 
                background: isActive ? 'rgba(217,180,91,.1)' : 'transparent', 
                borderRadius: '8px', 
                margin: '2px 8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400
              }}
            >
              {link.label}
            </Link>
          )
        })}
        
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}></div>
        <Link 
          href="/admin/settings"
          style={{ 
            display: 'block', padding: '10px 16px', color: pathname.startsWith('/admin/settings') ? '#f2d992' : '#b6c1d2', 
            background: pathname.startsWith('/admin/settings') ? 'rgba(217,180,91,.1)' : 'transparent', 
            borderRadius: '8px', margin: '2px 8px', textDecoration: 'none', fontSize: '14px',
            borderTop: '1px solid rgba(255,255,255,.07)'
          }}
        >
          ⚙️ サイト・アカウント設定
        </Link>
        <Link 
          href="/dashboard"
          style={{ 
            display: 'block', padding: '10px 16px', color: '#6495ed', background: 'rgba(100,149,237,.1)', 
            borderRadius: '8px', margin: '8px 8px', textDecoration: 'none', fontSize: '14px'
          }}
        >
          👀 受講生ビューを確認
        </Link>
      </nav>
    </div>
  )
}

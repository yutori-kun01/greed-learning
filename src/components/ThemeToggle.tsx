'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: 'none' }} />;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title="テーマ切替"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--line)',
        color: 'var(--text-2)',
        cursor: 'pointer',
        fontSize: 16,
      }}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}

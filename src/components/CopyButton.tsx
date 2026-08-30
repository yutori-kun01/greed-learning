'use client';
import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to fall back to.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        flexShrink: 0,
        background: copied ? 'rgba(111,208,160,.15)' : 'var(--line-2)',
        color: copied ? '#6fd0a0' : 'var(--text-2)',
        border: 'none',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11,
        cursor: 'pointer',
      }}
    >
      {copied ? 'コピーしました' : 'コピー'}
    </button>
  );
}

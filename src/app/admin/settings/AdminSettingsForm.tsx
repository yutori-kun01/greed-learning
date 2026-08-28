'use client';
import React, { useState, useTransition } from 'react';
import { updateSiteSettings } from '@/actions/settings';

const inputStyle = { display: 'block', width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,.07)', borderRadius: '6px', padding: '10px 14px', color: '#e9eef7', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' as const };
const labelStyle = { display: 'block', marginBottom: '24px' };

const ACCENT_COLORS = [
  { name: 'Gold', value: '#d9b45b' },
  { name: 'Blue', value: '#6495ed' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Purple', value: '#c084fc' },
  { name: 'Red', value: '#f87171' },
  { name: 'Orange', value: '#fb923c' },
];

const BG_PATTERNS = [
  { id: 'pattern1', label: '標準 (Standard)' },
  { id: 'pattern2', label: 'ダークノイズ (Noise)' },
  { id: 'pattern3', label: 'グラデーション (Gradient)' },
  { id: 'pattern4', label: '幾何学模様 (Geometric)' },
  { id: 'pattern5', label: 'ウェーブ (Wave)' },
  { id: 'pattern6', label: 'メッシュ (Mesh)' },
];

export default function AdminSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [accent, setAccent] = useState(initialSettings?.accentColor || '#d9b45b');
  const [bgPattern, setBgPattern] = useState(initialSettings?.bgPattern || 'pattern1');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('accentColor', accent);
    formData.set('bgPattern', bgPattern);

    startTransition(async () => {
      await updateSiteSettings(formData);
      alert('設定を保存しました');
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
      <h1 className="section-title" style={{ fontSize: 24, marginBottom: 32 }}>サイト設定</h1>

      <div className="panel">
        <h2 className="panel-title">サイトの基本情報</h2>
        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>サイト名 / 講座名</span>
          <input type="text" name="siteName" style={inputStyle} defaultValue={initialSettings?.siteName || "N8N MARKETING"} required />
        </label>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '12px', background: '#16233a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🖼️
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600, display: 'block', marginBottom: 8 }}>ロゴアイコン</span>
            <button className="btn btn-ghost" style={{ marginBottom: 8 }} type="button">ロゴをアップロード</button>
            <p style={{ fontSize: 12, color: '#7d8b9f' }}>推奨サイズ: 正方形 200x200px (透過PNG)</p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel-title">デザイン・テーマカスタマイズ</h2>
        
        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600, display: 'block', marginBottom: 12 }}>アクセントカラー</span>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setAccent(color.value)}
                style={{
                  width: 40, height: 40, borderRadius: '50%', background: color.value, border: 'none',
                  outline: accent === color.value ? '3px solid #e9eef7' : 'none',
                  outlineOffset: 2, cursor: 'pointer'
                }}
                title={color.name}
              />
            ))}
          </div>
        </label>

        <label style={labelStyle}>
          <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600, display: 'block', marginBottom: 12 }}>背景パターン</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {BG_PATTERNS.map(pattern => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => setBgPattern(pattern.id)}
                style={{
                  padding: '16px', background: '#101d31', borderRadius: '8px', cursor: 'pointer',
                  border: `2px solid ${bgPattern === pattern.id ? accent : 'rgba(255,255,255,.07)'}`,
                  color: bgPattern === pattern.id ? '#e9eef7' : '#b6c1d2',
                  textAlign: 'left', fontWeight: bgPattern === pattern.id ? 600 : 400
                }}
              >
                {pattern.label}
              </button>
            ))}
          </div>
        </label>

        <button type="submit" className="btn btn-gold" style={{ background: accent }} disabled={isPending}>
          {isPending ? '保存中...' : '設定を保存して反映'}
        </button>
      </div>
    </form>
  );
}

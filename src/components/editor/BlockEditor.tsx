'use client';
import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Youtube } from '@tiptap/extension-youtube';
import { createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import { PaywallLine } from './PaywallLine';
import { useImageUpload } from '@/hooks/useImageUpload';

const lowlight = createLowlight();
lowlight.register({ js, ts, css, bash });

// ============================================================
// Toolbar Button
// ============================================================
function ToolbarBtn({
  onClick, active, title, disabled, children,
}: {
  onClick: () => void; active?: boolean; title: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 6, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: active ? 'rgba(217,180,91,0.2)' : 'transparent',
        color: active ? 'var(--gold-2)' : 'var(--text-2)',
        fontSize: 13, fontWeight: 600, transition: 'background 0.15s, color 0.15s',
        opacity: disabled ? 0.35 : 1,
      }}
      onMouseEnter={e => { if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--line-2)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(217,180,91,0.2)' : 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: 'var(--line-2)', margin: '0 4px' }} />;
}

// ============================================================
// Table of Contents Panel
// ============================================================
function TableOfContents({ content }: { content: string }) {
  const headings: { level: number; text: string }[] = [];
  const regex = /<h([1-3])[^>]*>(.*?)<\/h[1-3]>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '');
    headings.push({ level: parseInt(match[1]), text });
  }

  if (headings.length === 0) return null;

  return (
    <div style={{
      background: 'var(--panel-2)', border: '1px solid var(--line)',
      borderRadius: 10, padding: '14px 16px', marginBottom: 16,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.05em' }}>
        📋 目次
      </div>
      {headings.map((h, i) => (
        <div key={i} style={{
          paddingLeft: (h.level - 1) * 12,
          fontSize: 12, color: 'var(--text-2)', lineHeight: 1.8,
          borderLeft: h.level === 1 ? '2px solid rgba(217,180,91,0.5)' : 'none',
          paddingTop: 1, paddingBottom: 1,
        }}>
          {h.level > 1 && <span style={{ color: 'var(--muted)', marginRight: 4 }}>└</span>}
          {h.text}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Main Block Editor
// ============================================================
interface BlockEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function BlockEditor({ value, onChange }: BlockEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToc, setShowToc] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: '記事を書き始めましょう... "/" でブロックを挿入' }),
      Image.configure({ HTMLAttributes: { style: 'max-width:100%; border-radius:8px; margin:8px 0;' } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({ controls: true, nocookie: true }),
      PaywallLine,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: 'min-height:400px; outline:none; padding:20px; font-size:14px; line-height:1.8; color:var(--text);',
      },
    },
  });

  const { uploadImage, isUploading } = useImageUpload();

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    
    e.target.value = ''; // reset input immediately
    
    // Upload real image to R2
    const publicUrl = await uploadImage(file);
    if (publicUrl) {
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
    } else {
      alert('画像のアップロードに失敗しました。');
    }
  }, [editor, uploadImage]);

  const setLink = useCallback(() => {
    const url = window.prompt('URLを入力してください:', 'https://');
    if (!url || !editor) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const insertYoutube = useCallback(() => {
    const url = window.prompt('YouTube URLを入力してください:');
    if (url && editor) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div style={{ border: '1px solid var(--line-2)', borderRadius: 12, overflow: 'hidden', background: 'var(--panel)' }}>

      {/* ===== TOOLBAR ===== */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, padding: '8px 12px',
        borderBottom: '1px solid var(--line)', background: 'var(--panel-2)',
      }}>

        {/* Heading */}
        <ToolbarBtn title="見出し1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarBtn>
        <ToolbarBtn title="見出し2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarBtn>
        <ToolbarBtn title="見出し3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarBtn>

        <Divider />

        {/* Text style */}
        <ToolbarBtn title="太字 (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>𝐁</ToolbarBtn>
        <ToolbarBtn title="斜体 (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>𝐼</ToolbarBtn>
        <ToolbarBtn title="下線 (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>U̲</ToolbarBtn>
        <ToolbarBtn title="取り消し線" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>S̶</ToolbarBtn>
        <ToolbarBtn title="ハイライト" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: 'rgba(217,180,91,0.3)' }).run()}>🖊</ToolbarBtn>

        <Divider />

        {/* Align */}
        <ToolbarBtn title="左揃え" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>≡</ToolbarBtn>
        <ToolbarBtn title="中央揃え" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡</ToolbarBtn>
        <ToolbarBtn title="右揃え" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>≡</ToolbarBtn>

        <Divider />

        {/* Lists */}
        <ToolbarBtn title="箇条書き" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• —</ToolbarBtn>
        <ToolbarBtn title="番号リスト" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolbarBtn>
        <ToolbarBtn title="引用" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&quot;</ToolbarBtn>

        <Divider />

        {/* Insert blocks */}
        <ToolbarBtn title="コードブロック" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{'</>'}</ToolbarBtn>
        <ToolbarBtn title="リンク" active={editor.isActive('link')} onClick={setLink}>🔗</ToolbarBtn>
        <ToolbarBtn title="区切り線" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</ToolbarBtn>
        <ToolbarBtn title="テーブル挿入" active={editor.isActive('table')} onClick={insertTable}>⊞</ToolbarBtn>

        <Divider />

        {/* Media */}
        <ToolbarBtn title="画像を挿入" active={false} disabled={isUploading} onClick={addImage}>{isUploading ? '⌛' : '🖼'}</ToolbarBtn>
        <ToolbarBtn title="YouTube動画を埋め込む" active={false} onClick={insertYoutube}>▶</ToolbarBtn>

        <Divider />

        {/* Special */}
        <ToolbarBtn title="有料コンテンツ開始ライン" active={false} onClick={() => (editor as any).chain().focus().insertPaywallLine().run()}>
          <span style={{ fontSize: 11, whiteSpace: 'nowrap', padding: '0 2px' }}>💰有料</span>
        </ToolbarBtn>
        <ToolbarBtn title="目次を表示/非表示" active={showToc} onClick={() => setShowToc(v => !v)}>📋</ToolbarBtn>

        {/* Table controls - show only when in table */}
        {editor.isActive('table') && (
          <>
            <Divider />
            <ToolbarBtn title="列を左に追加" active={false} onClick={() => editor.chain().focus().addColumnBefore().run()}>◁+</ToolbarBtn>
            <ToolbarBtn title="列を右に追加" active={false} onClick={() => editor.chain().focus().addColumnAfter().run()}>+▷</ToolbarBtn>
            <ToolbarBtn title="行を上に追加" active={false} onClick={() => editor.chain().focus().addRowBefore().run()}>△+</ToolbarBtn>
            <ToolbarBtn title="行を下に追加" active={false} onClick={() => editor.chain().focus().addRowAfter().run()}>+▽</ToolbarBtn>
            <ToolbarBtn title="セルを結合" active={false} onClick={() => editor.chain().focus().mergeCells().run()}>⊞</ToolbarBtn>
            <ToolbarBtn title="テーブルを削除" active={false} onClick={() => editor.chain().focus().deleteTable().run()}>🗑</ToolbarBtn>
          </>
        )}

        {/* Undo/Redo */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          <ToolbarBtn title="元に戻す (Ctrl+Z)" active={false} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>↩</ToolbarBtn>
          <ToolbarBtn title="やり直す (Ctrl+Y)" active={false} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>↪</ToolbarBtn>
        </div>
      </div>

      {/* Bubble Menu removed to avoid build errors in this tiptap version */}

      {/* ===== TABLE OF CONTENTS ===== */}
      {showToc && (
        <div style={{ padding: '12px 16px 0', background: 'var(--panel)' }}>
          <TableOfContents content={editor.getHTML()} />
        </div>
      )}

      {/* ===== EDITOR BODY ===== */}
      <div style={{ background: 'var(--panel)' }}>
        <EditorContent editor={editor} />
      </div>

      {/* ===== WORD COUNT ===== */}
      <div style={{
        padding: '6px 16px', borderTop: '1px solid var(--line)',
        fontSize: 11, color: 'var(--muted)', background: '#0a1220',
        display: 'flex', justifyContent: 'flex-end',
      }}>
        {editor.getText().length.toLocaleString()} 文字
      </div>

      {/* Hidden file input for image upload */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
    </div>
  );
}

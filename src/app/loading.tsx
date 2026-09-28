export default function Loading() {
  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        fontSize: 13,
      }}
      role="status"
      aria-live="polite"
    >
      読み込み中...
    </div>
  );
}

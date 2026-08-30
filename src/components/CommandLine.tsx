import CopyButton from './CopyButton';

export default function CommandLine({ command, note }: { command: string; note?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 6, padding: '8px 10px' }}>
        <code style={{ flex: 1, fontSize: 12, color: 'var(--gold-2)', overflowX: 'auto', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          {command}
        </code>
        <CopyButton text={command} />
      </div>
      {note && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{note}</p>}
    </div>
  );
}

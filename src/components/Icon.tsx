import React from 'react';

const ICONS: Record<string, string> = {
  home: '<path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 4h5a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H4z"/><path d="M16 4h-5a2 2 0 0 0-2 2v10a2 2 0 0 1 2-2h5z"/>',
  play: '<circle cx="10" cy="10" r="7"/><path d="M8.5 7.2 13 10l-4.5 2.8z"/>',
  bookmark: '<path d="M6 3.5h8v13l-4-3-4 3z"/>',
  gift: '<path d="M3.5 8.5h13V16a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"/><path d="M2.8 5.5h14.4v3H2.8zM10 5.5V17"/>',
  users: '<circle cx="7.5" cy="8" r="2.6"/><path d="M3 16c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4"/><circle cx="14" cy="7.5" r="2"/><path d="M13 12c2 0 3.4 1.3 4 3.4"/>',
  life: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.8"/><path d="m5 5 3 3m4 4 3 3m0-10-3 3m-4 4-3 3"/>',
  search: '<circle cx="9" cy="9" r="5.2"/><path d="m13 13 4 4"/>',
  history: '<path d="M10 5.5V10l3 1.8"/><circle cx="10" cy="10" r="7"/>',
  chevron: '<path d="m5 8 5 5 5-5"/>',
  check: '<path d="m4.5 10.5 3.5 3.5 7.5-8"/>',
  clock: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4.2l2.8 1.6"/>',
  edit: '<path d="m4 16 .8-3.2 8-8 2.4 2.4-8 8z"/><path d="M12.8 4.8 15.2 7.2"/>',
  arrow: '<path d="M4 10h11m-4-4 4 4-4 4"/>',
  lesson: '<rect x="3.5" y="4.5" width="13" height="11" rx="1.6"/><path d="M3.5 8h13M8 8v7.5"/>',
  prev: '<path d="m12 5-5 5 5 5"/>',
  next: '<path d="m8 5 5 5-5 5"/>'
};

export default function Icon({ name, className = '' }: { name: string; className?: string }) {
  const path = ICONS[name];
  if (!path) return null;
  
  return (
    <i className={`icon ${className}`} style={{ display: 'inline-block', width: '1em', height: '1em' }}>
      <svg 
        viewBox="0 0 20 20" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ width: '100%', height: '100%', display: 'block' }}
        dangerouslySetInnerHTML={{ __html: path }}
      />
    </i>
  );
}

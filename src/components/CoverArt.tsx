import React from 'react';
import { coverVariant } from '@/lib/thumbnails';
import { DEFAULT_LOGO_URL } from '@/lib/brand';

/**
 * Card artwork: the given image when there is one, otherwise a cover
 * generated from the title — brand gradient, label, title and logo mark —
 * so courses, lessons and posts always have a thumbnail without anyone
 * having to make one. Fills its parent; the parent sets the aspect ratio.
 */

// Dark-to-bright gradients in clearly different hues, ordered so that any
// two neighbours contrast — a lesson list colours its rows by position, and
// with only a few blue-ish variants consecutive lessons looked identical.
const GRADIENTS = [
  'linear-gradient(135deg, #0b1d3a 0%, #0a3b7a 55%, #1a9bbd 100%)', // blue
  'linear-gradient(135deg, #0c1526 0%, #2a2410 60%, #b08a2e 100%)', // gold
  'linear-gradient(135deg, #061a24 0%, #0c4a5c 55%, #1fa6a0 100%)', // teal
  'linear-gradient(135deg, #1a0b2e 0%, #3d1a6e 55%, #8b5cf6 100%)', // violet
  'linear-gradient(135deg, #0a1f14 0%, #145233 55%, #2fb36b 100%)', // green
  'linear-gradient(135deg, #2a0b14 0%, #6e1a35 55%, #e0526f 100%)', // rose
  'linear-gradient(135deg, #07142b 0%, #123a6b 60%, #2f7fb8 100%)', // steel
  'linear-gradient(135deg, #261205 0%, #6b3410 55%, #ea8a2e 100%)', // orange
  'linear-gradient(135deg, #1e0a26 0%, #5a1a5e 55%, #c84fb8 100%)', // magenta
  'linear-gradient(135deg, #10161f 0%, #2b3a4f 55%, #7d93b0 100%)', // slate
];

export default function CoverArt({
  src,
  title,
  label,
  size = 'card',
  variant,
  number,
}: {
  src?: string | null;
  title: string;
  label?: string | null;
  size?: 'card' | 'mini';
  /** Picks the colour by position (e.g. a lesson's index) instead of by title. */
  variant?: number;
  /** Shown large on a mini cover, so lessons are told apart at a glance. */
  number?: string | number | null;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- R2 /media, YouTube and operator-supplied hosts
      <img src={src} alt="" loading="lazy" className="cover-art-img" />
    );
  }

  const index = variant ?? coverVariant(title, GRADIENTS.length);
  const background = GRADIENTS[((index % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length];

  if (size === 'mini') {
    return (
      <span className="cover-art cover-art-mini" style={{ background }} aria-hidden="true">
        {number != null && number !== '' && <span className="cover-art-number">{number}</span>}
      </span>
    );
  }

  return (
    <span className="cover-art" style={{ background }} aria-hidden="true">
      {label && <span className="cover-art-label">{label}</span>}
      <span className="cover-art-title">{title}</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- bundled asset */}
      <img src={DEFAULT_LOGO_URL} alt="" className="cover-art-mark" />
    </span>
  );
}

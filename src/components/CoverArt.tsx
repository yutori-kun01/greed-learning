import React from 'react';
import { coverVariant } from '@/lib/thumbnails';
import { DEFAULT_LOGO_URL } from '@/lib/brand';

/**
 * Card artwork: the given image when there is one, otherwise a cover
 * generated from the title — brand gradient, label, title and logo mark —
 * so courses, lessons and posts always have a thumbnail without anyone
 * having to make one. Fills its parent; the parent sets the aspect ratio.
 */

// Deep navy into the logo's blues and teal, with one gold variant.
const GRADIENTS = [
  'linear-gradient(135deg, #0b1d3a 0%, #0a3b7a 55%, #1a9bbd 100%)',
  'linear-gradient(135deg, #07142b 0%, #123a6b 60%, #2f7fb8 100%)',
  'linear-gradient(135deg, #061a24 0%, #0c4a5c 55%, #1fa6a0 100%)',
  'linear-gradient(135deg, #0c1526 0%, #2a2410 60%, #b08a2e 100%)',
];

export default function CoverArt({
  src,
  title,
  label,
  size = 'card',
}: {
  src?: string | null;
  title: string;
  label?: string | null;
  size?: 'card' | 'mini';
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- R2 /media, YouTube and operator-supplied hosts
      <img src={src} alt="" loading="lazy" className="cover-art-img" />
    );
  }

  const background = GRADIENTS[coverVariant(title, GRADIENTS.length)];

  if (size === 'mini') {
    return <span className="cover-art cover-art-mini" style={{ background }} aria-hidden="true" />;
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

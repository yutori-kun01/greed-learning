/**
 * Picks the image for a course, lesson or post card.
 *
 * Order: an uploaded/pasted thumbnail, then (for lessons) the YouTube frame
 * of the lesson's video, then nothing — the caller renders a generated cover
 * (CoverArt) instead, so every card has artwork without anyone making it.
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeVideoId(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.slice(1).split('/')[0];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      id = match?.[1] ?? null;
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function youtubeThumbnail(videoUrl: string | null | undefined): string | null {
  const id = youtubeVideoId(videoUrl);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function lessonThumbnail(lesson: { thumbnailUrl?: string | null; videoUrl?: string | null }): string | null {
  return lesson.thumbnailUrl || youtubeThumbnail(lesson.videoUrl);
}

/** A stable small number from a string, to vary generated covers. */
export function coverVariant(seed: string, variants: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % variants;
}

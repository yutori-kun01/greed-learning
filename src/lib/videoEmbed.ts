import { youtubeVideoId } from './thumbnails';

/**
 * Turns the video URL an admin pastes into one that can sit in an <iframe>.
 *
 * Share links (loom.com/share/…, youtube.com/watch?v=…, vimeo.com/…) are
 * pages for people, not players: the providers refuse to be framed on them,
 * so pasting one straight into the iframe showed a broken page. Each
 * supported provider's player URL is built from the id instead.
 *
 * Returns null for anything else — the lesson page then links out to the
 * video rather than framing an unknown site.
 */

const LOOM_ID = /^[A-Za-z0-9]{10,64}$/;
const VIMEO_ID = /^\d{1,12}$/;
const VIMEO_HASH = /^[A-Za-z0-9]{6,32}$/;

export type VideoEmbed = { provider: 'youtube' | 'vimeo' | 'loom'; src: string };

export function videoEmbed(videoUrl: string | null | undefined): VideoEmbed | null {
  if (!videoUrl) return null;
  let url: URL;
  try {
    url = new URL(videoUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.replace(/^www\./, '');

  const youtube = youtubeVideoId(url.href);
  if (youtube) return { provider: 'youtube', src: `https://www.youtube-nocookie.com/embed/${youtube}` };

  if (host === 'loom.com') {
    // /share/<id>, /embed/<id> and /v/<id> all name the same recording.
    const match = url.pathname.match(/^\/(?:share|embed|v)\/([^/?#]+)/);
    const id = match?.[1];
    return id && LOOM_ID.test(id) ? { provider: 'loom', src: `https://www.loom.com/embed/${id}` } : null;
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    // vimeo.com/<id>, vimeo.com/<id>/<hash> (unlisted), player.vimeo.com/video/<id>?h=<hash>
    const parts = url.pathname.split('/').filter(Boolean);
    const [id, hashFromPath] = parts[0] === 'video' ? [parts[1], undefined] : [parts[0], parts[1]];
    if (!id || !VIMEO_ID.test(id)) return null;
    const hash = hashFromPath ?? url.searchParams.get('h');
    const query = hash && VIMEO_HASH.test(hash) ? `?h=${hash}` : '';
    return { provider: 'vimeo', src: `https://player.vimeo.com/video/${id}${query}` };
  }

  return null;
}

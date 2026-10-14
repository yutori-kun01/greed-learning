import { videoEmbed } from './videoEmbed';
import { youtubeVideoId } from './thumbnails';

/**
 * Looks up how long a lesson video is, so admins do not have to type it in.
 *
 * - Loom and Vimeo answer through their public oEmbed endpoints.
 * - YouTube has no keyless API for this, so the watch page is read for its
 *   length. YouTube sometimes serves a consent or bot page to servers; the
 *   admin form then falls back to asking the YouTube player in the browser.
 *
 * Every lookup is best effort: null means "unknown", and the admin can
 * always enter the length by hand.
 */

const TIMEOUT_MS = 5000;

/** Seconds from an oEmbed response, or null. Loom and Vimeo report seconds. */
export function parseOembedDuration(json: unknown): number | null {
  if (!json || typeof json !== 'object') return null;
  const record = json as Record<string, unknown>;
  for (const key of ['duration', 'video_duration']) {
    const value = Number(record[key]);
    if (Number.isFinite(value) && value > 0) return Math.round(value);
  }
  return null;
}

/** Seconds from a YouTube watch page, or null. */
export function parseYoutubeLength(html: string): number | null {
  const fromPlayer = html.match(/"lengthSeconds":"(\d+)"/);
  if (fromPlayer) return Number(fromPlayer[1]) || null;
  // <meta itemprop="duration" content="PT12M5S">
  const iso = html.match(/itemprop="duration"\s+content="PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/);
  if (iso) {
    const seconds = Number(iso[1] ?? 0) * 3600 + Number(iso[2] ?? 0) * 60 + Number(iso[3] ?? 0);
    return seconds > 0 ? seconds : null;
  }
  return null;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: 'application/json' } });
  return res.ok ? res.json() : null;
}

export async function fetchVideoDuration(videoUrl: string | null | undefined): Promise<number | null> {
  const embed = videoEmbed(videoUrl);
  if (!embed) return null;
  try {
    if (embed.provider === 'loom') {
      const id = embed.src.split('/').pop()!;
      const share = `https://www.loom.com/share/${id}`;
      return parseOembedDuration(await getJson(`https://www.loom.com/v1/oembed?url=${encodeURIComponent(share)}`));
    }
    if (embed.provider === 'vimeo') {
      return parseOembedDuration(await getJson(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl!.trim())}`));
    }
    const id = youtubeVideoId(videoUrl);
    if (!id) return null;
    const res = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'Accept-Language': 'en', Cookie: 'CONSENT=YES+1' },
    });
    return res.ok ? parseYoutubeLength(await res.text()) : null;
  } catch (err) {
    console.warn('[video] duration lookup failed', embed.provider, err);
    return null;
  }
}

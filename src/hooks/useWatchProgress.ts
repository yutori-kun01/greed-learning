'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { VideoEmbed } from '@/lib/videoEmbed';
import { loadYoutubeApi, type YTPlayer } from '@/lib/youtubeApi';

/**
 * How many seconds of a lesson video the member has actually watched.
 *
 * - YouTube and Vimeo: read from the player. Only forward playback in small
 *   steps counts, so skipping ahead does not add the skipped part.
 * - Loom has no public player API, so its lessons count the time the lesson
 *   page is open and in the foreground instead.
 *
 * The total is kept per lesson in this browser, so reloading the page or
 * coming back later does not start from zero.
 */

// Larger jumps than this between two readings are seeks, not playback.
const MAX_STEP_SECONDS = 2.5;

function storageKey(lessonId: string) {
  return `lesson-watch:${lessonId}`;
}

function readStored(lessonId: string): number {
  try {
    return Number(localStorage.getItem(storageKey(lessonId))) || 0;
  } catch {
    return 0;
  }
}

function writeStored(lessonId: string, seconds: number) {
  try {
    localStorage.setItem(storageKey(lessonId), String(Math.round(seconds)));
  } catch {
    /* private mode or storage blocked: progress just is not remembered */
  }
}

export function useWatchProgress(
  lessonId: string,
  embed: VideoEmbed | null,
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean
): number {
  const [watched, setWatched] = useState(0);
  const total = useRef(0);

  useEffect(() => {
    total.current = readStored(lessonId);
    setWatched(total.current);
  }, [lessonId]);

  useEffect(() => {
    if (!enabled || !embed) return;
    const add = (seconds: number) => {
      if (!(seconds > 0 && seconds <= MAX_STEP_SECONDS)) return;
      total.current += seconds;
      writeStored(lessonId, total.current);
      setWatched(total.current);
    };

    if (embed.provider === 'loom') {
      const timer = setInterval(() => {
        if (document.visibilityState === 'visible') add(1);
      }, 1000);
      return () => clearInterval(timer);
    }

    if (embed.provider === 'youtube') {
      let player: YTPlayer | null = null;
      let last: number | null = null;
      let timer: ReturnType<typeof setInterval> | undefined;
      let cancelled = false;
      loadYoutubeApi()
        .then((YT) => {
          if (cancelled || !iframeRef.current) return;
          player = new YT.Player(iframeRef.current, {
            events: {
              onReady: () => {
                timer = setInterval(() => {
                  if (!player) return;
                  const now = player.getCurrentTime();
                  if (player.getPlayerState() === YT.PlayerState.PLAYING && last != null) add(now - last);
                  last = now;
                }, 1000);
              },
            },
          });
        })
        .catch(() => { /* API blocked: nothing is counted */ });
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }

    // Vimeo: its player speaks a postMessage protocol, no script needed.
    let last: number | null = null;
    const post = (message: object) =>
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), 'https://player.vimeo.com');
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://player.vimeo.com' || e.source !== iframeRef.current?.contentWindow) return;
      let data: { event?: string; data?: { seconds?: number } };
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (data.event === 'ready') {
        post({ method: 'addEventListener', value: 'timeupdate' });
        post({ method: 'addEventListener', value: 'seeked' });
      } else if (data.event === 'timeupdate' && typeof data.data?.seconds === 'number') {
        if (last != null) add(data.data.seconds - last);
        last = data.data.seconds;
      } else if (data.event === 'seeked') {
        last = typeof data.data?.seconds === 'number' ? data.data.seconds : null;
      }
    };
    window.addEventListener('message', onMessage);
    // In case the player was ready before this listener was attached.
    post({ method: 'addEventListener', value: 'timeupdate' });
    post({ method: 'addEventListener', value: 'seeked' });
    return () => window.removeEventListener('message', onMessage);
  }, [lessonId, embed, iframeRef, enabled]);

  return watched;
}

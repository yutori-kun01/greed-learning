/**
 * Loads the YouTube IFrame Player API once per page (browser only). Used to
 * read a video's length in the admin form and to follow playback on the
 * lesson page.
 */

export type YTPlayer = {
  getDuration(): number;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
};
export type YTGlobal = {
  Player: new (el: HTMLElement | string, opts: object) => YTPlayer;
  PlayerState: { PLAYING: number };
};

let youtubeApi: Promise<YTGlobal> | null = null;

export function loadYoutubeApi(): Promise<YTGlobal> {
  const w = window as unknown as { YT?: YTGlobal; onYouTubeIframeAPIReady?: () => void };
  if (w.YT?.Player) return Promise.resolve(w.YT);
  youtubeApi ??= new Promise((resolve, reject) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(w.YT!);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => {
      youtubeApi = null;
      reject(new Error('YouTube API failed to load'));
    };
    document.head.appendChild(script);
  });
  return youtubeApi;
}

'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * The site key is read from the Worker's runtime env by the auth layout and
 * handed down here, so adding or rotating Turnstile keys needs no rebuild.
 * Null means Turnstile is not configured and the widget is not shown.
 */
const SiteKeyContext = createContext<string | null>(null);

export function TurnstileProvider({ siteKey, children }: { siteKey: string | null; children: React.ReactNode }) {
  return <SiteKeyContext.Provider value={siteKey}>{children}</SiteKeyContext.Provider>;
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * State for one Turnstile widget. `required` is false when Turnstile is not
 * configured, in which case `token` stays null and forms submit without it.
 * Tokens are single-use: call `reset` after every submit attempt.
 */
export function useTurnstile() {
  const siteKey = useContext(SiteKeyContext);
  const [token, setToken] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
  }, [widgetId]);

  return {
    siteKey,
    required: siteKey !== null,
    token,
    reset,
    widget: siteKey ? (
      <TurnstileWidget siteKey={siteKey} onToken={setToken} onReady={setWidgetId} />
    ) : null,
    /** Headers Better Auth's captcha plugin reads the token from. */
    headers: token ? { 'x-captcha-response': token } : undefined,
  };
}

function TurnstileWidget({
  siteKey,
  onToken,
  onReady,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  onReady: (widgetId: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          language: 'ja',
          theme: document.documentElement.classList.contains('light') ? 'light' : 'dark',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        });
        onReady(widgetId);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onToken, onReady]);

  return (
    <div>
      <div ref={container} className="auth-turnstile" />
      {failed && (
        <p className="auth-foot" style={{ marginTop: 8 }}>
          ボット対策の読み込みに失敗しました。ページを再読み込みしてください。
        </p>
      )}
    </div>
  );
}

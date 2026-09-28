import { FilterXSS, escapeAttrValue, safeAttrValue as defaultSafeAttrValue } from 'xss';

/**
 * Server-side sanitization for admin-authored HTML (blog posts, lesson
 * content) before it is stored and later rendered with
 * dangerouslySetInnerHTML.
 *
 * This is an allowlist: anything not named below is dropped. The previous
 * implementation was a handful of regexes, which let through unquoted event
 * handlers (`<img src=x onerror=alert(1)>`), `<svg onload>`, `<iframe>` to any
 * host, and `<style>`. Because an admin's post renders in every member's
 * browser, one compromised author account was enough to take every session on
 * the site.
 *
 * The allowlist is shaped to exactly what the TipTap editor emits.
 */

// Only these hosts may appear in an <iframe src>. The editor's YouTube
// extension is the only intended source of embeds.
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
];

function isAllowedIframeSrc(value: string): boolean {
  try {
    const url = new URL(value, 'https://invalid.local');
    return url.protocol === 'https:' && ALLOWED_IFRAME_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

function isSafeUrl(value: string): boolean {
  // Browsers ignore control characters and whitespace when resolving a
  // scheme, so strip them before the prefix check or "java\tscript:" passes.
  const collapsed = value.toLowerCase().replace(/[\x00-\x20]/g, '');
  if (collapsed.startsWith('javascript:') || collapsed.startsWith('vbscript:')) return false;
  // data: URLs are only ever safe here for inline images.
  if (collapsed.startsWith('data:')) return collapsed.startsWith('data:image/');
  return true;
}

const filter = new FilterXSS({
  whiteList: {
    p: ['style'],
    br: [],
    hr: [],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    h5: ['style'],
    h6: ['style'],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    del: [],
    mark: ['style', 'data-color'],
    span: ['style'],
    sub: [],
    sup: [],
    ul: [],
    ol: ['start'],
    li: [],
    blockquote: [],
    pre: ['class'],
    code: ['class'],
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    table: ['style'],
    thead: [],
    tbody: [],
    tfoot: [],
    tr: [],
    th: ['colspan', 'rowspan', 'colwidth', 'style'],
    td: ['colspan', 'rowspan', 'colwidth', 'style'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title'],
    // The paywall marker. Dropping this would silently publish the whole of
    // every paid post, so it is allowlisted deliberately, not incidentally.
    div: ['data-type'],
  },

  // Presentational CSS the editor writes. Anything else in a style attribute
  // is discarded.
  css: {
    whiteList: {
      'text-align': true,
      color: true,
      'background-color': true,
    },
  },

  // Remove disallowed tags rather than escaping them. Escaping is equally
  // safe, but it turns pasted markup into visible gibberish inside the
  // article instead of quietly dropping it.
  stripIgnoreTag: true,

  // Drop the *contents* of these too, not just the tags — otherwise the body
  // of a <script> block is rendered as visible text.
  stripIgnoreTagBody: [
    'script',
    'style',
    'xml',
    'noscript',
    'object',
    'embed',
    'template',
    'svg',
    'math',
    'form',
  ],

  safeAttrValue(tag, name, value, cssFilter) {
    if (tag === 'iframe' && name === 'src') {
      return isAllowedIframeSrc(value) ? escapeAttrValue(value) : '';
    }
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) {
      return '';
    }
    if (tag === 'div' && name === 'data-type') {
      // The only data-type that carries meaning; anything else is noise.
      return value === 'paywall-line' ? escapeAttrValue(value) : '';
    }
    if (tag === 'a' && name === 'target') {
      return value === '_blank' ? '_blank' : '';
    }
    // Everything else, style filtering included, keeps the library's own
    // handling rather than a reimplementation of its escaping rules.
    return defaultSafeAttrValue(tag, name, value, cssFilter);
  },
});

export function sanitizeHtml(html: string): string {
  if (!html) return html;
  return filter.process(html);
}

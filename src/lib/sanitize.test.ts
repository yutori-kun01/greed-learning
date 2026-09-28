import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

// Vectors the previous regex-based implementation let through. Each one is a
// way to run script in every member's browser via a stored post.
describe('sanitizeHtml — script execution', () => {
  it('removes script tags and their contents', () => {
    const out = sanitizeHtml('<p>before</p><script>alert(1)</script><p>after</p>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('before');
    expect(out).toContain('after');
  });

  it('removes unquoted inline event handlers', () => {
    const out = sanitizeHtml('<img src=x onerror=alert(1)>');
    expect(out.toLowerCase()).not.toContain('onerror');
  });

  it('removes quoted inline event handlers', () => {
    const out = sanitizeHtml('<p onclick="alert(1)">hi</p>');
    expect(out.toLowerCase()).not.toContain('onclick');
    expect(out).toContain('hi');
  });

  it('removes event handlers split across newlines', () => {
    const out = sanitizeHtml('<img src="x"\n  onerror\n  =\n  "alert(1)">');
    expect(out.toLowerCase()).not.toContain('onerror');
  });

  it('removes svg and its event handlers', () => {
    const out = sanitizeHtml('<svg onload="alert(1)"><circle r="10"/></svg>');
    expect(out.toLowerCase()).not.toContain('onload');
    expect(out.toLowerCase()).not.toContain('<svg');
  });

  it('removes style blocks entirely', () => {
    const out = sanitizeHtml('<style>body{display:none}</style><p>visible</p>');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('display:none');
    expect(out).toContain('visible');
  });

  it('removes forms that could phish members', () => {
    const out = sanitizeHtml('<form action="https://evil.test"><input name="password"></form>');
    expect(out.toLowerCase()).not.toContain('<form');
    expect(out.toLowerCase()).not.toContain('<input');
  });
});

describe('sanitizeHtml — URL schemes', () => {
  it('drops javascript: hrefs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out).toContain('click');
  });

  it('drops javascript: hidden behind control characters', () => {
    const out = sanitizeHtml('<a href="java\tscript:alert(1)">click</a>');
    expect(out.toLowerCase()).not.toContain('script:alert');
  });

  it('drops data:text/html sources', () => {
    const out = sanitizeHtml('<img src="data:text/html;base64,PHNjcmlwdD4=">');
    expect(out).not.toContain('data:text/html');
  });

  it('keeps data: image sources', () => {
    const src = 'data:image/png;base64,iVBORw0KGgo=';
    expect(sanitizeHtml(`<img src="${src}">`)).toContain(src);
  });

  it('keeps ordinary https links', () => {
    const out = sanitizeHtml('<a href="https://example.com" target="_blank">x</a>');
    expect(out).toContain('https://example.com');
  });
});

describe('sanitizeHtml — iframes', () => {
  it('keeps YouTube embeds', () => {
    const out = sanitizeHtml('<iframe src="https://www.youtube.com/embed/abc123"></iframe>');
    expect(out).toContain('https://www.youtube.com/embed/abc123');
  });

  it('strips the src of an iframe pointing anywhere else', () => {
    const out = sanitizeHtml('<iframe src="https://evil.test/x"></iframe>');
    expect(out).not.toContain('evil.test');
  });

  it('rejects a host that merely ends in an allowed domain', () => {
    const out = sanitizeHtml('<iframe src="https://notyoutube.com/embed/x"></iframe>');
    expect(out).not.toContain('notyoutube.com');
  });
});

// Everything the editor legitimately produces has to survive, or sanitizing
// silently destroys authors' work.
describe('sanitizeHtml — editor output is preserved', () => {
  it('keeps headings, emphasis and lists', () => {
    const html = '<h2>Title</h2><p><strong>bold</strong> <em>it</em></p><ul><li>one</li></ul>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('keeps tables with spans', () => {
    const html = '<table><tbody><tr><th colspan="2">h</th></tr><tr><td>c</td></tr></tbody></table>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('keeps code blocks with language classes', () => {
    const html = '<pre class="language-js"><code class="language-js">const a = 1;</code></pre>';
    expect(sanitizeHtml(html)).toContain('language-js');
  });

  it('keeps allowed inline styles and drops the rest', () => {
    const out = sanitizeHtml('<p style="text-align: center; position: fixed">x</p>');
    expect(out).toContain('text-align');
    expect(out).not.toContain('position');
  });

  // Losing this marker would publish every paid post in full.
  it('keeps the paywall marker', () => {
    const out = sanitizeHtml('<p>free</p><div data-type="paywall-line"></div><p>paid</p>');
    expect(out).toContain('data-type="paywall-line"');
  });

  it('drops other data-type values on div', () => {
    const out = sanitizeHtml('<div data-type="something-else"></div>');
    expect(out).not.toContain('something-else');
  });
});

describe('sanitizeHtml — empty input', () => {
  it('passes through empty values untouched', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});

/**
 * Best-effort server-side sanitization for admin-authored HTML (blog posts,
 * lesson content) before it's stored and later rendered with
 * dangerouslySetInnerHTML. This is defense-in-depth against a compromised
 * or malicious admin account / a crafted request that bypasses the editor
 * UI — it is not a full HTML sanitizer. It strips the highest-risk
 * constructs (script execution, inline event handlers, javascript: URLs)
 * while leaving the TipTap-authored markup (headings, tables, images,
 * youtube embeds, etc.) intact.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html;

  return html
    // <script>...</script> and any other executable/embeddable tag
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    // inline event handlers: onclick="...", onerror='...', etc.
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    // javascript: / data:text/html URLs in href/src
    .replace(/(href|src)\s*=\s*"(javascript|data):[^"]*"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'(javascript|data):[^']*'/gi, "$1='#'");
}

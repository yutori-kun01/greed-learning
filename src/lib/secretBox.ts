/**
 * Encrypts small secrets (third-party API keys) before they go into D1.
 *
 * AES-GCM with a key derived from BETTER_AUTH_SECRET, so a copy of the
 * database alone — a backup, an export, a leaked dump — does not reveal the
 * key. Format: "v1.<iv base64>.<ciphertext base64>". Web Crypto only, so it
 * runs unchanged in the Worker and in tests.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PREFIX = 'v1';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not set; cannot encrypt settings');
  // Domain-separated from the session-signing use of the same secret.
  const material = await crypto.subtle.digest('SHA-256', encoder.encode(`settings-encryption:${secret}`));
  return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function sealSecret(plaintext: string, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
  return `${PREFIX}.${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

/** Returns null for anything that is not a value this module sealed with this secret. */
export async function openSecret(sealed: string | null | undefined, secret: string): Promise<string | null> {
  if (!sealed) return null;
  const [version, ivPart, dataPart] = sealed.split('.');
  if (version !== PREFIX || !ivPart || !dataPart) return null;
  try {
    const key = await deriveKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(ivPart) },
      key,
      fromBase64(dataPart)
    );
    return decoder.decode(plaintext);
  } catch {
    return null;
  }
}

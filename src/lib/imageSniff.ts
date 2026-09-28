/**
 * Identifies an image by its first bytes rather than trusting the declared
 * Content-Type. Anything served back from /media must really be one of these
 * formats: a file that merely claims to be image/png but contains HTML or
 * SVG would otherwise be stored and served from the site's own origin.
 */

export type SniffedImage = { mime: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; ext: string };

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((b, i) => bytes[offset + i] === b);
}

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: 'png' };
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return { mime: 'image/gif', ext: 'gif' };
  // RIFF....WEBP
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

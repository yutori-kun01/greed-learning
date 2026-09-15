import { describe, it, expect } from 'vitest'
import {
  ALLOWED_IMAGE_ACCEPT,
  extensionForImageType,
  isAllowedImageType,
  sanitizeImageUrl,
} from './uploads'

describe('isAllowedImageType', () => {
  it('accepts the image types the bucket serves back', () => {
    expect(isAllowedImageType('image/png')).toBe(true)
    expect(isAllowedImageType('image/jpeg')).toBe(true)
    expect(isAllowedImageType('image/webp')).toBe(true)
    expect(isAllowedImageType('image/gif')).toBe(true)
  })

  it('rejects SVG, which can carry script on the public bucket origin', () => {
    expect(isAllowedImageType('image/svg+xml')).toBe(false)
  })

  it('rejects non-images and missing values', () => {
    expect(isAllowedImageType('text/html')).toBe(false)
    expect(isAllowedImageType('application/octet-stream')).toBe(false)
    expect(isAllowedImageType('')).toBe(false)
    expect(isAllowedImageType(null)).toBe(false)
    expect(isAllowedImageType(undefined)).toBe(false)
  })

  it('offers exactly the allowed types to the file picker', () => {
    for (const type of ALLOWED_IMAGE_ACCEPT.split(',')) {
      expect(isAllowedImageType(type)).toBe(true)
    }
  })
})

describe('extensionForImageType', () => {
  it('maps allowed types to a fixed extension', () => {
    expect(extensionForImageType('image/png')).toBe('png')
    expect(extensionForImageType('image/jpeg')).toBe('jpg')
  })

  it('never returns an executable extension for an unknown type', () => {
    expect(extensionForImageType('text/html')).toBe('bin')
  })
})

describe('sanitizeImageUrl', () => {
  it('keeps http(s) URLs', () => {
    expect(sanitizeImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(sanitizeImageUrl('  http://example.com/b.jpg  ')).toBe('http://example.com/b.jpg')
  })

  it('treats empty input as "no image"', () => {
    expect(sanitizeImageUrl('')).toBeNull()
    expect(sanitizeImageUrl('   ')).toBeNull()
    expect(sanitizeImageUrl(null)).toBeNull()
    expect(sanitizeImageUrl(undefined)).toBeNull()
  })

  it('rejects URLs that would execute when rendered into <img src>', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeImageUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(sanitizeImageUrl('not a url')).toBeNull()
  })
})

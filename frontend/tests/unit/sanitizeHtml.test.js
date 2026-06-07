// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { sanitizeRichText, richTextToPlainText } from '../../src/utils/sanitizeHtml';

describe('sanitizeHtml', () => {
  it('preserves allowed formatting', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeRichText(input);
    expect(result).toContain('<strong>world</strong>');
  });

  it('strips script tags', () => {
    const input = '<p>ok</p><script>alert(1)</script>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('ok');
  });

  it('adds rel noopener on external links', () => {
    const input = '<a href="https://example.com">link</a>';
    const result = sanitizeRichText(input);
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('richTextToPlainText uses sanitized output', () => {
    const input = '<p>Hello <strong>world</strong></p><script>x</script>';
    expect(richTextToPlainText(input)).toBe('Hello world');
  });
});

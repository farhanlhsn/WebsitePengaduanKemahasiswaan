const { sanitizeRichText } = require('../../../src/utils/htmlSanitize');

describe('htmlSanitize', () => {
  it('preserves allowed formatting tags', () => {
    const input = '<p>Hello <strong>world</strong></p><ul><li>one</li></ul>';
    const result = sanitizeRichText(input);
    expect(result).toContain('<strong>world</strong>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>one</li>');
  });

  it('strips script tags (stored XSS)', () => {
    const input = '<p>Safe</p><script>alert(1)</script>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
    expect(result).toContain('Safe');
  });

  it('strips javascript: href', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('javascript:');
  });

  it('adds rel noopener on external links', () => {
    const input = '<a href="https://example.com">link</a>';
    const result = sanitizeRichText(input);
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('target="_blank"');
  });

  it('allows mailto links', () => {
    const input = '<a href="mailto:test@kampus.ac.id">email</a>';
    const result = sanitizeRichText(input);
    expect(result).toContain('mailto:test@kampus.ac.id');
  });
});

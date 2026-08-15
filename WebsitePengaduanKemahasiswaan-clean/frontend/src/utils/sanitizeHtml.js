import DOMPurify from 'dompurify';

const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'blockquote',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitize rich text HTML before rendering (client-side defense-in-depth).
 */
export function sanitizeRichText(html) {
  if (!html || typeof html !== 'string') return '';
  const clean = DOMPurify.sanitize(html, RICH_TEXT_CONFIG);

  const doc = new DOMParser().parseFromString(clean, 'text/html');
  doc.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href)) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return doc.body.innerHTML;
}

/**
 * Extract plain text from sanitized HTML (safe preview).
 */
export function richTextToPlainText(html) {
  const sanitized = sanitizeRichText(html);
  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Service worker request classification.
 * Keep logic in sync with frontend/public/sw.js.
 */

export function isUploadRequest(request) {
  const path = new URL(request.url).pathname;
  return path.startsWith('/uploads/');
}

export function isApiRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  return path.startsWith('/api/') || path.startsWith('/v1/api/');
}

export function isStaticAsset(request) {
  const url = new URL(request.url);
  if (isUploadRequest(request)) return false;
  return /\.(js|css|woff2?|ttf|eot)$/i.test(url.pathname);
}

export function isImageRequest(request) {
  const url = new URL(request.url);
  if (isUploadRequest(request)) return false;
  return /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(url.pathname);
}

/** Authenticated or otherwise sensitive traffic must never be cached. */
export function shouldBypassCache(request) {
  return isApiRequest(request) || isUploadRequest(request);
}

export function getFetchStrategy(request) {
  if (shouldBypassCache(request)) return 'network-only';
  if (isStaticAsset(request)) return 'cache-first';
  if (isImageRequest(request)) return 'cache-first';
  return 'network-only';
}

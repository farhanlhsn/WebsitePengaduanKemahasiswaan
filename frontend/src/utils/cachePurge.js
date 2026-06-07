/**
 * Purge runtime caches that may hold user-specific data.
 * Static shell assets (static-v*) are retained.
 */

const RETAINED_CACHE_PREFIXES = ['static-v'];

export async function purgeSensitiveCaches() {
  if (typeof caches === 'undefined') return;

  try {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(
          (name) => !RETAINED_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix))
        )
        .map((name) => caches.delete(name))
    );
  } catch (err) {
    console.warn('Failed to purge sensitive caches:', err);
  }
}

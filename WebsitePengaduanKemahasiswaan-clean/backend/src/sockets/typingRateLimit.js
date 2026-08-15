const WINDOW_MS = 60_000;
const MAX_EVENTS = 120;

const buckets = new Map();

function allowTyping(socketId) {
  const now = Date.now();
  const bucket = buckets.get(socketId) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }

  bucket.count += 1;
  buckets.set(socketId, bucket);

  return bucket.count <= MAX_EVENTS;
}

function clearTypingBucket(socketId) {
  buckets.delete(socketId);
}

module.exports = { allowTyping, clearTypingBucket };

const WINDOW_MS = 60_000;
const MAX_EVENTS = 120;

// joinRoom/leaveRoom memicu 2–3 query DB per event; dibatasi lebih ketat.
const ROOM_MAX_EVENTS = 30;

const buckets = new Map();
const roomBuckets = new Map();

function hit(map, socketId, max) {
  const now = Date.now();
  const bucket = map.get(socketId) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }
  bucket.count += 1;
  map.set(socketId, bucket);
  return bucket.count <= max;
}

function allowRoomEvent(socketId) {
  return hit(roomBuckets, socketId, ROOM_MAX_EVENTS);
}

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
  roomBuckets.delete(socketId);
}

module.exports = { allowTyping, allowRoomEvent, clearTypingBucket };

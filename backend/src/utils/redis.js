const Redis = require('ioredis');
const { getLogger } = require('./logger');
const log = getLogger('redis');

let redisClient = null;

const redisUrl = process.env.TEST_REDIS_URL || process.env.REDIS_URL;
const allowRedisInTest = Boolean(process.env.TEST_REDIS_URL);

if (redisUrl && (process.env.NODE_ENV !== 'test' || allowRedisInTest)) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => {
      log.info('Redis connected successfully.');
    });

    redisClient.on('error', (err) => {
      log.error('Redis Client Error:', err);
    });
  } catch (err) {
    log.error('Failed to initialize Redis client:', err);
    redisClient = null;
  }
}

module.exports = redisClient;

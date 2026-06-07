const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Prisma connected to database');
      }
      return;
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`⚠️  Prisma connection attempt ${i + 1}/${retries} failed: ${err.message}`);
      }
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Prisma could not connect after multiple retries');
  }
}

prisma.$on('warn', (e) => {
  console.warn(`Prisma Warning: ${e.message}`);
});

prisma.$on('error', (e) => {
  if (process.env.NODE_ENV === 'test') return;
  console.error(`Prisma Error: ${e.message}`);
  if (e.message.includes('Closed') || e.message.includes('connection')) {
    console.log('🔄 Attempting to reconnect to database...');
    connectWithRetry(3, 2000);
  }
});

module.exports = prisma;
module.exports.connectWithRetry = connectWithRetry;

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

// Reconnect helper
async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Prisma connected to database');
      return;
    } catch (err) {
      console.warn(`⚠️  Prisma connection attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ Prisma could not connect after multiple retries');
}

connectWithRetry();

prisma.$on('warn', (e) => {
  console.warn(`Prisma Warning: ${e.message}`);
});

prisma.$on('error', (e) => {
  console.error(`Prisma Error: ${e.message}`);
  // Auto-reconnect on connection closed
  if (e.message.includes('Closed') || e.message.includes('connection')) {
    console.log('🔄 Attempting to reconnect to database...');
    connectWithRetry(3, 2000);
  }
});

module.exports = prisma;
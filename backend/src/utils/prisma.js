const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'query', emit: 'event' },
  ],
});

// Logging untuk query Prisma
prisma.$on('query', (e) => {
  console.log(`Query: ${e.query}`);
  console.log(`Params: ${e.params}`);
  console.log(`Duration: ${e.duration}ms`);
});

prisma.$on('warn', (e) => {
  console.warn(`Prisma Warning: ${e.message}`);
});

prisma.$on('error', (e) => {
  console.error(`Prisma Error: ${e.message}`);
});

module.exports = prisma;
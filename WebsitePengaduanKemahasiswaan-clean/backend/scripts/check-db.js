/**
 * Exit 0 if DATABASE_URL (argv[2] or env) is reachable.
 */
const { PrismaClient } = require('@prisma/client');

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) process.exit(1);

const prisma = new PrismaClient({ datasources: { db: { url } } });

prisma
  .$connect()
  .then(() => prisma.$disconnect())
  .catch(() => process.exit(1));

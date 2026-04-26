const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  const commentIdx = val.indexOf(' #');
  if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
  envVars[key] = val;
  process.env[key] = val;
}

const { app, attachSocket } = require('./app');
const prisma = require('./utils/prisma');
const PORT = envVars.PORT || process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Base URL: http://localhost:${PORT}/api`);
});
attachSocket(server);

const shutdown = async () => {
  console.log('\nShutting down server...');
  
  try {
    await prisma.$disconnect();
    console.log('Prisma disconnected from database');
    
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const app = require('./app');
const prisma = require('./utils/prisma');
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Base URL: http://localhost:${PORT}/api`);
});

// Handle shutdown gracefully
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
const { Server } = require('socket.io');
const { authenticateSocket } = require('./socketAuth');
const { assertSocketEventAllowed } = require('./roomAccess');
const { parsePositiveInt, parseBoolean } = require('./validatePayload');
const { emitChatError, leaveAndClearRoom, kickSocket } = require('./socketEmitters');
const { allowTyping, clearTypingBucket } = require('./typingRateLimit');
const { getLogger } = require('../utils/logger');

const socketLog = getLogger('socket:io');

function setupSocket(server) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      const result = await authenticateSocket(token);
      if (!result.valid) {
        const err = new Error(result.code);
        err.data = { code: result.code };
        return next(err);
      }

      socket.data.user = result.user;
      socket.join(`user_${result.user.userId}`);

      socketLog.info('Socket authenticated', {
        userId: result.user.userId,
        socketId: socket.id,
      });
      next();
    } catch (error) {
      const err = new Error('AUTH_INVALID');
      err.data = { code: 'AUTH_INVALID' };
      return next(err);
    }
  });

  io.on('connection', (socket) => {
    socket.data.activeRoomId = null;
    socket.data.authorizedReportId = null;

    socketLog.info('User connected', {
      socketId: socket.id,
      userId: socket.data.user.userId,
    });

    socket.on('joinRoom', async (payload, callback) => {
      try {
        const reportId = parsePositiveInt(payload?.reportId, 'reportId');
        const check = await assertSocketEventAllowed(socket, reportId, { requireJoined: false });

        if (!check.ok) {
          if (check.disconnect) {
            await kickSocket(socket, check.code);
          }
          const response = { ok: false, code: check.code, message: 'Akses ditolak.' };
          if (typeof callback === 'function') callback(response);
          else emitChatError(socket, response);
          return;
        }

        await leaveAndClearRoom(socket);

        const roomId = `report_${reportId}`;
        socket.join(roomId);
        socket.data.activeRoomId = roomId;
        socket.data.authorizedReportId = reportId;

        const success = { ok: true, roomId };
        if (typeof callback === 'function') callback(success);
        socket.to(roomId).emit('room:joined', {
          userId: check.user.userId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        const code = error.code || 'INVALID_PAYLOAD';
        const response = { ok: false, code, message: error.message };
        if (typeof callback === 'function') callback(response);
        else emitChatError(socket, response);
      }
    });

    socket.on('leaveRoom', async (payload, callback) => {
      try {
        const reportId = parsePositiveInt(payload?.reportId, 'reportId');
        if (socket.data.authorizedReportId !== reportId) {
          const response = { ok: false, code: 'ROOM_NOT_JOINED' };
          if (typeof callback === 'function') callback(response);
          return;
        }
        await leaveAndClearRoom(socket);
        if (typeof callback === 'function') callback({ ok: true });
      } catch (error) {
        const response = { ok: false, code: 'INVALID_PAYLOAD' };
        if (typeof callback === 'function') callback(response);
      }
    });

    socket.on('chat:typing', async (payload) => {
      try {
        if (!allowTyping(socket.id)) {
          return emitChatError(socket, { code: 'RATE_LIMITED', message: 'Terlalu banyak event typing.' });
        }

        const reportId = parsePositiveInt(payload?.reportId, 'reportId');
        const isTyping = parseBoolean(payload?.isTyping);

        const check = await assertSocketEventAllowed(socket, reportId, { requireJoined: true });
        if (!check.ok) {
          if (check.disconnect) {
            return kickSocket(socket, check.code);
          }
          return emitChatError(socket, { code: check.code, message: 'Akses ditolak.' });
        }

        const roomId = `report_${reportId}`;
        socket.to(roomId).emit('chat:typing', {
          userId: check.user.userId,
          isTyping,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        emitChatError(socket, { code: 'INVALID_PAYLOAD', message: error.message });
      }
    });

    socket.on('disconnect', async () => {
      clearTypingBucket(socket.id);
      socketLog.info('User disconnected', {
        socketId: socket.id,
        userId: socket.data.user?.userId,
      });
      await leaveAndClearRoom(socket);
    });
  });

  return io;
}

module.exports = { setupSocket };

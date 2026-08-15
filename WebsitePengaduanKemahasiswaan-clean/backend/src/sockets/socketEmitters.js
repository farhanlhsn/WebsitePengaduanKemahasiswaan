const { getLogger } = require('../utils/logger');

const log = getLogger('socket:emitters');

function emitChatError(socket, payload) {
  socket.emit('chat:error', {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

async function leaveAndClearRoom(socket) {
  const roomId = socket.data.activeRoomId;
  if (!roomId) return;

  socket.leave(roomId);
  socket.to(roomId).emit('room:left', {
    userId: socket.data.user?.userId,
    timestamp: new Date().toISOString(),
  });

  socket.data.activeRoomId = null;
  socket.data.authorizedReportId = null;
}

async function kickSocket(socket, code) {
  await leaveAndClearRoom(socket);
  emitChatError(socket, { code, message: 'Sesi socket diakhiri.' });
  socket.disconnect(true);
}

module.exports = { emitChatError, leaveAndClearRoom, kickSocket };

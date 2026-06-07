const { canAccessReport } = require('../utils/accessPolicy');
const { revalidateSocketUser } = require('./socketAuth');
const { leaveAndClearRoom } = require('./socketEmitters');

async function assertSocketEventAllowed(socket, reportId, { requireJoined = true } = {}) {
  const userCheck = await revalidateSocketUser(socket.data.user);
  if (!userCheck.valid) {
    if (userCheck.disconnect) {
      await leaveAndClearRoom(socket);
    }
    return { ok: false, code: userCheck.code, disconnect: userCheck.disconnect };
  }

  socket.data.user = userCheck.user;

  const access = await canAccessReport(userCheck.user, reportId);
  if (!access.allowed) {
    if (socket.data.authorizedReportId === reportId) {
      await leaveAndClearRoom(socket);
    }
    return { ok: false, code: 'ACCESS_DENIED' };
  }

  if (requireJoined && socket.data.authorizedReportId !== reportId) {
    return { ok: false, code: 'ROOM_NOT_JOINED' };
  }

  return { ok: true, user: userCheck.user, report: access.report };
}

module.exports = { assertSocketEventAllowed };

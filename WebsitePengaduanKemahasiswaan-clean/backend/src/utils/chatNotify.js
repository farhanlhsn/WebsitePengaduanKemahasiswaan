const { getEligibleChatListRecipients } = require('./chatPolicies');
const { getLogger } = require('./logger');

const log = getLogger('chat:notify');

async function notifyChatListRefresh(io, reportId, meta = {}) {
  if (!io) return;
  try {
    const recipients = await getEligibleChatListRecipients(reportId);
    const payload = { reportId, ...meta, timestamp: new Date().toISOString() };
    for (const userId of recipients) {
      io.to(`user_${userId}`).emit('chat:list:update', payload);
    }
  } catch (err) {
    log.warn('notifyChatListRefresh failed', { reportId, error: err.message });
  }
}

module.exports = { notifyChatListRefresh };

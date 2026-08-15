const adminGovernanceServices = require('../services/adminGovernanceServices');
const auditLogServices = require('../services/auditLogServices');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');

const log = getLogger('admin-governance:controller');

function auditContext(req) {
  return {
    actorId: req.user.userId,
    actorName: req.user.name,
    actorRole: req.user.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

/**
 * Audit M6: beri tahu socket user bahwa aksesnya berubah.
 * - `disconnect=true` dipakai saat demote (tokenVersion naik → sesi socket
 *   memang sudah tidak valid), sehingga socket pasif diputus sekarang juga
 *   alih-alih terus menerima broadcast chat.
 * - `disconnect=false` dipakai saat revoke kategori (sesi masih valid untuk
 *   kategori lain) — frontend yang memutuskan keluar room terkait.
 */
function notifyAccessRevoked(req, userId, { reason, categoryId = null, disconnect = false }) {
  const io = req.app.get('io');
  if (!io) return;
  const userRoom = `user_${userId}`;
  const room = io.sockets.adapter.rooms.get(userRoom);
  if (!room) return;
  for (const socketId of [...room]) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    socket.emit('access:revoked', { reason, categoryId });
    if (disconnect) socket.disconnect(true);
  }
}

exports.listAdmins = async (req, res) => {
  try {
    const admins = await adminGovernanceServices.listAdmins();
    res.status(200).json(ResponseFormatter.success(admins));
  } catch (err) {
    log.warn('listAdmins failed', { error: err.message });
    res.status(500).json(ResponseFormatter.error(err.message));
  }
};

exports.promoteToAdmin = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const updated = await adminGovernanceServices.promoteToAdmin(targetUserId, req.user.userId);
    auditLogServices
      .createAuditLog({
        ...auditContext(req),
        entityType: 'USER',
        action: 'PROMOTE_ADMIN',
        entityId: targetUserId,
        metadata: { newRole: 'ADMIN' },
      })
      .catch((e) => log.error('audit failed', { error: e.message }));
    res.status(200).json(ResponseFormatter.success(updated, 'Promoted to ADMIN'));
  } catch (err) {
    log.warn('promoteToAdmin failed', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

exports.demoteAdmin = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const updated = await adminGovernanceServices.demoteAdmin(targetUserId, req.user.userId);
    notifyAccessRevoked(req, targetUserId, { reason: 'DEMOTED', disconnect: true });
    auditLogServices
      .createAuditLog({
        ...auditContext(req),
        entityType: 'USER',
        action: 'DEMOTE_ADMIN',
        entityId: targetUserId,
        metadata: { newRole: 'MAHASISWA' },
      })
      .catch((e) => log.error('audit failed', { error: e.message }));
    res.status(200).json(ResponseFormatter.success(updated, 'Demoted to MAHASISWA'));
  } catch (err) {
    log.warn('demoteAdmin failed', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

exports.promoteToSuperAdmin = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const updated = await adminGovernanceServices.promoteToSuperAdmin(targetUserId, req.user.userId);
    auditLogServices
      .createAuditLog({
        ...auditContext(req),
        entityType: 'USER',
        action: 'PROMOTE_ADMIN',
        entityId: targetUserId,
        metadata: { newRole: 'SUPERADMIN' },
      })
      .catch((e) => log.error('audit failed', { error: e.message }));
    res.status(200).json(ResponseFormatter.success(updated, 'Promoted to SUPERADMIN'));
  } catch (err) {
    log.warn('promoteToSuperAdmin failed', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

exports.demoteSuperAdmin = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const updated = await adminGovernanceServices.demoteSuperAdmin(targetUserId, req.user.userId);
    notifyAccessRevoked(req, targetUserId, { reason: 'DEMOTED', disconnect: true });
    auditLogServices
      .createAuditLog({
        ...auditContext(req),
        entityType: 'USER',
        action: 'DEMOTE_ADMIN',
        entityId: targetUserId,
        metadata: { newRole: 'ADMIN' },
      })
      .catch((e) => log.error('audit failed', { error: e.message }));
    res.status(200).json(ResponseFormatter.success(updated, 'Demoted to ADMIN'));
  } catch (err) {
    log.warn('demoteSuperAdmin failed', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

exports.grantCategory = async (req, res) => {
  try {
    const adminId = parseInt(req.params.userId, 10);
    const categoryId = parseInt(req.body.categoryId, 10);
    if (Number.isNaN(adminId) || Number.isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid adminId or categoryId'));
    }
    const result = await adminGovernanceServices.grantCategory(adminId, categoryId, req.user.userId);
    auditLogServices
      .createAuditLog({
        ...auditContext(req),
        entityType: 'ASSIGNMENT',
        action: 'GRANT_CATEGORY',
        entityId: result.id,
        metadata: { adminId, categoryId },
      })
      .catch((e) => log.error('audit failed', { error: e.message }));
    res.status(200).json(ResponseFormatter.success(result, 'Category granted'));
  } catch (err) {
    log.warn('grantCategory failed', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

exports.revokeCategory = async (req, res) => {
  try {
    const adminId = parseInt(req.params.userId, 10);
    const categoryId = parseInt(req.params.categoryId, 10);
    if (Number.isNaN(adminId) || Number.isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid adminId or categoryId'));
    }
    const result = await adminGovernanceServices.revokeCategory(adminId, categoryId, req.user.userId);
    if (result.revoked) {
      notifyAccessRevoked(req, adminId, { reason: 'CATEGORY_REVOKED', categoryId, disconnect: false });
      auditLogServices
        .createAuditLog({
          ...auditContext(req),
          entityType: 'ASSIGNMENT',
          action: 'REVOKE_CATEGORY',
          entityId: 0,
          metadata: { adminId, categoryId },
        })
        .catch((e) => log.error('audit failed', { error: e.message }));
    }
    res.status(200).json(ResponseFormatter.success(result, result.revoked ? 'Category revoked' : 'Already revoked'));
  } catch (err) {
    log.warn('revokeCategory failed', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

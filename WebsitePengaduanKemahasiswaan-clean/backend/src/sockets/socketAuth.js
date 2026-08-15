const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

async function authenticateSocket(token) {
  if (!token) {
    return { valid: false, code: 'AUTH_REQUIRED' };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, code: 'AUTH_INVALID' };
    }
    return { valid: false, code: 'AUTH_INVALID' };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, name: true, tokenVersion: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return { valid: false, code: 'USER_DELETED' };
  }

  if (decoded.tokenVersion === undefined || decoded.tokenVersion !== user.tokenVersion) {
    return { valid: false, code: 'AUTH_REVOKED' };
  }

  return {
    valid: true,
    user: {
      userId: user.id,
      role: user.role,
      name: user.name,
      tokenVersion: user.tokenVersion,
    },
  };
}

async function revalidateSocketUser(socketUser) {
  if (!socketUser?.userId) {
    return { valid: false, code: 'AUTH_INVALID' };
  }

  const user = await prisma.user.findUnique({
    where: { id: socketUser.userId },
    select: { id: true, role: true, name: true, tokenVersion: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return { valid: false, code: 'USER_DELETED', disconnect: true };
  }

  if (socketUser.tokenVersion === undefined || socketUser.tokenVersion !== user.tokenVersion) {
    return { valid: false, code: 'AUTH_REVOKED', disconnect: true };
  }

  return {
    valid: true,
    user: {
      userId: user.id,
      role: user.role,
      name: user.name,
      tokenVersion: user.tokenVersion,
    },
  };
}

module.exports = { authenticateSocket, revalidateSocketUser };

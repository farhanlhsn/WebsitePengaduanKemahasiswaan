const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access token required' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate tokenVersion against database
    // This ensures tokens are invalidated after password reset or force-logout
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, tokenVersion: true, role: true, name: true, deletedAt: true }
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({
        error: 'User not found or deleted',
        code: 'USER_INVALID'
      });
    }

    if (decoded.tokenVersion === undefined || decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }
    
    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      role: user.role,
      name: user.name
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(500).json({ 
      error: 'Authentication failed' 
    });
  }
};

module.exports = authMiddleware;

const userServices = require('../services/userServices');
const ResponseFormatter = require('../utils/responseFormatter');

exports.getAllUsers = async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const users = await userServices.getAllUsers(includeDeleted);
    
    res.status(200).json(ResponseFormatter.success(users, 'Users retrieved successfully'));
  } catch (error) {
    console.error('getAllUsers error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to get users', 500));
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const includeDeleted = req.query.includeDeleted === 'true';
    
    // Validate userId
    if (!userId || isNaN(userId)) {
      return ResponseFormatter.error(res, 'Invalid user ID provided', 400);
    }
    
    const user = await userServices.getUserById(userId, includeDeleted);
    res.status(200).json(ResponseFormatter.success(user, 'User retrieved successfully'));
  } catch (error) {
    console.error('getUserById error:', error.message);
    res.status(404).json(ResponseFormatter.error('User not found', 404));
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updatedUser = await userServices.updateUser(userId, req.body);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json(ResponseFormatter.success(userWithoutPassword, 'User updated successfully'));
  } catch (error) {
    console.error('updateUser error:', error.message);
    res.status(400).json(ResponseFormatter.error('Update failed', 400));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid user ID provided', 400));
    }
    
    await userServices.deleteUser(userId);
    res.status(200).json(ResponseFormatter.success(null, 'User deleted successfully (soft delete)'));
  } catch (error) {
    console.error('deleteUser error:', error.message);
    res.status(400).json(ResponseFormatter.error('Failed to delete user', 400));
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid user ID provided', 400));
    }
    
    const restoredUser = await userServices.restoreUser(userId);
    const { password, ...userWithoutPassword } = restoredUser;
    
    res.status(200).json(ResponseFormatter.success(userWithoutPassword, 'User restored successfully'));
  } catch (error) {
    console.error('restoreUser error:', error.message);
    res.status(400).json(ResponseFormatter.error('Failed to restore user', 400));
  }
};

exports.permanentDeleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid user ID provided', 400));
    }
    
    // Only allow ADMIN to permanently delete
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Unauthorized: Admin access required', 403));
    }
    
    await userServices.permanentDeleteUser(userId);
    res.status(200).json(ResponseFormatter.success(null, 'User permanently deleted'));
  } catch (error) {
    console.error('permanentDeleteUser error:', error.message);
    res.status(400).json(ResponseFormatter.error('Failed to permanently delete user', 400));
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const includeDeleted = req.query.includeDeleted === 'true';
    
    if (!email) {
      return res.status(400).json(ResponseFormatter.error('Email parameter is required', 400));
    }

    const user = await userServices.findUserByEmail(email, includeDeleted);
    if (!user) {
      return res.status(404).json(ResponseFormatter.error('User not found', 404));
    }
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(ResponseFormatter.success(userWithoutPassword, 'User found'));
  } catch (error) {
    console.error('getUserByEmail error:', error);
    res.status(500).json(ResponseFormatter.error('Internal server error', 500));
  }
};

exports.verifyStudent = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await userServices.verifyStudent(userId);
    
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(ResponseFormatter.success(userWithoutPassword, 'User verified successfully'));
  } catch (error) {
    console.error('verifyStudent error:', error.message);
    res.status(404).json(ResponseFormatter.error('User not found', 404));
  }
};

exports.getUserVerificationStats = async (req, res) => {
  try {
    console.log('getUserVerificationStats controller called');
    const stats = await userServices.getUserVerificationStats();
    console.log('stats', stats);
    res.status(200).json(ResponseFormatter.success(stats, 'User statistics retrieved successfully'));
  } catch (error) {
    console.error('getUserVerificationStats error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to get user statistics', 500));
  }
};

exports.cleanupOldDeletedUsers = async (req, res) => {
  try {
    // Only allow ADMIN to cleanup
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Unauthorized: Admin access required', 403));
    }
    
    const daysOld = parseInt(req.query.daysOld) || 90;
    const result = await userServices.cleanupOldDeletedUsers(daysOld);
    
    res.status(200).json(ResponseFormatter.success(result, `Cleaned up users deleted more than ${daysOld} days ago`));
  } catch (error) {
    console.error('cleanupOldDeletedUsers error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to cleanup old deleted users', 500));
  }
};

exports.getUserStatsById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const stats = await userServices.getUserStatsById(userId);
    res.status(200).json(ResponseFormatter.success(stats, 'User statistics retrieved successfully'));
  } catch (error) {
    console.error('getUserStatsById error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to get user statistics', 500));
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const stats = await userServices.getUserVerificationStats();
    res.status(200).json(ResponseFormatter.success(stats, 'User statistics retrieved successfully'));
  } catch (error) {
    console.error('getUserStats error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to get user statistics', 500));
  }
};
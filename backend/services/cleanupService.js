const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Connection = require('../models/Connection');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const UserBadge = require('../models/UserBadge');
const AppError = require('../utils/AppError');

/** Remove every document that references a user (both sides of a relationship). */
const deleteUserData = async (userId) => {
  const id = String(userId);
  await Promise.all([
    UserSkill.deleteMany({ userId: id }),
    Connection.deleteMany({ $or: [{ userA: id }, { userB: id }] }),
    Session.deleteMany({ $or: [{ mentorId: id }, { learnerId: id }] }),
    Message.deleteMany({ $or: [{ sender: id }, { receiver: id }] }),
    Review.deleteMany({ $or: [{ mentor: id }, { learner: id }] }),
    Notification.deleteMany({ userId: id }),
    UserBadge.deleteMany({ userId: id }),
  ]);
};

/**
 * Permanently delete a user and all their data.
 * Demo and admin accounts are protected from deletion.
 */
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  if (user.isDemo) throw new AppError('The demo account cannot be deleted. Use the demo reset tool instead.', 400);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be deleted.', 400);

  await deleteUserData(user._id);
  await User.findByIdAndDelete(user._id);
  return user;
};

/** Delete all temporary test accounts. Returns how many were removed. */
const deleteTestUsers = async () => {
  const testUsers = await User.find({ isTest: true, isDemo: { $ne: true } }).select('_id');
  for (const u of testUsers) {
    await deleteUserData(u._id);
  }
  if (testUsers.length) {
    await User.deleteMany({ _id: { $in: testUsers.map((u) => u._id) } });
  }
  return testUsers.length;
};

module.exports = { deleteUserData, deleteUser, deleteTestUsers };

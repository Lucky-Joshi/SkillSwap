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
 * Admin accounts are protected from deletion.
 */
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be deleted.', 400);

  await deleteUserData(user._id);
  await User.findByIdAndDelete(user._id);
  return user;
};

module.exports = { deleteUserData, deleteUser };

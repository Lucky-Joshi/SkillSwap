const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

/** Remove every document that references a user (both sides of a relationship). */
const deleteUserData = async (userId) => {
  const id = String(userId);
  await prisma.$transaction([
    prisma.user.updateMany({ where: { verifiedById: id }, data: { verifiedById: null } }),
    prisma.user.updateMany({ where: { suspendedById: id }, data: { suspendedById: null } }),
    prisma.user.updateMany({ where: { bannedById: id }, data: { bannedById: null } }),
    prisma.user.updateMany({ where: { deletedById: id }, data: { deletedById: null } }),
    prisma.report.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } }),
    prisma.userSkill.deleteMany({ where: { userId: id } }),
    prisma.connection.deleteMany({ where: { OR: [{ userAId: id }, { userBId: id }, { requestedById: id }] } }),
    prisma.session.deleteMany({ where: { OR: [{ mentorId: id }, { learnerId: id }, { cancelledById: id }] } }),
    prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
    prisma.review.deleteMany({ where: { OR: [{ mentorId: id }, { learnerId: id }] } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    prisma.userBadge.deleteMany({ where: { userId: id } }),
    prisma.endorsement.deleteMany({ where: { OR: [{ userId: id }, { endorserId: id }] } }),
  ]);
};

/**
 * Permanently delete a user and all their data.
 * Admin accounts are protected from deletion.
 */
const deleteUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: String(userId) } });
  if (!user) throw new AppError('User not found.', 404);
  if (['admin', 'super_admin'].includes(user.role)) throw new AppError('Admin accounts cannot be deleted.', 400);

  await deleteUserData(user.id);
  await prisma.user.delete({ where: { id: user.id } });
  return user;
};

module.exports = { deleteUserData, deleteUser };

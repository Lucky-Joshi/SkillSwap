const User = require('../models/User');

class UserRepository {
  async findById(id, select = null) {
    const q = User.findById(id);
    if (select) q.select(select);
    return q;
  }

  async findByIdLean(id, select = null) {
    const q = User.findById(id).lean();
    if (select) q.select(select);
    return q;
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByUsername(username) {
    return User.findOne({ username });
  }

  async create(data) {
    return User.create(data);
  }

  async updateById(id, update, options = {}) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true, ...options });
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  async searchUsers(filters, { page, limit, skip, sort }) {
    const query = {};

    if (filters.q) {
      query.$or = [
        { name: { $regex: filters.q, $options: 'i' } },
        { bio: { $regex: filters.q, $options: 'i' } },
      ];
    }
    if (filters.skills?.length) {
      query.skills = { $in: filters.skills };
    }
    if (filters.college) {
      query.college = { $regex: filters.college, $options: 'i' };
    }
    if (filters.qualification) {
      query.qualification = { $regex: filters.qualification, $options: 'i' };
    }
    if (filters.mentor) {
      query.canTeach = true;
    }
    if (filters.peer) {
      query.canTeach = { $ne: true };
    }
    if (filters.verified) {
      query.verified = true;
    }
    if (filters.excludeId) {
      query._id = { $ne: filters.excludeId };
    }

    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return { users, total };
  }

  async incrementProfileViews(id) {
    return User.findByIdAndUpdate(id, { $inc: { profileViews: 1 } }, { new: true });
  }

  async addSkill(userId, skillData) {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { skills: skillData } },
      { new: true, runValidators: true }
    );
  }

  async removeSkill(userId, skillId) {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { skills: { _id: skillId } } },
      { new: true }
    );
  }

  async updateSkill(userId, skillId, update) {
    return User.findOneAndUpdate(
      { _id: userId, 'skills._id': skillId },
      { $set: { 'skills.$': { ...update, _id: skillId } } },
      { new: true, runValidators: true }
    );
  }

  async findByResetToken(token) {
    return User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });
  }

  async getLeaderboard(sort, limit) {
    return User.find({ role: 'user' }).sort(sort).limit(limit).lean();
  }

  async countByQuery(query) {
    return User.countDocuments(query);
  }

  async findMany(query, select = null, sort = null, limit = null) {
    const q = User.find(query);
    if (select) q.select(select);
    if (sort) q.sort(sort);
    if (limit) q.limit(limit);
    return q.lean();
  }
}

module.exports = new UserRepository();

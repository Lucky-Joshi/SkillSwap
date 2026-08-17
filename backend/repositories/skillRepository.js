const Skill = require('../models/Skill');

class SkillRepository {
  async findById(id) {
    return Skill.findById(id);
  }

  async findByName(name) {
    return Skill.findOne({ name: new RegExp(`^${name}$`, 'i') });
  }

  async findAll(query = {}, sort = { name: 1 }) {
    return Skill.find(query).sort(sort).lean();
  }

  async findByIds(ids) {
    return Skill.find({ _id: { $in: ids } }).lean();
  }

  async search(q, limit = 20) {
    return Skill.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { aliases: { $regex: q, $options: 'i' } },
      ],
    }).limit(limit).lean();
  }

  async create(data) {
    return Skill.create(data);
  }

  async updateById(id, update) {
    return Skill.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  async deleteById(id) {
    return Skill.findByIdAndDelete(id);
  }

  async getCategories() {
    return Skill.distinct('category');
  }

  async countDocuments(query = {}) {
    return Skill.countDocuments(query);
  }

  async deleteMany(query = {}) {
    return Skill.deleteMany(query);
  }
}

module.exports = new SkillRepository();

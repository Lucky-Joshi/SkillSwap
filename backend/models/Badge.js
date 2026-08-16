const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🏅' },
    points: { type: Number, default: 10 },
    criteria: { type: String, default: '' },
    autoGrant: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', badgeSchema);

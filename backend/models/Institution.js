const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    city: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    type: { type: String, enum: ['school', 'college', 'university'], default: 'college' },
  },
  { timestamps: true }
);

institutionSchema.index({ name: 'text' });

module.exports = mongoose.model('Institution', institutionSchema);

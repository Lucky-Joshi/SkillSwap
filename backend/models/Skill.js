const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      maxlength: 60,
    },
    aliases: [{ type: String, trim: true }],
    category: {
      type: String,
      enum: [
        'programming',
        'frontend',
        'backend',
        'database',
        'data-science',
        'ai-ml',
        'cloud-devops',
        'design',
        'soft-skills',
        'languages',
        'business',
        'other',
      ],
      default: 'other',
    },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    icon: { type: String, default: '⭐' },
  },
  { timestamps: true }
);

skillSchema.index({ name: 'text', aliases: 'text' });

module.exports = mongoose.model('Skill', skillSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    link: String,
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: { type: String, enum: ['student', 'faculty', 'alumni', 'admin'], default: 'student' },
    college: { type: String, default: '', trim: true },
    qualification: {
      type: String,
      enum: [
        '10th Grade', '12th Grade', 'Diploma', 'B.Tech', 'B.E', 'B.Sc', 'BCA', 'MCA',
        'M.Tech', 'M.Sc', 'BBA', 'MBA', 'BA', 'MA', 'Ph.D', 'Other', '',
      ],
      default: '',
    },
    department: { type: String, default: '', trim: true },
    year: { type: String, enum: ['1', '2', '3', '4', '5', 'Graduate', ''], default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    avatar: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    projects: [projectSchema],
    achievements: [{ type: String }],
    certificates: [{ type: String }],
    availability: {
      type: String,
      enum: ['weekdays', 'weekends', 'evenings', 'mornings', 'anytime', ''],
      default: 'anytime',
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
    lastActiveAt: { type: Date, default: Date.now },
    isTest: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    trustScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.updateRating = function updateRating() {
  // Recalculate aggregate rating from reviews (done via Review controller/service).
  return this;
};

module.exports = mongoose.model('User', userSchema);

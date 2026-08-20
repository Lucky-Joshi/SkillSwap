const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    link: String,
    image: String,
    skills: [{ type: String }],
  },
  { _id: true }
);

const educationEntrySchema = new mongoose.Schema(
  {
    school: { type: String, default: '' },
    university: { type: String, default: '' },
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    startYear: { type: String, default: '' },
    endYear: { type: String, default: '' },
    isCurrent: { type: Boolean, default: false },
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
    graduationYear: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    introduction: { type: String, default: '', maxlength: 200 },
    teachingPhilosophy: { type: String, default: '', maxlength: 500 },
    learningGoals: { type: String, default: '', maxlength: 500 },
    preferredLearningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed', ''],
      default: '',
    },
    languages: [{ type: String }],
    interests: [{ type: String }],
    timezone: { type: String, default: '' },
    location: { type: String, default: '' },
    avatar: { type: String, default: '' },
    coverPhoto: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    socialLinks: {
      leetcode: { type: String, default: '' },
      codeforces: { type: String, default: '' },
      hackerrank: { type: String, default: '' },
      kaggle: { type: String, default: '' },
      behance: { type: String, default: '' },
      dribbble: { type: String, default: '' },
      youtube: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    projects: [projectSchema],
    educationHistory: [educationEntrySchema],
    achievements: [{ type: String }],
    certificates: [{ type: String }],
    availability: {
      type: String,
      enum: ['weekdays', 'weekends', 'evenings', 'mornings', 'anytime', ''],
      default: 'anytime',
    },
    availabilitySchedule: {
      monday: { type: Boolean, default: false },
      tuesday: { type: Boolean, default: false },
      wednesday: { type: Boolean, default: false },
      thursday: { type: Boolean, default: false },
      friday: { type: Boolean, default: false },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false },
      morning: { type: Boolean, default: false },
      afternoon: { type: Boolean, default: false },
      evening: { type: Boolean, default: false },
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
    isSuspended: { type: Boolean, default: false },
    trustScore: { type: Number, min: 0, max: 100, default: 0 },
    sessionsCompleted: { type: Number, default: 0 },
    hoursLearned: { type: Number, default: 0 },
    hoursTaught: { type: Number, default: 0 },
    learnedSkills: [{ type: String }],
    learningStreak: { type: Number, default: 0 },
    teachingStreak: { type: Number, default: 0 },
    lastSessionDate: { type: Date },
    profileViews: { type: Number, default: 0 },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'members', 'private'], default: 'public' },
      showEmail: { type: Boolean, default: false },
      showCollege: { type: Boolean, default: true },
      showContact: { type: Boolean, default: false },
      showAvailability: { type: Boolean, default: true },
      showPortfolioLinks: { type: Boolean, default: true },
    },
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

userSchema.index({ email: 1 });
userSchema.index({ name: 'text', bio: 'text' });
userSchema.index({ college: 1 });
userSchema.index({ role: 1 });
userSchema.index({ points: -1 });
userSchema.index({ rating: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isTest: 1 });

module.exports = mongoose.model('User', userSchema);

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
const config = require('../config/env');

fs.mkdirSync(config.uploadDir, { recursive: true });
fs.mkdirSync(config.resumeDir, { recursive: true, mode: 0o700 });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, config.uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const fileFilter = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type not allowed. Allowed: ${allowed.join(', ')}`, 400));
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.webp', '.gif']),
});

const uploadResume = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { cb(null, config.resumeDir); },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `resume-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['.pdf', '.docx', '.txt']),
});

module.exports = { uploadImage, uploadResume };

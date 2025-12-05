const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Directory for feed uploads
const FEED_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "feeds");

// Create directory if it doesn't exist
if (!fs.existsSync(FEED_UPLOAD_DIR)) {
  fs.mkdirSync(FEED_UPLOAD_DIR, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, FEED_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// File filter (optional: only images allowed)
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only image files allowed"), false);
  }
  cb(null, true);
};

// Upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
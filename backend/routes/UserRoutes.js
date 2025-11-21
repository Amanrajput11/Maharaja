// routes/bulkUpload.js
const express = require('express');
const router = express.Router();
const { bulkUpload } = require('../controllers/User.controller');
const upload = require('../Helpers/multer');

router.post('/bulk-upload', upload.single('excel'), bulkUpload);

module.exports = router;
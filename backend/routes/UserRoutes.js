const express = require("express");
const router = express.Router();
const multer = require("multer");
const Controller = require("../controllers/User.controller");

const upload = multer({ dest: "uploads/" });

router.post("/excel", upload.single("file"),Controller.bulkUpload);

router.get("/allUsers", Controller.getAllUsers);

router.get("/allFirms", Controller.getAllFirms);

router.get("/firms/:id", Controller.getFirmById);

module.exports = router;
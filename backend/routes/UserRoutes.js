const express = require("express");
const router = express.Router();
const multer = require("multer");
const Controller = require("../controllers/User.controller");

const upload = multer({ dest: "uploads/" });

router.post("/",Controller.create);

router.post("/login",Controller.login);

router.post("/excel", upload.single("file"),Controller.bulkUpload);

router.get("/allUsers", Controller.getAllUsers);

router.get("/allFirms", Controller.getAllFirms);

router.get("/firms/:id", Controller.getFirmById);

router.post("/firms/:firmId/products",upload.array("images", 5), Controller.addProductToFirm);

router.get("/users/:userId/firms", Controller.getFirmsByUserId);

router.post("/firms/addNewUser", Controller.addNewUserToFirm);

router.put("/firms/:firmId/products/:productId",upload.array("images", 5),  Controller.updateProductInFirm);

router.delete("/firms/:firmId/products/:productId",Controller.deleteProductFromFirm);

router.post("/users/:userId/addFirm", Controller.addFirmToUser);

router.post("/addUserWithFirm", Controller.addUserWithFirm);

router.delete("/users/:userId", Controller.deleteUser);

router.delete("/firms/:firmId", Controller.deleteFirm);

router.put("/firms/:firmId", Controller.updateFirmDetails);

router.get("/search/firms", Controller.searchFirms);

module.exports = router;
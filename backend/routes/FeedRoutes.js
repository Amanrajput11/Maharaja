const express = require("express");
const router = express.Router();
const upload = require("../Helpers/feedUpload");
const FeedController = require("../controllers/Feed.controlller");

// CREATE FEED (Admin only)
router.post("/create", upload.array("images", 10), FeedController.createFeed);

// GET ALL FEEDS (Public)
router.get("/", FeedController.getAllFeeds);

// DELETE FEED
router.delete("/:feedId", FeedController.deleteFeed);

module.exports = router;
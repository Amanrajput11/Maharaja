const Feed = require("../models/Feed.model");

module.exports = {
  // ===============================
  // CREATE FEED (Admin Only)
  // ===============================
  createFeed: async (req, res) => {
    try {
      const { title, description } = req.body;
      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const images = req.files ? req.files.map((file) => file.filename) : [];

      const newFeed = await Feed.create({
        title,
        description,
        images,
      });

      // Send socket notification to ALL connected users
      connectedUsers.forEach((socketId) => {
        io.to(socketId).emit("newFeed", {
          feedId: newFeed._id,
          title: newFeed.title,
          description: newFeed.description,
          createdAt: newFeed.createdAt,
        });
      });

      res.status(201).json({
        message: "Feed created successfully",
        feed: newFeed,
      });
    } catch (error) {
      console.error("Error creating feed:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // ===============================
  // GET ALL FEEDS
  // ===============================
  getAllFeeds: async (req, res) => {
    try {
      const feeds = await Feed.find().sort({ createdAt: -1 });
      res.json({ feeds });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },

  // ===============================
  // DELETE FEED (Admin)
  // ===============================
  deleteFeed: async (req, res) => {
    try {
      const { feedId } = req.params;

      const feed = await Feed.findByIdAndDelete(feedId);

      if (!feed) {
        return res.status(404).json({ message: "Feed not found" });
      }

      res.json({ message: "Feed deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },
};

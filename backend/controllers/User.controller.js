const XLSX = require("xlsx");
const User = require("../models/User.model");
const Firm = require("../models/Firm.model");
const fs = require("fs");

module.exports = { 
  bulkUpload: async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File missing" });

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let createdUsers = 0, updatedUsers = 0;
    let createdFirms = 0, updatedFirms = 0;
    let partnerLinks = 0;

    for (let row of rows) {
      let user = await User.findOne({
        $or: [
          { email: row.email?.toString().toLowerCase() },
          { mobile: row.mobile?.toString() }
        ]
      });

      if (!user) {
        user = await User.create({
          name: row.name,
          email: row.email?.toString().toLowerCase(),
          mobile: row.mobile?.toString(),
          passwordHash: "$2b$10$DummyPasswordHash12345678901234567890", // You can modify
        });
        createdUsers++;
      } else {
        user.name = row.name || user.name;
        updatedUsers++;
        await user.save();
      }

      let firm = await Firm.findOne({
        name: row.firmName?.trim()
      });

      if (!firm) {
        firm = await Firm.create({
          name: row.firmName,
          address: row.firmAddress,
          partners: [],
          products: []
        });
        createdFirms++;
      } else {
        firm.address = row.firmAddress || firm.address;
        updatedFirms++;
        await firm.save();
      }

      // 3. LINK USER ↔ FIRM
      const alreadyPartner = firm.partners.includes(user._id);

      if (!alreadyPartner) {
        firm.partners.push(user._id);
        await firm.save();

        user.firms.push(firm._id);
        await user.save();

        partnerLinks++;
      }
    }

    // Remove uploaded file
    fs.unlinkSync(req.file.path);

    return res.json({
      message: "Bulk upload completed",
      stats: {
        createdUsers,
        updatedUsers,
        createdFirms,
        updatedFirms,
        partnerLinks
      }
    });

  } catch (err) {
    console.error("Bulk Upload Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
},
getAllUsers : async (req, res) => {
  try {
    const users = await User.find()
      .populate("firms", "name address gst")  // select fields
      .lean();

    res.json({
      message: "Users fetched successfully",
      data: users
    });

  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},
getAllFirms : async (req, res) => {
  try {
    const firms = await Firm.find()
      .populate("partners", "name email mobile")
      .lean();

    res.json({
      message: "Firms fetched successfully",
      data: firms
    });

  } catch (err) {
    console.error("Get Firms Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},
getFirmById : async (req, res) => {
  try {
    const firm = await Firm.findById(req.params.id)
      .populate("partners", "name email mobile")
      .lean();

    if (!firm) return res.status(404).json({ message: "Firm not found" });

    res.json({
      message: "Firm fetched successfully",
      data: firm
    });

  } catch (err) {
    console.error("Get Firm Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
}
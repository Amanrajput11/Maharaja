const XLSX = require("xlsx");
const User = require("../models/User.model");
const Firm = require("../models/Firm.model");
const fs = require("fs");
const sendEmail = require("../Helpers/sendEmail"); 
const bcrypt = require("bcryptjs");

module.exports = { 
create: async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Generate random password
    const plainPassword = Math.random().toString(36).slice(-8); // 8 chars

    // Hash the password
    const password = await bcrypt.hash(plainPassword, 10);

    // Save user
    const newUser = await User.create({
      name,
      email,
      mobile,
      password,
    });

    // Send password to the user's email
    const subject = "Your Account Credentials";
    const html = `
      <h3>Welcome, ${name}!</h3>
      <p>Your account has been created successfully.</p>
      <p><strong>Login Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${plainPassword}</p>
      <br/>
      <p>Please change your password after login.</p>
    `;

    await sendEmail(email, subject, html);

    res.status(201).json({
      message: "User created successfully & login credentials sent via email",
      user: newUser,
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
},
 login: async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role, 
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
},
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
      .populate("firms", "name address gst")  
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
},
addProductToFirm: async (req, res) => {
  try {
    const { firmId } = req.params;
    const { userId, name, sku, price, description } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID missing" });
    }

    const firm = await Firm.findById(firmId);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found" });
    }

    if (!firm.partners.includes(userId)) {
      return res.status(403).json({
        message: "You are not authorized to add products to this firm",
      });
    }

   
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => file.path);
    }

    const newProduct = {
      name,
      sku,
      price,
      description,
      images: imagePaths,
    };

    firm.products.push(newProduct);
    await firm.save();

    res.json({
      message: "Product added successfully",
      product: newProduct
    });

  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

getFirmsByUserId: async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate({
        path: "firms",
        select: "name address gst partners products",
        populate: {
          path: "partners",
          select: "name email mobile"
        }
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User firms fetched successfully",
      data: {
        userId: user._id,
        userName: user.name,
        email: user.email,
        firms: user.firms
      }
    });

  } catch (err) {
    console.error("Get User Firms Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},
addNewUserToFirm: async (req, res) => {
  try {
    const { firmId, name, email, mobile } = req.body;

    if (!firmId || !name || !email) {
      return res.status(400).json({ message: "firmId, name & email are required" });
    }

    // Find firm
    const firm = await Firm.findById(firmId);
    if (!firm) return res.status(404).json({ message: "Firm not found" });

    const userEmail = email.toLowerCase().trim();

    // Check if user already exists
    let newUser = await User.findOne({ email: userEmail });

    let isExistingUser = true;
    let plainPassword = null;

    if (!newUser) {
      isExistingUser = false;

      // generate password
      plainPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      newUser = await User.create({
        name,
        email: userEmail,
        mobile,
        password: hashedPassword
      });
    }

    // if somehow still undefined
    if (!newUser) {
      return res.status(500).json({ message: "Unexpected error — user not created" });
    }

    // Link User ↔ Firm
    if (!firm.partners.includes(newUser._id)) {
      firm.partners.push(newUser._id);
      await firm.save();
    }

    if (!newUser.firms.includes(firm._id)) {
      newUser.firms.push(firm._id);
      await newUser.save();
    }

    // send email only if user was newly created
    if (!isExistingUser && plainPassword) {
      await sendEmail(
        userEmail,
        "Account Created",
        `
        <h3>Hello ${name},</h3>
        <p>You have been added to a firm.</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Password:</b> ${plainPassword}</p>
        `
      );
    }

    return res.json({
      message: `User ${isExistingUser ? "added to firm" : "created and added to firm"} successfully`,
      data: {
        userId: newUser._id,
        name: newUser.name,
        firmId: firm._id,
        firmName: firm.name
      }
    });

  } catch (err) {
    console.error("Add New User To Firm Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
},





}
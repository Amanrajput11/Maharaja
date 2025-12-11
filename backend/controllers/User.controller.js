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

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const plainPassword = Math.random().toString(36).slice(-8); 

    const password = await bcrypt.hash(plainPassword, 10);

    const newUser = await User.create({
      name,
      email,
      mobile,
      password,
    });

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
      const name = row.name?.toString().trim();
      const email = row.email?.toString().trim().toLowerCase();    
      const dob = row.dob?.toString().trim();
      const bloodgroup = row.bloodgroup?.toString().trim();
      const image = row.image?.toString().trim();
      const mobile = row.mobile?.toString().trim();
      const firmName = row.firmName?.toString().trim();
      const firmAddress = row.firmAddress?.toString().trim();

      if (!name || !mobile || !firmName) {
        console.log("Skipping row due to missing data:", row);
        continue;
      }

      let finalEmail = email && email !== "n/a" ? email : `user_${mobile}@example.com`;

      let user = await User.findOne({
        $or: [
          { email: finalEmail },
          { mobile }
        ]
      });

      if (!user) {
        user = await User.create({
          name,
          email: finalEmail,
          mobile,
          dob,
          bloodgroup,
          profileImage: image,
          password: "123456",           
          role: "user",
          firms: []
        });
        createdUsers++;
      } else {
        user.name = name || user.name;
        user.dob = dob || user.dob;
        user.bloodgroup = bloodgroup || user.bloodgroup;
        user.profileImage = image || user.profileImage;
        updatedUsers++;
        await user.save();
      }

      
      let firm = await Firm.findOne({ name: firmName });

      if (!firm) {
        firm = await Firm.create({
          name: firmName,
          address: firmAddress,
          partners: [],
          products: [],
          categories: []
        });
        createdFirms++;
      } else {
        firm.address = firmAddress || firm.address;
        updatedFirms++;
        await firm.save();
      }

     
      if (!firm.partners.includes(user._id)) {
        firm.partners.push(user._id);
        await firm.save();
        partnerLinks++;
      }

      if (!user.firms.includes(firm._id)) {
        user.firms.push(firm._id);
        await user.save();
      }

    }

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

    const firm = await Firm.findById(firmId);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found" });
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

    const firm = await Firm.findById(firmId);
    if (!firm) return res.status(404).json({ message: "Firm not found" });

    const userEmail = email.toLowerCase().trim();

    let newUser = await User.findOne({ email: userEmail });

    let isExistingUser = true;
    let plainPassword = null;

    if (!newUser) {
      isExistingUser = false;

      plainPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      newUser = await User.create({
        name,
        email: userEmail,
        mobile,
        password: hashedPassword
      });
    }

    if (!newUser) {
      return res.status(500).json({ message: "Unexpected error — user not created" });
    }

    if (!firm.partners.includes(newUser._id)) {
      firm.partners.push(newUser._id);
      await firm.save();
    }

    if (!newUser.firms.includes(firm._id)) {
      newUser.firms.push(firm._id);
      await newUser.save();
    }

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

updateProductInFirm: async (req, res) => {
  try {
    const { firmId, productId } = req.params;
    const { userId, name, sku, price, description } = req.body;

    const firm = await Firm.findById(firmId);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found" });
    }

    const product = firm.products.id(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name) product.name = name;
    if (sku) product.sku = sku;
    if (price) product.price = price;
    if (description) product.description = description;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      product.images.push(...newImages); 
    }

    await firm.save();

    res.json({
      message: "Product updated successfully",
      product,
    });

  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

deleteProductFromFirm: async (req, res) => {
  try {
    const { firmId, productId } = req.params;

    const firm = await Firm.findById(firmId);
    if (!firm) return res.status(404).json({ message: "Firm not found" });

    const product = firm.products.id(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.images.length > 0) {
      product.images.forEach((img) => {
        if (fs.existsSync(img)) fs.unlinkSync(img);
      });
    }

    product.deleteOne();
    await firm.save();

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

updateUserDetails: async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, mobile, role } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (mobile) user.mobile = mobile;
    if (role) user.role = role;

    if (req.file) {
      try {
        if (user.profileImage && fs.existsSync(user.profileImage)) {
          fs.unlinkSync(user.profileImage);
        }
      } catch (err) {
        console.warn("Old profile image deletion failed:", err.message);
      }

      user.profileImage = req.file.path; 
    }

    await user.save();

    res.json({
      message: "User details updated successfully",
      user: {
        _id: user._id,
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage,
      },
    });

  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

addFirmToUser: async (req, res) => {
  try {
    const { userId } = req.params;
    const { firmName, firmAddress, gst, categories = [] } = req.body;

    if (!firmName) return res.status(400).json({ message: "Firm name is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let firm = await Firm.findOne({ name: firmName.trim() });

    if (!firm) {
      // Create new firm with categories
      firm = await Firm.create({
        name: firmName,
        address: firmAddress,
        gst,
        partners: [user._id],
        products: [],
        categories: Array.isArray(categories) ? categories : [],
      });

    } else {
      // Add the user as partner if not already added
      if (!firm.partners.includes(user._id)) {
        firm.partners.push(user._id);
      }

      // Merge new categories (remove duplicates)
      if (Array.isArray(categories) && categories.length > 0) {
        const newCategories = [...new Set([...firm.categories, ...categories])];
        firm.categories = newCategories;
      }

      await firm.save();
    }

    // Add firm to user's list
    if (!user.firms.includes(firm._id)) {
      user.firms.push(firm._id);
      await user.save();
    }

    res.json({
      message: "Firm added to user successfully",
      firm,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        firms: user.firms
      }
    });

  } catch (err) {
    console.error("Add Firm To User Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

addUserWithFirm: async (req, res) => {
  try {
    const { 
      name, 
      email, 
      mobile, 
      role, 
      firmName, 
      firmAddress, 
      gst,
      categories = []         // <-- added here
    } = req.body;

    if (!name || !email || !firmName) {
      return res.status(400).json({ message: "Name, email, and firm name are required" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ message: "User with this email already exists" });

    const plainPassword = Math.random().toString(36).slice(-8);
    const password = await bcrypt.hash(plainPassword, 10);

    user = await User.create({
      name,
      email,
      mobile,
      role: role || 'user',
      password,
      firms: []
    });

    // Create Firm with categories
    const firm = await Firm.create({
      name: firmName,
      address: firmAddress,
      gst,
      partners: [user._id],
      products: [],
      categories: Array.isArray(categories) ? categories : []   // <-- added here
    });

    // Link firm to the user
    user.firms.push(firm._id);
    await user.save();

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
      message: "User and firm created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        firms: [firm]
      },
      plainPassword,
    });

  } catch (err) {
    console.error("Add User With Firm Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

deleteUser: async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Firm.updateMany(
      { partners: user._id },
      { $pull: { partners: user._id } }
    );

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

deleteFirm: async (req, res) => {
  try {
    const { firmId } = req.params;

    const firm = await Firm.findById(firmId);
    if (!firm) return res.status(404).json({ message: "Firm not found" });

    await User.updateMany(
      { firms: firm._id },
      { $pull: { firms: firm._id } }
    );

    await firm.deleteOne();

    res.json({ message: "Firm deleted successfully" });
  } catch (err) {
    console.error("Delete Firm Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

updateFirmDetails: async (req, res) => {
  try {
    const { firmId } = req.params;
    const { name, address, gst, meta } = req.body;

    const firm = await Firm.findById(firmId);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found" });
    }

    if (name) firm.name = name;
    if (address) firm.address = address;
    if (gst) firm.gst = gst;
    if (meta) firm.meta = meta;

    await firm.save();

    return res.status(200).json({
      message: "Firm details updated successfully",
      firm,
    });
  } catch (error) {
    console.error("Update Firm Error:", error);
    return res.status(500).json({ message: "Server Error", error });
  }
},

searchFirms : async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(q, "i"); 

    const firms = await Firm.find({
      $or: [
        { name: regex },
        { gst: regex },
        { address: regex }
      ]
    }).select("name gst address products")
     .populate("partners", "name email");;

    res.json({ total: firms.length, firms });
  } catch (error) {
    console.error("Search Firm Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
},

updatePasswordUsingOld: async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old and new password are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    await user.save();

    res.json({
      message: "Password updated successfully",
    });

  } catch (err) {
    console.error("Update Password (old) Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
},

sendOtp: async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    const subject = "Your Password Reset OTP";
    const html = `
      <h3>Hello ${user.name},</h3>
      <p>Your OTP to reset password is:</p>
      <h2>${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
    `;

    await sendEmail(email, subject, html);

    res.json({ message: "OTP sent to email" });

  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

verifyOtp: async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || !user.otpExpires)
      return res.status(400).json({ message: "OTP not requested" });

    if (user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    const plainPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    user.password = hashedPassword;

    user.otp = null;
    user.otpExpires = null;

    await user.save();

    const subject = "Your New Password";
    const html = `
      <h3>Hello ${user.name},</h3>
      <p>Your password has been reset successfully.</p>
      <p><strong>New Password:</strong> ${plainPassword}</p>
      <p>Please log in with this password and change it immediately for security.</p>
    `;

    await sendEmail(user.email, subject, html);

    res.json({ message: "OTP verified. New password sent to your email." });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

getTodaysBirthdays: async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    const users = await User.find({
      dob: { $exists: true }
    });

    const todaysBirthdays = users.filter(u => {
      const dob = new Date(u.dob);
      return dob.getDate() === day && (dob.getMonth() + 1) === month;
    });

    res.json({
      count: todaysBirthdays.length,
      users: todaysBirthdays,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
},

updateUserDetails: async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, mobile, role } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (mobile) user.mobile = mobile;
    if (role) user.role = role;

    if (req.file) {
      try {
        if (user.profileImage && fs.existsSync(user.profileImage)) {
          fs.unlinkSync(user.profileImage); 
        }
      } catch (err) {
        console.warn("Old profile image deletion failed:", err.message);
      }

      user.profileImage = req.file.path; 
    }

    await user.save();

    res.json({
      message: "User details updated successfully",
      user: {
        _id: user._id,
        id: user._id.toString(), 
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage,
      },
    });

  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
},
}
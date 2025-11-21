// controllers/bulkUploadController.js
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const generatePassword = require('../Helpers/generatePassword');
const sendWelcomeEmail = require('../Helpers/sendEmail');

const bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const usersSheet = workbook.Sheets['Users'];
    const firmsSheet = workbook.Sheets['Firms'];

    if (!usersSheet || !firmsSheet) {
      return res.status(400).json({ error: 'Excel must contain sheets named "Users" and "Firms"' });
    }

    const usersData = XLSX.utils.sheet_to_json(usersSheet);
    const firmsData = XLSX.utils.sheet_to_json(firmsSheet);

    const result = { users: 0, firms: 0, errors: [], passwords: [] };

    // Step 1: Create/Update Firms
    for (const f of firmsData) {
      const mobile = f.firm_mobile?.toString().trim();
      if (!mobile) continue;

      await Firm.updateOne(
        { mobile },
        { $set: {
          firm_name: f.firm_name?.trim(),
          email: f.email?.trim() || '',
          address: f.address?.trim() || '',
          city: f.city?.trim() || ''
        }},
        { upsert: true }
      );
      result.firms++;
    }

    // Step 2: Create/Update Users + Link Firms
    for (const row of usersData) {
      const mobile = row.mobile?.toString().trim();
      const name = row.full_name?.trim();
      if (!mobile || !name) {
        result.errors.push(`Invalid row: ${JSON.stringify(row)}`);
        continue;
      }

      const firmMobiles = row.firm_mobile_list
        ?.toString().split(',').map(m => m.trim()).filter(Boolean) || [];

      const firmNames = row.firm_names
        ?.toString().split(',').map(n => n.trim()) || [];

      const isOwnerArr = row.is_owner_list
        ?.toString().split(',').map(o => o.trim() === 'true') || [];

      const joinedDates = row.joined_dates
        ?.toString().split(',').map(d => d.trim()) || [];

      const userFirms = [];
      const partnerBulkOps = [];

      for (let i = 0; i < firmMobiles.length; i++) {
        const fm = firmMobiles[i];
        const firm = await Firm.findOne({ mobile: fm });

        if (firm) {
          userFirms.push({
            firm_mobile: fm,
            firm_name: firmNames[i] || firm.firm_name,
            address: firm.address,
            city: firm.city,
            email: firm.email,
            is_owner: isOwnerArr[i] || false,
            joined_date: joinedDates[i] ? new Date(joinedDates[i]) : new Date()
          });

          partnerBulkOps.push({
            updateOne: {
              filter: { mobile: fm },
              update: { $push: {
                partners: {
                  user_mobile: mobile,
                  full_name: name,
                  email: row.email || '',
                  blood_group: row.blood_group || '',
                  is_owner: isOwnerArr[i] || false,
                  share_percentage: isOwnerArr[i] ? 50 : 0,
                  joined_date: joinedDates[i] ? new Date(joinedDates[i]) : new Date()
                }
              }}
            }
          });
        }
      }

      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      await User.updateOne(
        { mobile },
        { $set: {
          full_name: name,
          email: row.email?.trim() || '',
          password: hashedPassword,
          address: row.address?.trim() || '',
          city: row.city?.trim() || '',
          blood_group: row.blood_group?.trim() || '',
          mobile,
          firms: userFirms
        }},
        { upsert: true }
      );

      result.users++;
      result.passwords.push({ name, mobile, password: plainPassword });

      // Send email if email exists
      if (row.email?.trim()) {
        sendWelcomeEmail(row.email.trim(), name, mobile, plainPassword);
      }

      // Update firms with partner info
      if (partnerBulkOps.length > 0) {
        await Firm.bulkWrite(partnerBulkOps);
      }
    }

    res.json({
      success: true,
      message: 'Bulk upload completed!',
      summary: {
        users_added: result.users,
        firms_added_or_updated: result.firms,
        passwords_generated: result.passwords
      },
      passwords: result.passwords  // You can remove this in production
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { bulkUpload };
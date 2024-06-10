// backend/routes/authRoutes.js
const express = require('express');
const admin = require('../firebase');

const router = express.Router();

// Route for generating and sending OTP
router.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Send OTP using Firebase Authentication
    const verificationResult = await admin.auth().createUser({
      phoneNumber: phoneNumber,
    });

    // Handle successful sending of OTP
    res.status(200).json({ success: true, verificationId: verificationResult.uid });
  } catch (error) {
    // Handle error
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route for verifying OTP
router.post('/verify-otp', async (req, res) => {
  const { verificationId, code } = req.body;

  try {
    // Verify OTP using Firebase Authentication
    const userCredential = await admin.auth().verifyIdToken(code);

    // Handle successful verification
    res.status(200).json({ success: true, user: userCredential });
  } catch (error) {
    // Handle error
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

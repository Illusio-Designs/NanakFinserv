// backend/routes/userRoutes.js
const { Router } = require('express');
const User = require('../models/User');

const router = Router();

// Route to register a new user
router.post('/register', async (req, res) => {
  const { name, phone_number, email, role } = req.body;
  try {
    const newUser = await User.create({ name, phone_number, email, role });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get all users
router.get('/users', async (req, res) => {
  console.log('GET /api/users hit');  // Add this line
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const { Router } = require('express');
const User = require('../models/User');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Ensure JSON parsing middleware is in place

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
router.get('/', async (req, res) => {
  console.log('GET /api/users hit');
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route to update a user
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone_number, email, role } = req.body;
  try {
    const [updated] = await User.update(
      { name, phone_number, email, role },
      { where: { id } }
    );

    if (updated) {
      const updatedUser = await User.findOne({ where: { id } });
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

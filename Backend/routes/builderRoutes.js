// backend/routes/builderRoutes.js
const { Router } = require('express');
const Builder = require('../models/Builder');

const router = Router();

// Create a new builder
router.post('/register', async (req, res) => {
  const { person_name, builder_name, number, email } = req.body;
  try {
    const newBuilder = await Builder.create({ person_name, builder_name, number, email });
    res.status(201).json(newBuilder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all builders
router.get('/', async (req, res) => {
  try {
    const builders = await Builder.findAll();
    res.status(200).json(builders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a builder by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const builder = await Builder.findByPk(id);
    if (!builder) {
      return res.status(404).json({ message: 'Builder not found' });
    }
    res.status(200).json(builder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a builder
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { person_name, builder_name, number, email } = req.body;
  try {
    const builder = await Builder.findByPk(id);
    if (!builder) {
      return res.status(404).json({ message: 'Builder not found' });
    }
    builder.person_name = person_name;
    builder.builder_name = builder_name;
    builder.number = number;
    builder.email = email;
    await builder.save();
    res.status(200).json(builder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;

// backend/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.ENUM('Superadmin', 'LMS', 'Loan', 'Mediclaim', 'Vehicle Insurance', 'Life Insurance'),
    allowNull: false,
  },
}, {
  timestamps: false,  // Disable default timestamps
});

module.exports = User;

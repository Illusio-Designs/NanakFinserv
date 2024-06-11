// backend/models/Builder.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path according to your project structure

class Builder extends Model {}

Builder.init({
  person_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  builder_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  }
}, {
  sequelize,
  modelName: 'Builder'
});

module.exports = Builder;

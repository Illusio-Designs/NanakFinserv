const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const BuilderConsumer = sequelize.define(
    "builderconsumer",
    {
      builderConsumerId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      role_id: {
        type: Sequelize.INTEGER,
      },
      unit_id: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      sqFeet: {
        type: Sequelize.TEXT,
      },
      srNo: {
        type: Sequelize.TEXT,
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      builder_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      office_no: {
        type: Sequelize.STRING(100),
      },
      category_id: {
        type: Sequelize.INTEGER,
      },
      wing_id: {
        type: Sequelize.INTEGER, // e.g., "A", "B", etc.
        allowNull: false,
      },
      floor_id: {
        type: Sequelize.INTEGER, // Floor number
        allowNull: false,
      },
    },
    {
      tableName: "builderconsumer",
    }
  );

  return BuilderConsumer;
};

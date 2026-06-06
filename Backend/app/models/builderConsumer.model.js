const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const BuilderConsumer = sequelize.define(
    "builderconsumer",
    {
      builderConsumerId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      role_id: {
        type: Sequelize.UUID,
      },
      unit_id: {
        type: Sequelize.UUID,
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
        type: Sequelize.UUID,
        allowNull: false,
      },
      office_no: {
        type: Sequelize.STRING(100),
      },
      category_id: {
        type: Sequelize.UUID,
      },
      wing_id: {
        type: Sequelize.UUID, // e.g., "A", "B", etc.
        allowNull: false,
      },
      floor_id: {
        type: Sequelize.UUID, // Floor number
        allowNull: false,
      },
    },
    {
      tableName: "builderconsumer",
    }
  );

  return BuilderConsumer;
};

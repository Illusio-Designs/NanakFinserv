const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const UnitCategoryDetail = sequelize.define(
    "unitcategorydetail",
    {
      unit_category_detail_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      unit_category_id: {
        type: Sequelize.UUID,
      },
      count: {
        type: Sequelize.INTEGER,
      },
      unit_id: {
        type: Sequelize.UUID,
      },
      floorCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalCount: {
        type: Sequelize.INTEGER,
        defaultValue:0
      },
      wingCount: {
        type: Sequelize.INTEGER,
        defaultValue:0
      }
    },
    {
      tableName: "unitcategorydetail",
      // timestamps: false
    }
  );

  return UnitCategoryDetail;
};

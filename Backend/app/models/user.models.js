module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('user', {
    user_id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    username: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    email: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    mobileNumber: {
      type: Sequelize.STRING(15),
      allowNull: false
    },
    referenceName: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    otp: {
      type: Sequelize.STRING(6),
      allowNull: true
    },
    token: {
      type: Sequelize.STRING,
      allowNull: true
    },
    role_id: {
      type: Sequelize.UUID,
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    builder_user: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    is_from_builder_user: {
      type: Sequelize.BOOLEAN,
      default:0,
      allowNull: true,
    },
  }, {
    tableName: 'user',
    // timestamps: false
  });

  return User;
};
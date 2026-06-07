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
    // Household linkage: a family member points at the primary consumer (head).
    // NULL means this user is itself a head / standalone consumer.
    family_head_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
  }, {
    tableName: 'user',
    // timestamps: false
  });

  return User;
};
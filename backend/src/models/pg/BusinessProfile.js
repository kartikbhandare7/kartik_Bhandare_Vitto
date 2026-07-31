const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/postgres');

const BusinessProfile = sequelize.define('BusinessProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ownerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  pan: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    },
  },
  businessType: {
    type: DataTypes.ENUM('retail', 'manufacturing', 'services', 'other'),
    allowNull: false,
  },
  monthlyRevenue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
}, {
  tableName: 'business_profiles',
  timestamps: true,
});

module.exports = BusinessProfile;
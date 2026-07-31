const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/postgres');
const BusinessProfile = require('./BusinessProfile');

const LoanApplication = sequelize.define('LoanApplication', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  tenureMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'decided'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'loan_applications',
  timestamps: true,
});

// This links LoanApplication to BusinessProfile
BusinessProfile.hasMany(LoanApplication, { foreignKey: 'profileId', as: 'applications' });
LoanApplication.belongsTo(BusinessProfile, { foreignKey: 'profileId', as: 'profile' });

module.exports = LoanApplication;
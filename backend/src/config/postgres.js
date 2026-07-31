const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DB || 'msme_lending',
  username: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: false,
});

const connectPostgres = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('✅ PostgreSQL connected');
};

module.exports = { sequelize, connectPostgres };
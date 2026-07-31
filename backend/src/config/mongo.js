const mongoose = require('mongoose');

const connectMongo = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/msme_lending';
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
};

module.exports = { connectMongo };
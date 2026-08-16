const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  const conn = await mongoose.connect(config.mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 8000,
  });
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;

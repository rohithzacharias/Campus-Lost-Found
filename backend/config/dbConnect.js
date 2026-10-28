const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function connectDb() {
  const uri = process.env.MONGODB_URI || process.env.DB_URL;
  if (!uri) {
    console.error('CRITICAL: Neither MONGODB_URI nor DB_URL is defined in environment variables.');
    return false;
  }

  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host} / database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    return false;
  }
}

module.exports = connectDb;

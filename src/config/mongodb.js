/**
 * MongoDB Database Connection
 * 
 * This module handles the connection to MongoDB database.
 * Using Mongoose for schema modeling and validation.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_portal';

// Mongoose connection options
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('✓ MongoDB connected successfully');
    console.log(`  Database: ${mongoose.connection.name}`);
    console.log(`  Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

module.exports = {
  connectMongoDB,
  closeConnection,
  mongoose
};

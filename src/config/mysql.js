/**
 * MySQL Database Connection
 * 
 * This module handles the connection pool for MySQL database.
 * Using connection pooling for better performance and resource management.
 */

const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'student_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Get promise-based pool
const promisePool = pool.promise();

// Test connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✓ MySQL connected successfully');
    console.log(`  Database: ${process.env.MYSQL_DATABASE}`);
    console.log(`  Host: ${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ MySQL connection failed:', error.message);
    throw error;
  }
};

// Execute query helper
const executeQuery = async (sql, params = []) => {
  try {
    const [rows] = await promisePool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('MySQL Query Error:', error.message);
    throw error;
  }
};

// Transaction helper
const executeTransaction = async (callback) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await pool.end();
    console.log('MySQL connection pool closed');
  } catch (error) {
    console.error('Error closing MySQL connection:', error.message);
  }
};

module.exports = {
  pool: promisePool,
  testConnection,
  executeQuery,
  executeTransaction,
  closeConnection
};

/**
 * Database Initialization Script
 * 
 * This script initializes both MySQL and MongoDB connections
 * and optionally seeds initial data.
 */

const { testConnection: testMySQL } = require('../config/mysql');
const { connectMongoDB } = require('../config/mongodb');

const initializeDatabases = async () => {
  console.log('\n========================================');
  console.log('Initializing Database Connections...');
  console.log('========================================\n');
  
  try {
    // Test MySQL connection
    await testMySQL();
    
    // Connect to MongoDB
    await connectMongoDB();
    
    console.log('\n========================================');
    console.log('✓ All database connections successful!');
    console.log('========================================\n');
    
    return true;
  } catch (error) {
    console.error('\n========================================');
    console.error('✗ Database initialization failed!');
    console.error('========================================\n');
    console.error('Error:', error.message);
    return false;
  }
};

// Run if executed directly
if (require.main === module) {
  initializeDatabases()
    .then((success) => {
      if (success) {
        console.log('You can now start the server with: npm start');
        process.exit(0);
      } else {
        console.error('Please check your database configuration in .env file');
        process.exit(1);
      }
    });
}

module.exports = { initializeDatabases };

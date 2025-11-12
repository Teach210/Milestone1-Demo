import 'dotenv/config';
import mysql from 'mysql2';

// Create the connection
// Fallback to 'mydatabase' when DB_DATABASE is not provided so tables are created in the expected schema.
const DB_NAME = process.env.DB_DATABASE || 'mydatabase';
const connection = mysql.createConnection({
  host: process.env.DB_HOST,        //'127.0.0.1'
  user: process.env.DB_USER,        //'root'
  password: process.env.DB_PASSWORD,// ''
  database: DB_NAME
});

// Connect and handle errors 
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database');
    console.log(`Using database: ${DB_NAME}`);
  }
});

// runtime errors
connection.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Connection lost. Attempting to reconnect...');
    
  }
});

export { connection }; 


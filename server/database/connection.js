import 'dotenv/config';
import mysql from 'mysql2';

// Create the connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,        //'127.0.0.1'
  user: process.env.DB_USER,        //'root'
  password: process.env.DB_PASSWORD,// ''
  database: process.env.DB_DATABASE //'mydatabase'
});

// Connect and handle errors 
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database');
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

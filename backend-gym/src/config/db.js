import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

// Create a **Promise Pool directly**
export const pool = mysql
  .createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "gym_db",
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise(); // 🔥 THIS MAKES pool.query() RETURN A PROMISE

// Test MySQL connection
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ MySQL connected successfully!");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
  });

// // live database
// import mysql from "mysql2";
// import dotenv from "dotenv";
// dotenv.config();

// // Create a **Promise Pool directly**
// export const pool = mysql
//   .createPool({
//     host: "switchback.proxy.rlwy.net",
//     user: "root",
//     password: "LYEPuGdFNazTUxSFwrZilcKIAOlztDYo",
//     database: "railway",
//     port: 35602,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0,
//   })
//   .promise(); // 🔥 THIS MAKES pool.query() RETURN A PROMISE

// // Test MySQL connection
// pool
//   .getConnection()
//   .then((connection) => {
//     console.log("✅ MySQL connected successfully!");
//     connection.release();
//   })
//   .catch((err) => {
//     console.error("❌ MySQL connection failed:", err.message);
//   });

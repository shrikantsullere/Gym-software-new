import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gym_management",
});

async function run() {
  const [rows] = await pool.query(`SELECT id, fullName, roleId, adminId FROM user WHERE roleId IN (2,3,4,5,10) LIMIT 5`);
  console.log("Users:", JSON.stringify(rows, null, 2));
  pool.end();
}
run();

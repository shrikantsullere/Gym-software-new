import { pool } from '../backend-gym/src/config/db.js';

async function checkSchema() {
  try {
    const [tasks] = await pool.query('DESCRIBE tasks');
    console.log('--- TASKS TABLE ---');
    console.table(tasks);

    const [shifts] = await pool.query('DESCRIBE shifts');
    console.log('--- SHIFTS TABLE ---');
    console.table(shifts);

    // Any other relevant tables? maybe staffAttendance
    const [att] = await pool.query('DESCRIBE StaffAttendance');
    console.log('--- STAFF ATTENDANCE TABLE ---');
    console.table(att);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkSchema();

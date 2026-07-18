import app from "./app.js";
import { ENV } from "./config/env.js";
import "./modules/alert/alert.corn.js";
import "./modules/notifications/notif.corn.js";
import { initTrialCronJobs } from "./cron/trial.cron.js";

import { pool } from "./config/db.js";

// Initialize scheduled tasks
initTrialCronJobs();

(async () => {
  try {
    await pool.query(`ALTER TABLE user 
      ADD COLUMN trialStartDate DATETIME DEFAULT NULL,
      ADD COLUMN trialEndDate DATETIME DEFAULT NULL,
      ADD COLUMN trialStatus ENUM('Active', 'Expired', 'Converted', 'None') DEFAULT 'None',
      ADD COLUMN gracePeriodEndDate DATETIME DEFAULT NULL;
    `);
    console.log("Trial columns added to user table successfully.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Trial columns already exist in user table.");
    } else {
      console.error("Failed to add trial columns:", e.message);
    }
  }

  app.listen(ENV.port, () => {
    console.log(`Server running on http://localhost:${ENV.port}`);
  });
})();
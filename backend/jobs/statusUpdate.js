// backend/src/jobs/statusUpdate.js
import cron from 'node-cron';
import { updateAllEmployeeStatuses } from '../controllers/leave.controller.js';  // ✅ Changed to leave.controller.js

// Run daily at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  try {
    const updated = await updateAllEmployeeStatuses();
  } catch (error) {
    console.error('❌ Daily employee status update failed:', error);
  }
});


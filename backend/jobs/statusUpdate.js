// backend/src/jobs/statusUpdate.js
import cron from 'node-cron';
import { updateAllEmployeeStatuses } from '../controllers/leave.controller.js';  // ✅ Changed to leave.controller.js

// Run daily at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Running daily employee status update...');
  console.log(`📅 ${new Date().toLocaleString()}`);
  try {
    const updated = await updateAllEmployeeStatuses();
    console.log(`✅ Daily employee status update completed. Updated ${updated} employees.`);
  } catch (error) {
    console.error('❌ Daily employee status update failed:', error);
  }
});

console.log('📅 Daily employee status update scheduler started (runs at midnight)');
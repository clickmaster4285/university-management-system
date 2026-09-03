import cron from 'node-cron';
import { updateAllStaffStatusesFromLeave } from '../utils/staffStatusUtils.js';

cron.schedule('0 0 * * *', async () => {
  try {
    const updated = await updateAllStaffStatusesFromLeave();
    if (updated > 0) {
      console.info(`✅ Updated ${updated} staff status(es) from leave records`);
    }
  } catch (error) {
    console.error('❌ Daily staff status update failed:', error);
  }
});

const cron = require('node-cron');
const { connectToDatabase } = require('../models/db');
const logger = require('../logger');

/**
 * Monthly Reset Cron Job
 * Runs at 00:01 AM on the 1st day of every month
 * Resets monthlyRequestCount to 0 for all users
 */
function startMonthlyResetCron() {
  // Schedule: minute hour day month day-of-week
  // '1 0 1 * *' = At 00:01 on the 1st day of every month
  cron.schedule('1 0 1 * *', async () => {
    try {
      logger.info('Starting monthly request count reset...');
      
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      
      // Get current date for logging
      const resetDate = new Date();
      
      // Reset monthly request count for all users
      const result = await usersCollection.updateMany(
        {}, // All users
        { 
          $set: { 
            monthlyRequestCount: 0,
            lastMonthlyReset: resetDate
          }
        }
      );
      
      logger.info(`Monthly reset completed: ${result.modifiedCount} users updated`, {
        resetDate: resetDate.toISOString(),
        modifiedCount: result.modifiedCount
      });
      
    } catch (error) {
      logger.error('Error during monthly reset:', error.message, error.stack);
    }
  });
  
  logger.info('Monthly reset cron job scheduled: Runs at 00:01 on the 1st of every month');
}

/**
 * Test function to manually trigger monthly reset
 * USE ONLY FOR TESTING - Do not expose this in production API
 */
async function manualMonthlyReset() {
  try {
    logger.info('Manual monthly reset triggered...');
    
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const resetDate = new Date();
    
    const result = await usersCollection.updateMany(
      {},
      { 
        $set: { 
          monthlyRequestCount: 0,
          lastMonthlyReset: resetDate
        }
      }
    );
    
    logger.info(`Manual reset completed: ${result.modifiedCount} users updated`);
    return { 
      success: true, 
      modifiedCount: result.modifiedCount,
      resetDate: resetDate.toISOString()
    };
    
  } catch (error) {
    logger.error('Error during manual reset:', error.message, error.stack);
    throw error;
  }
}

module.exports = {
  startMonthlyResetCron,
  manualMonthlyReset
};

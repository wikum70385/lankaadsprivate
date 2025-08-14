// Cron job to clean up inactive private chats every 10 minutes
const { deleteInactivePrivateChats } = require('./chat_cleanup');
const privateSession = require('./private_chat_session');

async function cleanupJob() {
  // Delete all private chats inactive for 4+ hours
  await deleteInactivePrivateChats();
  // Remove from session tracker as well
  const inactive = privateSession.getInactivePrivateSessions(4);
  for (const [userA, userB] of inactive) {
    privateSession.removePrivateSession(userA, userB);
  }
  console.log('[CRON] Cleaned up inactive private chats');
}

module.exports = cleanupJob;

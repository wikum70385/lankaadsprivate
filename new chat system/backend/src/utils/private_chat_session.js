// Tracks active private chat sessions and handles session cleanup
definePrivateSessionKey = (userA, userB) => {
  return [userA, userB].sort().join(':');
};

const activePrivateSessions = new Map(); // key: userA:userB, value: { users: Set, lastActive: Date }

function userJoinedPrivateSession(userA, userB, userId) {
  const key = definePrivateSessionKey(userA, userB);
  if (!activePrivateSessions.has(key)) {
    activePrivateSessions.set(key, { users: new Set(), lastActive: new Date() });
  }
  const session = activePrivateSessions.get(key);
  session.users.add(userId);
  session.lastActive = new Date();
}

function userLeftPrivateSession(userA, userB, userId) {
  const key = definePrivateSessionKey(userA, userB);
  if (!activePrivateSessions.has(key)) return;
  const session = activePrivateSessions.get(key);
  session.users.delete(userId);
  session.lastActive = new Date();
  // If both users left, return true to trigger deletion
  return session.users.size === 0;
}

function updatePrivateSessionActivity(userA, userB) {
  const key = definePrivateSessionKey(userA, userB);
  if (activePrivateSessions.has(key)) {
    activePrivateSessions.get(key).lastActive = new Date();
  }
}

function getInactivePrivateSessions(hours = 4) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return Array.from(activePrivateSessions.entries())
    .filter(([_, session]) => session.lastActive < cutoff)
    .map(([key]) => key.split(':'));
}

function removePrivateSession(userA, userB) {
  const key = definePrivateSessionKey(userA, userB);
  activePrivateSessions.delete(key);
}

module.exports = {
  userJoinedPrivateSession,
  userLeftPrivateSession,
  updatePrivateSessionActivity,
  getInactivePrivateSessions,
  removePrivateSession
};

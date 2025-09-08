const concurrently = require('concurrently');

concurrently([
  { 
    command: 'cd backend && npm run dev',
    name: 'main-backend',
    prefixColor: 'blue'
  },
  { 
    command: 'cd backend_chat && npm run dev',
    name: 'chat-backend',
    prefixColor: 'green'
  },
  { 
    command: 'npm run dev',
    name: 'frontend',
    prefixColor: 'yellow'
  }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 3,
}).then(
  () => process.exit(0),
  () => process.exit(1)
); 
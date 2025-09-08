# Start the Ad System backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend_ad; npm run dev"

# Start the Ad System frontend (main Next.js app)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Start the New Chat System backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'new chat system/backend'; npm run dev"

# Start the New Chat System frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'new chat system/frontend'; npm run dev"
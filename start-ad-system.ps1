# Start the main backend (ad system)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend_ad; npm run dev"

# Start the frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" 
#!/bin/bash

# =========================================
# LankaAds Production Setup Script (Step 1)
# =========================================
# This script automates deployment of the LankaAds project on a fresh Ubuntu VPS.
# It will prompt for all required secrets and configuration.
#
# Run as root or with sudo: bash setup_production.sh
# =========================================

set -e

# --- User Prompts ---
echo "\n==== LankaAds Production Setup ===="
read -p "Enter your domain (e.g. lankaadsprivate.com): " DOMAIN
read -p "Enter PostgreSQL DB username [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}
read -p "Enter PostgreSQL DB password: " DB_PASSWORD
read -p "Enter PostgreSQL DB host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}
read -p "Enter PostgreSQL DB port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Database names
read -p "Enter Ad backend DB name [lankaads]: " DB_AD_NAME
DB_AD_NAME=${DB_AD_NAME:-lankaads}
read -p "Enter Chat backend DB name [lanka_ads_chat]: " DB_CHAT_NAME
DB_CHAT_NAME=${DB_CHAT_NAME:-lanka_ads_chat}

# JWT and NextAuth secrets
echo "Leave blank to auto-generate a strong secret."
read -p "Enter JWT_SECRET for Ad backend: " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "Generated JWT_SECRET: $JWT_SECRET"
fi
read -p "Enter JWT_SECRET for Chat backend: " JWT_CHAT_SECRET
if [ -z "$JWT_CHAT_SECRET" ]; then
  JWT_CHAT_SECRET=$(openssl rand -hex 32)
  echo "Generated JWT_SECRET for Chat: $JWT_CHAT_SECRET"
fi
read -p "Enter NEXTAUTH_SECRET for main frontend: " NEXTAUTH_SECRET
if [ -z "$NEXTAUTH_SECRET" ]; then
  NEXTAUTH_SECRET=$(openssl rand -hex 32)
  echo "Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
fi

# --- Confirm Settings ---
echo "\n===== Confirmed Settings ====="
echo "Domain: $DOMAIN"
echo "Ad Backend DB: $DB_AD_NAME"
echo "Chat Backend DB: $DB_CHAT_NAME"
echo "DB User: $DB_USER"
echo "DB Host: $DB_HOST"
echo "DB Port: $DB_PORT"
echo "JWT_SECRET (Ad): $JWT_SECRET"
echo "JWT_SECRET (Chat): $JWT_CHAT_SECRET"
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "==============================\n"
read -p "Proceed with these settings? [y/N]: " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
  echo "Aborting setup."
  exit 1
fi

# --- Generate .env files for all services ---
echo "Generating .env files..."

# Ad Backend .env
env_ad_path="backend_ad/.env"
cat > "$env_ad_path" <<EOF
# Database Configuration
DB_USER=$DB_USER
DB_HOST=$DB_HOST
DB_NAME=$DB_AD_NAME
DB_PASSWORD=$DB_PASSWORD
DB_PORT=$DB_PORT

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_AD_NAME
EOF
echo "Wrote $env_ad_path"

# Chat Backend .env
env_chat_path="new chat system/backend/.env"
cat > "$env_chat_path" <<EOF
PORT=5000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_CHAT_NAME
JWT_SECRET=$JWT_CHAT_SECRET
CORS_ORIGIN=https://$DOMAIN/chat
NODE_ENV=production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
EOF
echo "Wrote $env_chat_path"

# Main Frontend .env.local
env_frontend_path=".env.local"
cat > "$env_frontend_path" <<EOF
# API URLs
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_CHAT_API_URL=https://$DOMAIN/chat
NEXT_PUBLIC_AD_BACKEND_URL=https://$DOMAIN/api
NEXT_PUBLIC_CHAT_BACKEND_URL=https://$DOMAIN/chat
NEXT_PUBLIC_CHAT_WS_URL=wss://$DOMAIN/chat

# Authentication
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Other configurations
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
EOF
echo "Wrote $env_frontend_path"

# --- Replace hardcoded URLs in codebase ---
echo "Replacing hardcoded URLs in source files..."

# Define replacements as (search, replace) pairs
REPLACEMENTS=(
  # Chat backend and frontend
  'http://localhost:5000=https://'$DOMAIN'/chat'
  'ws://localhost:5000=wss://'$DOMAIN'/chat'
  'http://localhost:8080=https://'$DOMAIN'/chat'
  # Ad backend
  'http://localhost:3001/api=https://'$DOMAIN'/api'
  # Chat backend for main frontend
  'http://localhost:3002=https://'$DOMAIN'/chat'
  'ws://localhost:3002=wss://'$DOMAIN'/chat'
  # Main frontend
  'http://localhost:3000=https://'$DOMAIN
)

# Find all relevant source files to update
CODE_PATHS=(
  "new chat system/frontend/src/services/socket.ts"
  "new chat system/frontend/src/services/api.ts"
  "components/CtaBanner.tsx"
  "app/intro/page.tsx"
  "app/page.tsx"
  "lib/api/ad-client.ts"
  "app/api/ads/route.ts"
  "app/api/ads/[id]/route.ts"
)

for file in "${CODE_PATHS[@]}"; do
  if [ -f "$file" ]; then
    for pair in "${REPLACEMENTS[@]}"; do
      SEARCH="${pair%%=*}"
      REPLACE="${pair#*=}"
      sed -i "s|$SEARCH|$REPLACE|g" "$file"
    done
    echo "Updated URLs in $file"
  fi
  # If file not found, skip
done

echo "URL replacement complete."

# --- Install dependencies and build all services ---
echo "\nInstalling dependencies and building all services..."

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm
fi

# Main frontend (Next.js)
cd "$(dirname "$0")"
pnpm install
pnpm build

# Ad backend
cd backend_ad
pnpm install
cd ..

# Chat backend
cd "new chat system/backend"
pnpm install
cd ../../..

# Chat frontend
cd "new chat system/frontend"
pnpm install
pnpm build
cd ../../..

echo "Dependency installation and build complete."

# --- Initialize Databases ---
echo "\nInitializing databases..."

# Ad backend DB (Node.js script)
cd backend_ad
pnpm run init-db || node src/config/init-db.js
cd ..

# Chat backend DB (SQL import)
cd "new chat system/backend"
psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_CHAT_NAME" -f database_setup.sql
cd ../../..

echo "Database initialization complete."

# --- Set up PM2 process manager ---
echo "\nSetting up PM2 for all services..."

if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

pm2 start backend_ad/src/index.js --name lankaads-ad-backend
pm2 start "new chat system/backend/src/server.js" --name lankaads-chat-backend
pm2 start "pnpm --dir new chat system/frontend start" --name lankaads-chat-frontend
pm2 start "pnpm start" --name lankaads-main-frontend
pm2 save

# --- Nginx Configuration ---
echo "\nConfiguring Nginx..."

NGINX_CONF_PATH="/etc/nginx/sites-available/$DOMAIN"
NGINX_CONF_LINK="/etc/nginx/sites-enabled/$DOMAIN"

sudo tee "$NGINX_CONF_PATH" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /chat/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf "$NGINX_CONF_PATH" "$NGINX_CONF_LINK"
sudo nginx -t && sudo systemctl reload nginx

echo "Nginx configuration complete."

# --- SSL Certificate with Certbot ---
echo "\nObtaining SSL certificate with Certbot..."
if ! command -v certbot &> /dev/null; then
  sudo apt update && sudo apt install -y certbot python3-certbot-nginx
fi
sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m admin@$DOMAIN --redirect

echo "SSL certificate installation complete."

# --- Final Summary ---
echo "\n========================================="
echo "LankaAds Production Deployment Complete!"
echo "========================================="
echo "- Main site: https://$DOMAIN"
echo "- Chat:      https://$DOMAIN/chat"
echo "- API:       https://$DOMAIN/api"
echo "- All services are managed by PM2."
echo "- Nginx is set up as a reverse proxy with SSL."
echo "- To manage services: pm2 status | pm2 logs | pm2 restart <name>"
echo "- To renew SSL: sudo certbot renew"
echo "========================================="

# Secure Server & Reverse Proxy Setup for Production

This guide will help you deploy your app securely on a VPS with a custom domain, using Nginx as a reverse proxy. This approach applies security enhancements **without touching your app code**.

---

## 1. Nginx Reverse Proxy Configuration

**Create or edit your Nginx config (e.g., `/etc/nginx/sites-available/yourdomain.com`):**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer-when-downgrade;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss://yourdomain.com;";

    # CORS for API (adjust if needed)
    location /api/ {
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        proxy_pass http://localhost:YOUR_API_PORT;
    }

    # Rate limiting (5 req/sec per IP for API)
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:YOUR_API_PORT;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:YOUR_FRONTEND_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Websockets (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:YOUR_SOCKET_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
**Replace `YOUR_API_PORT`, `YOUR_FRONTEND_PORT`, and `YOUR_SOCKET_PORT` with your actual ports.**

---

## 2. Environment & Secrets
- Store all secrets (JWT, DB, etc.) in environment variables on the server, not in code or git.
- Use strong, random secrets and passwords.
- Set `NODE_ENV=production` for all Node.js processes.

---

## 3. Database Security
- Bind PostgreSQL to `localhost` only (not public IP).
- Use a dedicated DB user with minimal privileges.
- Automate DB backups (e.g., with `cron`).

---

## 4. Process Management
- Use [PM2](https://pm2.keymetrics.io/) or `systemd` to run Node.js as a non-root user, with auto-restart and log rotation.

---

## 5. Firewall
- Only open ports 80 (HTTP) and 443 (HTTPS) to the internet.
- Block all other ports (DB, Node.js, etc.) from public access.

---

## 6. Dependency Security
- Run `pnpm audit` or `npm audit` on your server and address any critical vulnerabilities.

---

## 7. Monitoring & Backups
- Set up [fail2ban](https://www.fail2ban.org/) or similar to block repeated failed logins.
- Schedule regular backups of your database and uploads.

---

## 8. Optional: Cloudflare/CDN
- Consider using [Cloudflare](https://www.cloudflare.com/) for DDoS protection, extra rate limiting, and additional security headers.

---

## 9. Launch Checklist
- [ ] Nginx configured and SSL enabled
- [ ] All secrets in env vars
- [ ] Database not public
- [ ] Firewall enabled
- [ ] PM2/systemd for process management
- [ ] Regular backups scheduled
- [ ] All dependencies audited

---

**This setup adds security without changing your app code. For further hardening or specific config examples, just ask!**

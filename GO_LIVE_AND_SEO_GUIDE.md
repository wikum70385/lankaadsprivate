# Simple Production Deployment Guide

**From uploading your project to a fully functional web app on your VPS**

---

## 1. Upload Your Project

Upload your project folder to your VPS (example path: `/root/lankaadsprivate_v2`).
- Use `scp`, `rsync`, or `git clone`.

---

## 2. Set Up Environment Variables

Create the following `.env` files in the specified directories, using these example contents (replace passwords/secrets as needed):

### Main Frontend (`/root/lankaadsprivate_v2/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://lankaadsprivate.com/api
NEXT_PUBLIC_CHAT_API_URL=https://lankaadsprivate.com/chat
NEXT_PUBLIC_AD_BACKEND_URL=https://lankaadsprivate.com/api
NEXT_PUBLIC_CHAT_BACKEND_URL=https://lankaadsprivate.com/chat
NEXT_PUBLIC_CHAT_WS_URL=wss://lankaadsprivate.com/chat
NEXTAUTH_URL=https://lankaadsprivate.com
NEXTAUTH_SECRET=your_production_secret
NEXT_PUBLIC_SITE_URL=https://lankaadsprivate.com
```

### Ad Backend (`/root/lankaadsprivate_v2/backend_ad/.env`)
```env
DATABASE_URL=postgresql://postgres:wikum70385@localhost:5432/lankaads
JWT_SECRET=your_ad_backend_jwt_secret
PORT=3001
NODE_ENV=production
```

### Chat Backend (`/root/lankaadsprivate_v2/new chat system/backend/.env`)
```env
PORT=5000
DATABASE_URL=postgresql://postgres:wikum70385@localhost:5432/lanka_ads_chat
JWT_SECRET=your_chat_backend_jwt_secret
CORS_ORIGIN=https://lankaadsprivate.com
NODE_ENV=production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

### Chat Frontend (`/root/lankaadsprivate_v2/new chat system/frontend/.env`)
```env
VITE_CHAT_API_URL=https://lankaadsprivate.com/chat/api
VITE_CHAT_WS_URL=wss://lankaadsprivate.com/chat
```

---

## 3. Database Setup

1. **Switch to the postgres user:**
   ```sh
   sudo -u postgres psql
   ```

2. **Create required users and databases:**
   At the `psql` prompt, paste these commands one by one:
   ```sql
   -- Main ad backend user and database
   CREATE USER postgres WITH PASSWORD 'wikum70385';
   CREATE DATABASE lankaads OWNER postgres;

   -- Chat backend database (uses same user)
   CREATE DATABASE lanka_ads_chat OWNER postgres;
   \q
   ```

3. **Initialize database schemas:**
   - **Ad backend:**
     From the `backend_ad` directory, run:
     ```sh
     pnpm run init-db
     # or
     node src/config/init-db.js
     ```
     This will create all tables and insert defaults for the ad backend.
   - **Chat backend:**
     Import the SQL schema file:
     ```sh
     psql -U postgres -d lanka_ads_chat -f "/root/lankaadsprivate_v2/new chat system/backend/database_setup.sql"
     ```

---

## 4. Install Dependencies & Build

```sh
cd /root/lankaadsprivate_v2
pnpm install
pnpm build
cd backend_ad && pnpm install && pnpm build && cd ..
cd "new chat system/backend" && pnpm install && pnpm build && cd ../..
cd "new chat system/frontend" && pnpm install && pnpm build && cd ../..
```

---

## 4. Start All Services with PM2

```sh
pm2 start pnpm --name main-frontend -- start
pm2 start pnpm --name ad-backend -- start --cwd backend_ad
pm2 start pnpm --name chat-backend -- start --cwd "new chat system/backend"
pm2 start pnpm --name chat-frontend -- start --cwd "new chat system/frontend"
pm2 save
pm2 startup
```

---

## 5. Configure Nginx Reverse Proxy

- Edit `/etc/nginx/sites-available/lankaadsprivate` to proxy requests to your running services (main frontend, ad backend, chat backend, chat frontend). Make sure to include WebSocket headers for chat.
- Enable the config and reload Nginx:
  ```sh
  sudo ln -s /etc/nginx/sites-available/lankaadsprivate /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
  ```

---

## 6. Enable SSL (HTTPS)

```sh
sudo certbot --nginx -d lankaadsprivate.com -d www.lankaadsprivate.com
```

---

## 7. (Optional) Enable Firewall

```sh
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 8. Go Live!

- Visit https://lankaadsprivate.com to verify your site is working.
- Use `pm2 list` and `pm2 logs <app-name>` to check service status.
- Use `sudo tail -f /var/log/nginx/error.log` for Nginx troubleshooting.

---

**Your web app is now fully deployed and live!**

**If you have a schema file (e.g. database_setup.sql), import it:**
```sh
psql -U postgres -d lankaads -f /path/to/database_setup.sql
psql -U postgres -d lanka_ads_chat -f /path/to/database_setup.sql
```

---

## 6. Install Dependencies & Build

```sh
cd /var/www/lankaadsprivate
pnpm install
pnpm build
```

_For chat system:_
```sh
cd "/var/www/lankaadsprivate/new chat system/backend"
pnpm install
cd ../frontend
pnpm install
pnpm build
```

---

## 7. Start All Apps with PM2

```sh
# Main frontend (Next.js)
cd /var/www/lankaadsprivate
pm2 start npm --name "main-frontend" -- start

# Ad backend (Express API)
cd /var/www/lankaadsprivate/backend_ad
pnpm install  # Only needed the first time or after changes
pm2 start npm --name "ad-backend" -- start

# Chat backend
cd "/var/www/lankaadsprivate/new chat system/backend"
pm2 start npm --name "chat-backend" -- start

# Chat frontend
cd "/var/www/lankaadsprivate/new chat system/frontend"
pm2 start npm --name "chat-frontend" -- start

# Save and setup PM2 startup
pm2 save
pm2 startup
```

---

## 8. Nginx Reverse Proxy

Create file:
```sh
sudo nano /etc/nginx/sites-available/lankaadsprivate
```
Paste:
```nginx
server {
    listen 80;
    server_name lankaadsprivate.com www.lankaadsprivate.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable and reload:
```sh
sudo ln -s /etc/nginx/sites-available/lankaadsprivate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. SSL (HTTPS)

```sh
sudo certbot --nginx -d lankaadsprivate.com -d www.lankaadsprivate.com
```

---

## 10. Firewall

```sh
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 11. robots.txt

Create file `/var/www/lankaadsprivate/public/robots.txt`:
```txt
User-agent: *
Allow: /
```

---

## 12. sitemap.xml

Create file `/var/www/lankaadsprivate/public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lankaadsprivate.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Add more URLs for categories, post-ad, chat, etc. -->
</urlset>
```

---

## 13. Adult Content Compliance

- Add this to your `<head>`:
```html
<meta name="rating" content="adult">
<meta name="robots" content="index, follow">
<meta name="googlebot" content="index, follow, notranslate, noimageindex">
```
- Add an 18+ disclaimer/landing page or popup.

---

## 14. SEO & Launch

- Use descriptive `<title>` and `<meta name="description">` on all pages.
- Register at [Google Search Console](https://search.google.com/search-console/about)
- Test your site at https://lankaadsprivate.com
- Monitor: `pm2 logs`, `sudo tail -f /var/log/nginx/error.log`

---

## 15. Update & Deploy

- Edit code locally, push to GitHub, then on VPS:
```sh
cd /var/www/lankaadsprivate
git pull
pm2 restart all
```

---

**Your site is now live and secure!**


---

## 5. Database Setup
- `sudo -u postgres psql`
- Create user & db:
  ```sql
  CREATE USER lankaads WITH PASSWORD 'yourpassword';
  CREATE DATABASE lankaadsdb OWNER lankaads;
  \q
  ```
- Run your DB init scripts (see `backend_ad/src/config/init-db.js` or similar)

---

## 6. Install Dependencies & Build
- `cd /home/youruser/lankaadsprivate`
- `pnpm install`
- Build frontend(s):
  - For Next.js: `pnpm build` inside the main app folder
  - For chat frontend: `cd new chat system/frontend && pnpm install && pnpm build`
- Build backend(s) if needed

---

## 7. Start Services with PM2
- For each backend/frontend, run (adjust paths):
  ```sh
  pm2 start npm --name "ad-backend" --prefix backend_ad -- run start
  pm2 start npm --name "chat-backend" --prefix "new chat system/backend" -- run start
  pm2 start npm --name "ad-frontend" --prefix app -- run start
  pm2 start npm --name "chat-frontend" --prefix "new chat system/frontend" -- run start
  pm2 save
  pm2 startup
  ```

---

## 8. Nginx Reverse Proxy & SSL
- Point your domain (A record) to your VPS IP
- Request SSL:
  - `sudo certbot --nginx -d lankaadsprivate.com -d www.lankaadsprivate.com`
- Edit `/etc/nginx/sites-available/lankaadsprivate.com`:
  - Use the secure config from `SECURE_SERVER_SETUP.md` (adjust ports)
- Test and reload:
  - `sudo nginx -t && sudo systemctl reload nginx`

---

## 9. Firewall & Security
- `sudo ufw allow OpenSSH`
- `sudo ufw allow 'Nginx Full'`
- `sudo ufw enable`
- Only ports 80/443 should be open to the public
- DB should only be accessible locally

---

## 10. Adult Content Compliance
- Add a clear disclaimer/landing page: "This site contains adult-oriented content. You must be 18+ to enter."
- Consider an age verification popup/modal
- Add `meta` tags for adult content:
  ```html
  <meta name="rating" content="adult">
  <meta name="robots" content="index, follow">
  <meta name="googlebot" content="index, follow, notranslate, noimageindex">
  ```
- Add a `robots.txt` file in `/public`:
  ```txt
  User-agent: *
  Allow: /
  ```
- Add a `sitemap.xml` for SEO (see below)

---

## 11. SEO Enhancements
- Use descriptive `<title>` and `<meta name="description">` tags for every page
- Add Open Graph & Twitter meta tags for social sharing
- Use semantic HTML (`<main>`, `<article>`, `<section>`, etc.)
- Generate and submit a `sitemap.xml` to Google Search Console
- Register your site at [Google Search Console](https://search.google.com/search-console/about)
- Add Google Analytics (optional)
- Make sure all content is crawlable (no `noindex` on main pages)

---

## 12. Launch & Monitor
- Visit https://lankaadsprivate.com and test all features
- Check SSL (https://www.ssllabs.com/ssltest/)
- Monitor logs: `pm2 logs`, `sudo tail -f /var/log/nginx/error.log`
- Set up regular DB and file backups (cron or managed service)

---

## 13. Ongoing SEO & Ranking
- Regularly update content (new ads, blog posts, etc.)
- Get backlinks from relevant sites
- Share on social media and forums (where allowed)
- Respond to user feedback and keep improving UX

---

## 14. Sample robots.txt
```
User-agent: *
Allow: /
```

## 15. Sample sitemap.xml (put in /public)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lankaadsprivate.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Add more URLs for categories, post-ad, chat, etc. -->
</urlset>
```

---

## 16. Legal & Privacy
- Add a privacy policy and terms of use (especially for adult content)
- Display copyright and contact info

---

**You are now ready to go live with your adult-oriented ad listing & chatroom website, fully optimized for SEO and Google indexing!**

If you want auto-generated meta tags, sitemap, or robots.txt, let me know!

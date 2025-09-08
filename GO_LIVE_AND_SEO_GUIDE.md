# Go-Live & SEO Guide for lankaadsprivate.com

This guide gives you a **step-by-step roadmap** to:
- Deploy your ad listing + chat app on a VPS
- Secure it for public/adult use
- Add your custom domain (lankaadsprivate.com)
- Maximize your Google search ranking (SEO), including adult content compliance

---

## 1. Prepare Your VPS
- Choose a reliable VPS provider (e.g., Hetzner, DigitalOcean, Vultr, Contabo)
- Install Ubuntu 22.04 LTS (recommended)
- Update system: `sudo apt update && sudo apt upgrade -y`
- Set up a non-root user with sudo
- Set your server timezone: `sudo timedatectl set-timezone Asia/Colombo`

---

## 2. Install Required Software
- **Node.js & pnpm**
  - `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`
  - `sudo apt install -y nodejs`
  - `npm install -g pnpm`
- **Nginx**
  - `sudo apt install -y nginx`
- **PostgreSQL**
  - `sudo apt install -y postgresql postgresql-contrib`
- **Certbot (for SSL)**
  - `sudo apt install -y certbot python3-certbot-nginx`
- **PM2 (for process management)**
  - `sudo npm install -g pm2`

---

## 3. Upload Your Code
- Use `scp` or SFTP to upload your entire project folder to `/home/youruser/lankaadsprivate`
- Set correct permissions: `chown -R youruser:youruser /home/youruser/lankaadsprivate`

---

## 4. Environment Variables & Secrets
- Copy `.env` and `.env.local` files, set STRONG secrets for JWT, DB, etc.
- Set `NODE_ENV=production` in all environments
- Example `.env` entries:
  ```env
  DATABASE_URL=postgresql://lankaads:yourpassword@localhost:5432/lankaadsdb
  JWT_SECRET=long-random-string
  NEXT_PUBLIC_AD_BACKEND_URL=https://lankaadsprivate.com/api
  ```

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

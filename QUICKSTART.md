# Quick Start Checklist

## Development (Local)

### Backend Setup (5 min)

- [ ] Navigate to `ourstory-api/`
- [ ] Run `cp .env.example .env`
- [ ] Run `npm install`
- [ ] Run `npm run migrate`
- [ ] Run `npm run dev`
- [ ] Verify: Open `http://localhost:3001/api/health` → See `{"status":"ok"}`

### Frontend Setup (5 min)

- [ ] Navigate to `ourstory-frontend/`
- [ ] Run `cp .env.local.example .env.local`
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Verify: Open `http://localhost:3000` → See timeline cover

### First Memory (5 min)

- [ ] Go to `http://localhost:3000/admin/login`
- [ ] Login with `admin` / `changeme`
- [ ] Click "Add Memory"
- [ ] Fill in title, date, section, body
- [ ] Save
- [ ] Upload a test image
- [ ] Go to `/` and refresh - see your memory!

### Edit Valentine Message (2 min)

- [ ] In admin, click "Edit Valentine Message"
- [ ] Update title, message, signature
- [ ] Save
- [ ] Scroll to bottom of timeline - see it!

---

## Production Deployment

### Prerequisites Checklist

- [ ] Ubuntu/Debian server for backend (or any Linux VPS)
- [ ] Raspberry Pi or similar for frontend (or any static host)
- [ ] Domain name (e.g., `ourstory.yourdomain.com`)
- [ ] DNS configured to point domain to your network
- [ ] Nginx Proxy Manager installed and accessible
- [ ] SSH access to both machines

### Backend (Ubuntu)

**Pre-Deployment (15 min):**

- [ ] SSH to Ubuntu server
- [ ] Run: `node --version` (should be 18+)
- [ ] Run: `npm --version`

**Installation (20 min):**

- [ ] Create user: `sudo useradd -r -s /bin/false ourstory`
- [ ] Create dirs: `sudo mkdir -p /opt/ourstory-api /var/lib/ourstory/{db,uploads}`
- [ ] Copy files: `sudo cp -r ourstory-api/* /opt/ourstory-api/`
- [ ] Set perms: `sudo chown -R ourstory:ourstory /opt/ourstory-api /var/lib/ourstory`
- [ ] Install deps: `cd /opt/ourstory-api && sudo npm install --production`

**Configuration (10 min):**

- [ ] Edit .env: `sudo nano /opt/ourstory-api/.env`
  - [ ] Change `JWT_SECRET` to long random string
  - [ ] Change `ADMIN_PASSWORD` to strong password
  - [ ] Set `CORS_ORIGIN=https://ourstory.yourdomain.com`
- [ ] Initialize: `cd /opt/ourstory-api && sudo -u ourstory npm run migrate`

**Service Setup (5 min):**

- [ ] Copy: `sudo cp ourstory-api.service /etc/systemd/system/`
- [ ] Enable: `sudo systemctl enable ourstory-api`
- [ ] Start: `sudo systemctl start ourstory-api`
- [ ] Verify: `sudo systemctl status ourstory-api`

**NPM Configuration (5 min):**

- [ ] Log in to Nginx Proxy Manager
- [ ] Add Proxy Host:
  - [ ] Domain: `ourstory-api.yourdomain.com`
  - [ ] Forward to: `http://ubuntu-local-ip:3001`
  - [ ] Enable SSL (Let's Encrypt)
  - [ ] Force SSL: Yes
  - [ ] Save

**Test:**

- [ ] Run: `curl https://ourstory-api.yourdomain.com/api/health`
- [ ] Should see: `{"status":"ok"}`

---

### Frontend (Raspberry Pi)

**Build (10 min, on dev machine):**

- [ ] Navigate to `ourstory-frontend/`
- [ ] Update `.env.local`: `NEXT_PUBLIC_API_URL=https://ourstory-api.yourdomain.com`
- [ ] Run: `npm run build`
- [ ] Verify: `ls dist/` shows `index.html`

**Deploy (10 min):**

- [ ] SCP/rsync `dist/` to Pi: `rsync -avz dist/ pi@pi-ip:/opt/ourstory-frontend/`
- [ ] SSH to Pi: `ssh pi@pi-ip`

**Server Setup (10 min):**

- [ ] Create dir: `mkdir -p /opt/ourstory-frontend`
- [ ] Copy files (if not done via rsync)
- [ ] Install serve: `sudo npm install -g serve`
- [ ] Test: `serve -s /opt/ourstory-frontend -l 8088`
- [ ] Create systemd service (see DEPLOYMENT.md)
- [ ] Enable: `sudo systemctl enable ourstory-frontend`
- [ ] Start: `sudo systemctl start ourstory-frontend`

**NPM Configuration (5 min):**

- [ ] Add Proxy Host:
  - [ ] Domain: `ourstory.yourdomain.com`
  - [ ] Forward to: `http://pi-local-ip:8088`
  - [ ] Enable SSL (Let's Encrypt)
  - [ ] Force SSL: Yes
  - [ ] Save

**Test:**

- [ ] Open: `https://ourstory.yourdomain.com`
- [ ] Should see: Timeline cover with "Our Story ❤️"
- [ ] Click "Edit" or go to `/admin/login`
- [ ] Login with admin credentials
- [ ] Try adding/editing a memory

---

## Verification Checklist

### Security

- [ ] Backend .env has strong JWT_SECRET
- [ ] Backend .env has strong ADMIN_PASSWORD
- [ ] HTTPS is enforced (all requests redirect to https)
- [ ] CORS_ORIGIN is correctly set (not `*`)
- [ ] No credentials in git/public repos

### Performance

- [ ] Images load quickly (check file size)
- [ ] Timeline scrolls smoothly (60 fps)
- [ ] Admin pages respond quickly
- [ ] Backend health check responds in <100ms

### Features

- [ ] Public timeline displays memories
- [ ] Images show in carousel
- [ ] Lightbox opens on image click
- [ ] Valentine message displays at bottom
- [ ] Admin can login
- [ ] Admin can create memory
- [ ] Admin can upload images
- [ ] Admin can edit memory
- [ ] Admin can delete memory
- [ ] Admin can edit valentine message
- [ ] Logout works
- [ ] PWA manifest works (check DevTools)

### Mobile Experience

- [ ] Timeline is responsive on phone
- [ ] Images are readable on mobile
- [ ] Forms are mobile-friendly
- [ ] "Add to Home Screen" works (PWA)
- [ ] Touch carousel works (swipe)

---

## Backups

### Before Going Live

- [ ] Create backup script (see DEPLOYMENT.md)
- [ ] Test backup/restore procedure
- [ ] Set up automated daily backups
- [ ] Verify backups are stored safely

---

## Post-Deployment

### Day 1

- [ ] Test all features again
- [ ] Check error logs: `sudo journalctl -u ourstory-api -n 50`
- [ ] Monitor disk usage: `df -h`
- [ ] Share link with your special someone 💕

### Week 1

- [ ] Monitor for errors/issues
- [ ] Test image upload functionality
- [ ] Verify backups are working
- [ ] Check firewall rules

### Monthly

- [ ] Review and update admin password (if needed)
- [ ] Check for Node.js updates: `npm audit`
- [ ] Verify backup integrity
- [ ] Check disk usage

---

## Troubleshooting Quick Links

Backend won't start?
→ Check: `sudo journalctl -u ourstory-api -e`

Images not uploading?
→ Check: `ls -la /var/lib/ourstory/uploads/`

Admin page blank?
→ Check: Browser console (F12) for API errors

Frontend not accessible?
→ Check: `curl -I https://ourstory.yourdomain.com`

---

## Next Steps (Optional)

- [ ] Add more custom animations
- [ ] Create admin password change endpoint
- [ ] Add import/export JSON feature
- [ ] Setup email notifications
- [ ] Add music/sound effects
- [ ] Create photo gallery view
- [ ] Add sharing (private link)

---

**You're all set! Enjoy your beautiful timeline 💕**

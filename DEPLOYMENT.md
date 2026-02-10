# Deployment Guide

## Quick Start for Local Development

### Option 1: Native Node.js (Recommended for Development)

```bash
# Terminal 1: Backend
cd ourstory-api
cp .env.example .env
npm install
npm run migrate
npm run dev
# Runs on http://localhost:3001

# Terminal 2: Frontend
cd ourstory-frontend
cp .env.local.example .env.local
npm install
npm run dev
# Runs on http://localhost:3000
```

### Option 2: Docker Compose (Recommended for Production)

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f frontend

# Stop
docker-compose down
```

---

## Production Deployment

### Architecture

```
                    Your Domain
                        |
        ┌───────────────┼───────────────┐
        |               |               |
    Nginx PM        Nginx PM       Domain DNS
    (Port 443)      (Port 443)
        |               |
    [Frontend]     [Backend]
     (Pi/Home)      (Ubuntu)
     Port 8088      Port 3001
```

---

## Backend Deployment (Ubuntu/Debian)

### Prerequisites

- Ubuntu 20.04 LTS or newer
- Node.js 18+
- Nginx Proxy Manager instance
- Domain configured in DNS

### Step 1: System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be 18+
npm --version   # Should be 9+
```

### Step 2: Create Service User

```bash
# Create dedicated user
sudo useradd -r -s /bin/false ourstory

# Create directories
sudo mkdir -p /opt/ourstory-api
sudo mkdir -p /var/lib/ourstory/{db,uploads}

# Set permissions
sudo chown -R ourstory:ourstory /opt/ourstory-api
sudo chown -R ourstory:ourstory /var/lib/ourstory
```

### Step 3: Install Application

```bash
# Copy application files
sudo cp -r ourstory-api/* /opt/ourstory-api/

# Install dependencies
cd /opt/ourstory-api
sudo npm install --production

# Create .env file
sudo cp .env.example .env
sudo nano .env  # Edit with your settings
```

### Step 4: Configure Environment

Edit `/opt/ourstory-api/.env`:

```env
NODE_ENV=production
PORT=3001
DATABASE_PATH=/var/lib/ourstory/db.sqlite
UPLOAD_DIR=/var/lib/ourstory/uploads
JWT_SECRET=use-a-long-random-string-here-32+ characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-strong-password-here
CORS_ORIGIN=https://ourstory.yourdomain.com
MAX_FILE_SIZE=10485760
```

### Step 5: Initialize Database

```bash
cd /opt/ourstory-api
sudo -u ourstory npm run migrate

# Verify
sudo sqlite3 /var/lib/ourstory/db.sqlite "SELECT name FROM sqlite_master WHERE type='table';"
```

### Step 6: Create Systemd Service

Copy the provided `ourstory-api.service` to systemd:

```bash
sudo cp ourstory-api.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ourstory-api
sudo systemctl start ourstory-api

# Check status
sudo systemctl status ourstory-api

# View logs
sudo journalctl -u ourstory-api -f
```

### Step 7: Configure Nginx Proxy Manager

1. Log in to Nginx Proxy Manager (usually on your network)
2. Go to **Proxy Hosts**
3. Click **Add Proxy Host**

**Settings:**

- Domain Names: `ourstory-api.yourdomain.com`
- Scheme: `http`
- Forward Hostname/IP: `your-ubuntu-local-ip` (e.g., `192.168.1.100`)
- Forward Port: `3001`

**SSL Tab:**

- SSL Certificate: Select or create (Let's Encrypt recommended)
- Force SSL: ✓ Enabled
- HTTP/2 Support: ✓ Enabled

**Advanced Tab:**

```
# Add if needed
proxy_connect_timeout 600s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;
```

**Custom Locations (optional, if many large uploads):**

- Location: `/uploads`
- Scheme: `http`
- Forward Hostname/IP: `ubuntu-ip`
- Forward Port: `3001`

Click **Save** and test:

```bash
curl -I https://ourstory-api.yourdomain.com/api/health
# Should return HTTP/2 200
```

---

## Frontend Deployment (Raspberry Pi / Home Assistant)

### Prerequisites

- Raspberry Pi with Home Assistant or Ubuntu
- Nginx Proxy Manager instance
- Domain configured in DNS

### Step 1: Build Frontend on Dev Machine

```bash
# On your development machine
cd ourstory-frontend

# Update environment
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://ourstory-api.yourdomain.com
EOF

# Build for static export
npm run build

# Verify output
ls -la dist/
# Should contain: index.html, _next/, public/, etc.
```

### Step 2: Transfer to Raspberry Pi

```bash
# Option A: SCP (Secure Copy)
scp -r dist/* pi@raspberry-ip:/tmp/ourstory-dist/

# Option B: rsync (better for large files)
rsync -avz dist/ pi@raspberry-ip:/opt/ourstory-frontend/
```

### Step 3: Setup on Raspberry Pi

```bash
# SSH to Pi
ssh pi@raspberry-ip

# Create directory
sudo mkdir -p /opt/ourstory-frontend
sudo chown $USER:$USER /opt/ourstory-frontend

# If using SCP, copy files
cp -r /tmp/ourstory-dist/* /opt/ourstory-frontend/

# Verify
ls /opt/ourstory-frontend/
```

### Step 4: Install Web Server

#### Option A: Using `serve` (Easiest)

```bash
# Install globally
sudo npm install -g serve

# Test locally
serve -s /opt/ourstory-frontend -l 8088

# Create systemd service for serve
sudo tee /etc/systemd/system/ourstory-frontend.service > /dev/null << 'EOF'
[Unit]
Description=Our Story Frontend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/ourstory-frontend
ExecStart=/usr/local/bin/serve -s . -l 8088
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ourstory-frontend
sudo systemctl start ourstory-frontend
sudo systemctl status ourstory-frontend
```

#### Option B: Using Nginx

```bash
# Install nginx
sudo apt install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/ourstory-frontend > /dev/null << 'EOF'
server {
    listen 8088;
    server_name _;
    root /opt/ourstory-frontend;

    # Cache static assets
    location /_next/static {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # SPA routing
    location / {
        try_files $uri /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Manifest
    location /manifest.json {
        add_header Cache-Control "public, max-age=3600";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/ourstory-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Configure Nginx Proxy Manager

1. Log in to Nginx Proxy Manager
2. Go to **Proxy Hosts** → **Add Proxy Host**

**Settings:**

- Domain Names: `ourstory.yourdomain.com`
- Scheme: `http`
- Forward Hostname/IP: `your-pi-local-ip` (e.g., `192.168.1.50`)
- Forward Port: `8088`

**SSL Tab:**

- SSL Certificate: Select or create (Let's Encrypt)
- Force SSL: ✓ Enabled
- HTTP/2 Support: ✓ Enabled

Click **Save** and test:

```bash
curl -I https://ourstory.yourdomain.com
# Should return HTTP/2 200
```

---

## Post-Deployment Configuration

### 1. Change Admin Password

After first deployment, immediately change the default password:

```bash
# On Ubuntu server
cd /opt/ourstory-api

# Edit .env
sudo nano .env
# Change ADMIN_PASSWORD to a strong password

# Restart service
sudo systemctl restart ourstory-api

# Reinitialize database (optional, if needed)
sudo -u ourstory npm run migrate
```

Or change via API once logged in (implement password change endpoint).

### 2. Test the Application

```bash
# Health check
curl https://ourstory-api.yourdomain.com/api/health

# Login
curl -X POST https://ourstory-api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'

# Get memories
curl https://ourstory.yourdomain.com/api/memories

# Visit frontend
# https://ourstory.yourdomain.com → Should show timeline
# https://ourstory.yourdomain.com/admin/login → Should show login
```

### 3. Setup Backups

```bash
# Ubuntu: Create backup script
cat > /opt/backup-ourstory.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/ourstory"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/ourstory-$DATE.tar.gz /var/lib/ourstory/
# Keep last 30 days
find $BACKUP_DIR -mtime +30 -delete
EOF

chmod +x /opt/backup-ourstory.sh

# Add cron job (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/backup-ourstory.sh
```

### 4. Monitor Application

```bash
# Check backend logs
sudo journalctl -u ourstory-api -f

# Check frontend logs (if using serve)
sudo journalctl -u ourstory-frontend -f

# Monitor disk usage
df -h /var/lib/ourstory
du -sh /var/lib/ourstory/uploads

# Monitor processes
top -p $(pgrep -f "node src/server.js" | xargs)
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
sudo journalctl -u ourstory-api -n 50 -e

# Verify Node.js
node --version

# Check port
sudo lsof -i :3001

# Check database permissions
ls -la /var/lib/ourstory/

# Test manually
cd /opt/ourstory-api
NODE_ENV=production npm start
```

### Images Not Loading

```bash
# Check upload directory
ls -la /var/lib/ourstory/uploads

# Check CORS
curl -i -X OPTIONS https://ourstory-api.yourdomain.com/api/health \
  -H "Origin: https://ourstory.yourdomain.com"
# Should show Access-Control-Allow-Origin header

# Check .env CORS_ORIGIN
grep CORS_ORIGIN /opt/ourstory-api/.env
```

### Frontend Blank/404

```bash
# Check if files exist
ls -la /opt/ourstory-frontend/

# Check nginx config
sudo nginx -t

# Restart serve/nginx
sudo systemctl restart ourstory-frontend
# or
sudo systemctl restart nginx
```

### Login Fails

```bash
# Check database was initialized
sudo sqlite3 /var/lib/ourstory/db.sqlite "SELECT username FROM admin_users;"

# Reinitialize if needed
cd /opt/ourstory-api
sudo -u ourstory npm run migrate

# Check admin credentials
sudo cat /opt/ourstory-api/.env | grep ADMIN
```

---

## Performance Optimization

### Image Optimization

Enable thumbnail generation in backend (optional):

Edit `src/routes/uploads.js` to create thumbnails:

```javascript
// Generate thumbnail
await sharp(buffer)
  .resize(400, 300, { fit: "cover" })
  .jpeg({ quality: 80 })
  .toFile(thumbPath);
```

### Database Optimization

```bash
# Optimize database
sudo sqlite3 /var/lib/ourstory/db.sqlite "VACUUM;"
sudo sqlite3 /var/lib/ourstory/db.sqlite "ANALYZE;"

# Check indexes
sudo sqlite3 /var/lib/ourstory/db.sqlite ".indices"
```

### Caching

Frontend PWA caching is configured in globals.css. For additional caching:

1. **Long cache for static assets:**
   - NPM can set Cache-Control headers on index.html and \_next folder

2. **Backend caching:**
   - Add `Cache-Control: max-age=300` to /api/memories responses
   - Let /api/valentine cache for shorter period

---

## Maintenance

### Regular Tasks

**Weekly:**

- Check disk usage
- Review error logs

**Monthly:**

- Verify backups work
- Test restore procedure
- Update Node.js if patches available

**Quarterly:**

- Rotate admin passwords
- Review and clean old images
- Test disaster recovery

### Upgrade Procedure

```bash
# Backend upgrade
sudo systemctl stop ourstory-api
cd /opt/ourstory-api
git pull  # or download new version
npm install --production
npm run migrate
sudo systemctl start ourstory-api

# Frontend upgrade
# Rebuild on dev machine
cd ourstory-frontend
npm install
npm run build
# Transfer dist/ to Pi
rsync -avz dist/ pi@raspberry-ip:/opt/ourstory-frontend/
sudo systemctl restart ourstory-frontend
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Ubuntu server
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3001/tcp  # API (only for local, NPM handles public)
sudo ufw enable

# Verify
sudo ufw status
```

### 2. Update System

```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y
sudo apt autoremove

# Node.js dependencies
cd /opt/ourstory-api
npm audit fix
```

### 3. File Permissions

```bash
# Restrict file access
sudo chmod 750 /opt/ourstory-api
sudo chmod 750 /var/lib/ourstory
sudo chmod 640 /opt/ourstory-api/.env
```

### 4. Rate Limiting

Already enabled in auth routes (5 attempts/minute on login).

### 5. HTTPS Enforcement

All configured via NPM:

- Force SSL: Yes
- HTTP/2: Yes
- Security Headers: Recommended

---

## Rollback Procedure

```bash
# If deployment breaks

# Backend rollback
sudo systemctl stop ourstory-api
cd /opt/ourstory-api
git checkout previous-version  # or restore from backup
npm install
sudo systemctl start ourstory-api

# Frontend rollback
sudo systemctl stop ourstory-frontend
cp /backups/previous-dist/* /opt/ourstory-frontend/
sudo systemctl start ourstory-frontend
```

---

## Getting Help

### Logs to check

1. **Backend:** `sudo journalctl -u ourstory-api -n 100 -e`
2. **Frontend:** Browser console (F12) or `sudo journalctl -u ourstory-frontend -n 50`
3. **Nginx:** `sudo tail -f /var/log/nginx/error.log`

### Common Issues Resolved

See main README.md troubleshooting section.

---

**Deployed with ❤️**

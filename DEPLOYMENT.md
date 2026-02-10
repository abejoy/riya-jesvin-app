# Deployment Guide

## Quick Start for Local Development

### Native Node.js (Development)

```bash
# Terminal 1: Backend
cd ourstory-api
npm install
npm run dev
# Runs on http://localhost:3001

# Terminal 2: Frontend
cd ourstory-frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

Both services run with hot-reload enabled.

---

## Production Deployment on Ubuntu with Docker

### Architecture

Both frontend and backend run in Docker containers on a single Ubuntu machine, managed via systemd services.

```
Ubuntu Server (e.g., 192.168.1.100)
├── Docker Compose (ourstory.service)
│   ├── Frontend (Next.js) → Port 3000
│   │   └── Volumes: ./uploads, ./data
│   └── Backend (Fastify) → Port 3001
│       └── Database: sqlite3
├── Data Persistence
│   ├── /home/jesvin/Pictures → /uploads (Docker mount)
│   ├── ~/ourstory/data/db.sqlite → Database volume
│   └── ~/ourstory/.env → Secrets
└── Service Control
    ├── sudo systemctl start ourstory.service
    ├── sudo systemctl stop ourstory.service
    └── sudo systemctl status ourstory.service
```

### Prerequisites

- Ubuntu 20.04 LTS or newer
- Docker & Docker Compose installed
- sudo access
- `/home/jesvin/Pictures` directory (or modify path)
- ~1GB free disk space

### Step 1: Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add user to docker group (optional, allows docker without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose (if not included)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Set Up Project Directory

```bash
# Create project directory
mkdir -p ~/ourstory/{data,uploads}
cd ~/ourstory

# Copy project files
# Option A: Clone from git
git clone <your-repo-url> .

# Option B: Copy from dev machine
scp -r your-local-project/* jesvin@ubuntu-ip:~/ourstory/

# Verify structure
ls -la ~/ourstory/
# Should show: docker-compose.yml, ourstory-api/, ourstory-frontend/, etc.
```

### Step 3: Configure Environment

```bash
# Create backend .env
cat > ~/ourstory/ourstory-api/.env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/db.sqlite
UPLOAD_DIR=/uploads
JWT_SECRET=your-super-secret-jwt-key-change-this-32+chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=10485760
EOF

# Update docker-compose.yml volumes
# Ensure these lines exist:
# - /home/jesvin/Pictures:/uploads
# - ./data:/app/data
```

### Step 4: Initialize Database

```bash
# Start services
cd ~/ourstory
docker-compose up -d

# Wait for containers to be ready
sleep 5

# Check if database initialized
docker exec ourstory-api ls -la /app/data/

# View logs to confirm
docker-compose logs api
```

### Step 5: Create Systemd Service

Create `/etc/systemd/system/ourstory.service`:

```bash
sudo tee /etc/systemd/system/ourstory.service > /dev/null << 'EOF'
[Unit]
Description=Our Story Timeline Service
After=network-online.target docker.service
Wants=network-online.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/jesvin/ourstory

# Start services
ExecStart=/usr/local/bin/docker-compose up -d

# Stop services
ExecStop=/usr/local/bin/docker-compose down

# Restart on failure
Restart=on-failure
RestartSec=10s

User=jesvin
Group=docker

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ourstory.service
sudo systemctl start ourstory.service

# Check status
sudo systemctl status ourstory.service
```

### Step 6: Verify Deployment

```bash
# Check containers running
docker ps

# Check logs
docker-compose logs -f

# Test backend health
curl http://localhost:3001/api/health

# Test frontend
curl -I http://localhost:3000
# Should return HTTP/1.1 200
```

### Daily Operations

**Start service:**

```bash
sudo systemctl start ourstory.service
```

**Stop service:**

```bash
sudo systemctl stop ourstory.service
```

**Restart service:**

```bash
sudo systemctl restart ourstory.service
```

**Check status:**

```bash
sudo systemctl status ourstory.service
```

**View logs:**

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f api

# Frontend only
docker-compose logs -f frontend

# System service logs
sudo journalctl -u ourstory.service -f
```

---

## Setup Data Backups

### Backup Script

```bash
# Create backup directory
mkdir -p ~/ourstory-backups

# Create backup script
cat > ~/ourstory-backups/backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OURSTORY_DIR="$HOME/ourstory"
DATA_DIR="$OURSTORY_DIR/data"
UPLOADS_DIR="/home/jesvin/Pictures"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ourstory-backup-$DATE.tar.gz"

echo "Backing up Our Story data..."
echo "Source: $DATA_DIR and $UPLOADS_DIR"
echo "Target: $BACKUP_FILE"

# Create backup
tar -czf "$BACKUP_FILE" \
  -C "$OURSTORY_DIR" data \
  -C /home/jesvin Pictures

# Keep last 30 days of backups
find "$BACKUP_DIR" -name "ourstory-backup-*.tar.gz" -mtime +30 -delete

echo "✓ Backup complete: $BACKUP_FILE"
echo "✓ Size: $(du -h "$BACKUP_FILE" | cut -f1)"
EOF

chmod +x ~/ourstory-backups/backup.sh
```

### Automated Daily Backups (Optional)

```bash
# Add cron job (runs daily at 2 AM)
crontab -e

# Add this line:
# 0 2 * * * $HOME/ourstory-backups/backup.sh >> $HOME/ourstory-backups/backup.log 2>&1
```

### Restore from Backup

```bash
# List available backups
ls -lh ~/ourstory-backups/

# Stop service
sudo systemctl stop ourstory.service

# Restore specific backup
cd ~
tar -xzf ~/ourstory-backups/ourstory-backup-20250210_020000.tar.gz

# Restart service
sudo systemctl start ourstory.service

# Verify
docker-compose logs api
```

---

## Post-Deployment Configuration

### 1. Change Admin Password (IMPORTANT!)

After first deployment, immediately change the default password:

```bash
# Stop service
sudo systemctl stop ourstory.service

# Edit .env
nano ~/ourstory/ourstory-api/.env
# Change ADMIN_PASSWORD=changeme to a strong password

# Start service
sudo systemctl start ourstory.service
```

### 2. Change JWT Secret

For production, use a strong random JWT_SECRET:

```bash
# Generate random 32+ character secret
openssl rand -base64 32

# Update .env
nano ~/ourstory/ourstory-api/.env
# Paste generated value as JWT_SECRET=...

# Restart service
sudo systemctl restart ourstory.service
```

### 3. Test the Application

```bash
# Health check
curl http://localhost:3001/api/health

# Login test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'

# View frontend
# http://localhost:3000 → Should show timeline
# http://localhost:3000/admin/login → Should show login page
```

### 4. Monitor Application

```bash
# Check service status
sudo systemctl status ourstory.service

# View combined logs
docker-compose logs -f

# Monitor disk usage
du -sh ~/ourstory/data
du -sh /home/jesvin/Pictures

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## Troubleshooting

### Docker Service Issues

```bash
# Check if Docker is running
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check container status
docker ps -a

# View service logs
sudo journalctl -u ourstory.service -f

# Restart containers manually
cd ~/ourstory && docker-compose restart

# Check volume mounts
docker inspect ourstory-frontend | grep -A 10 Mounts
docker inspect ourstory-api | grep -A 10 Mounts
```

### Backend Won't Start

```bash
# View API logs
docker-compose logs api

# Check database file exists
ls -la ~/ourstory/data/

# Check database integrity
docker exec ourstory-api sqlite3 /app/data/db.sqlite ".tables"

# Test API manually
docker exec ourstory-api curl http://localhost:3001/api/health
```

### Images Not Loading

```bash
# Check Photos directory mounted correctly
docker exec ourstory-api ls -la /uploads

# Check file permissions
ls -la /home/jesvin/Pictures

# Check CORS headers
curl -i -X OPTIONS http://localhost:3001/api/health \
  -H "Origin: http://localhost:3000"
```

### Frontend Blank/404

```bash
# Check frontend logs
docker-compose logs frontend

# Check if port is in use
sudo lsof -i :3000

# Verify frontend container
docker ps | grep frontend
docker exec ourstory-frontend ps aux | grep next
```

### Cannot Connect to API

```bash
# Check backend is running
docker ps | grep api

# Check API is listening
docker exec ourstory-api netstat -tlnp | grep 3001

# Check Docker network
docker network ls
docker network inspect ourstory_default

# Test from frontend container
docker exec ourstory-frontend curl http://api:3001/api/health
```

---

## Maintenance

### Regular Tasks

**Daily:**

- Monitor logs for errors: `sudo journalctl -u ourstory.service -f`
- Check disk usage: `du -sh ~/ourstory/data /home/jesvin/Pictures`

**Weekly:**

- Run backups: `~/ourstory-backups/backup.sh`
- Review error logs in containers

**Monthly:**

- Verify backups work by testing restore
- Update Docker images: `docker-compose pull && docker-compose up -d`
- Audit file permissions

**Quarterly:**

- Change admin password
- Review and clean old photos from /home/jesvin/Pictures
- Test complete disaster recovery

### System Updates

```bash
# Update Ubuntu packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd ~/ourstory
docker-compose pull
docker-compose up -d

# Check for security updates
sudo apt list --upgradable
```

### Upgrade Application

```bash
# Stop service
sudo systemctl stop ourstory.service

# Pull latest code
cd ~/ourstory
git pull

# Update containers
docker-compose up -d --build

# Start service
sudo systemctl start ourstory.service

# Verify
sudo systemctl status ourstory.service
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Ubuntu server - only allow SSH and local ports
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 3000/tcp   # Frontend (localhost only)
sudo ufw allow 3001/tcp   # Backend (localhost only)
sudo ufw enable

# Verify
sudo ufw status
```

### 2. Change Default Credentials

Before going to production:

```bash
# 1. Change admin password
nano ~/ourstory/ourstory-api/.env
# Update: ADMIN_PASSWORD=changeme → ADMIN_PASSWORD=your-strong-password

# 2. Generate new JWT secret
openssl rand -base64 32
# Update: JWT_SECRET=your-generated-secret

# 3. Restart service
sudo systemctl restart ourstory.service
```

### 3. File Permissions

```bash
# Restrict .env file
chmod 640 ~/ourstory/ourstory-api/.env

# Restrict data directory
chmod 750 ~/ourstory/data

# Restrict uploads (if needed)
chmod 755 /home/jesvin/Pictures
```

### 4. Environment Security

```bash
# Ensure .env is not in git
echo "ourstory-api/.env" >> ~/.gitignore

# Backup .env securely (encrypted)
gpg --symmetric --cipher-algo AES256 ~/ourstory/ourstory-api/.env
```

### 5. Rate Limiting

Already enabled in API:

- Login: 5 attempts per minute per IP
- Upload: 5 requests per minute per IP

### 6. Regular Backups

Backups include both database and photos:

- `~/ourstory-backups/backup.sh` runs daily
- Keeps last 30 days of backups
- Test restore procedure monthly

---

## Recovery & Restore

### From Backup

```bash
# List backups
ls -lh ~/ourstory-backups/

# Stop services
sudo systemctl stop ourstory.service

# Restore specific backup
cd ~
tar -xzf ~/ourstory-backups/ourstory-backup-20250210_020000.tar.gz

# Restart service
sudo systemctl start ourstory.service

# Verify
docker-compose logs api
curl http://localhost:3001/api/health
```

### Rollback to Previous Version

```bash
# Stop service
sudo systemctl stop ourstory.service

# Restore from git
cd ~/ourstory
git log --oneline | head -20  # See recent commits
git checkout <commit-hash>

# Restart
sudo systemctl start ourstory.service
```

---

## Monitoring & Logging

### View Logs

```bash
# Service logs
sudo journalctl -u ourstory.service -f

# All containers
cd ~/ourstory && docker-compose logs -f

# Backend only
docker-compose logs -f api

# Frontend only
docker-compose logs -f frontend

# Last 100 lines
sudo journalctl -u ourstory.service -n 100 -e
```

### Check Health

```bash
# Service status
sudo systemctl status ourstory.service

# Container status
docker ps

# API health check
curl http://localhost:3001/api/health

# Frontend check
curl -I http://localhost:3000

# Database check
docker exec ourstory-api sqlite3 /app/data/db.sqlite "SELECT COUNT(*) FROM memories;"
```

### Monitor Resources

```bash
# Disk usage
du -sh ~/ourstory/*
df -h

# Container stats
docker stats

# Memory/CPU
top
```

---

## Reference: Docker Compose File

Expected structure of `docker-compose.yml`:

```yaml
version: "3.8"

services:
  api:
    build: ./ourstory-api
    ports:
      - "3001:3001"
    volumes:
      - /home/jesvin/Pictures:/uploads
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  frontend:
    build: ./ourstory-frontend
    ports:
      - "3000:3000"
    volumes:
      - /home/jesvin/Pictures:/uploads
      - ./data:/app/data
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - api
    restart: unless-stopped
```

---

## Getting Help

### Quick Diagnostics

```bash
# Full system check
echo "=== Service Status ===" && sudo systemctl status ourstory.service && \
echo -e "\n=== Containers ===" && docker ps && \
echo -e "\n=== Backend Health ===" && curl http://localhost:3001/api/health && \
echo -e "\n=== Frontend ===" && curl -I http://localhost:3000 && \
echo -e "\n=== Disk Usage ===" && du -sh ~/ourstory/* /home/jesvin/Pictures
```

### Logs to Check

1. **Service:** `sudo journalctl -u ourstory.service -n 50`
2. **API:** `docker-compose logs api | tail -50`
3. **Frontend:** `docker-compose logs frontend | tail -50`

### Common Issues

| Issue               | Check                                                            | Fix                        |
| ------------------- | ---------------------------------------------------------------- | -------------------------- |
| Service won't start | `sudo journalctl -u ourstory.service`                            | Check Docker is running    |
| Can't reach API     | `docker ps \| grep api`                                          | Check container is running |
| Images not loading  | `ls -la /home/jesvin/Pictures`                                   | Check permissions          |
| Database errors     | `docker exec ourstory-api sqlite3 /app/data/db.sqlite ".tables"` | Reinitialize DB            |
| Port in use         | `sudo lsof -i :3000`                                             | Kill conflicting process   |

---

**Deployed with ❤️**

_Last updated: February 2025_
_For Valentine's timeline: Our Story_

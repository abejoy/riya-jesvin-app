# Our Story ❤️ - Complete App

A beautiful, private timeline web app for your love story, built with Next.js and Fastify.

## Project Structure

```
.
├── ourstory-api/           # Backend API (Node.js + Fastify)
│   ├── src/
│   │   ├── server.js       # Main server entry
│   │   ├── db/
│   │   │   └── init.js     # Database initialization
│   │   └── routes/         # API endpoints
│   ├── package.json
│   └── .env.example
│
├── ourstory-frontend/      # Frontend (Next.js)
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   ├── lib/           # Utilities (API client)
│   │   └── app/globals.css # Tailwind styles
│   ├── public/            # Static assets
│   ├── package.json
│   └── .env.local.example
│
└── README.md             # This file
```

## Features

### Public Timeline (Read-only)

- Beautiful, animated timeline with smooth scroll transitions
- Memory cards with photos, dates, and descriptions
- Image carousel with lightbox
- Final Valentine's message with confetti effect
- PWA support for "Add to Home Screen"

### Admin Panel (Password Protected)

- Login at `/admin/login`
- Dashboard with memory list
- Create, edit, and delete memories
- Upload multiple images per memory
- Edit Valentine's message
- Manage all content via UI

### Security

- JWT authentication with httpOnly cookies
- Rate limiting on login
- Image validation (size, type)
- Password hashing with bcrypt
- CORS protection

## Tech Stack

**Frontend:**

- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Framer Motion (animations)
- Axios (HTTP client)

**Backend:**

- Node.js + Fastify
- SQLite database
- JWT authentication
- Sharp (image processing)

## Quick Start (Local Development)

### Backend Setup

```bash
cd ourstory-api

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Initialize database
npm run migrate

# Start development server (auto-reload)
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd ourstory-frontend

# Copy environment file
cp .env.local.example .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### First Time Setup

1. **Backend:** Visit `http://localhost:3001/api/health` - should return `{"status":"ok"}`

2. **Frontend:** Visit `http://localhost:3000` - you'll see the timeline

3. **Admin Login:**
   - Go to `http://localhost:3000/admin/login`
   - Default credentials: `admin` / `changeme`
   - Change password in production!

4. **Add Your First Memory:**
   - Click "Add Memory" in admin dashboard
   - Fill in title, date, section, description
   - Save memory
   - Upload photos

## Environment Configuration

### Backend (.env)

```env
NODE_ENV=production
PORT=3001
DATABASE_PATH=/var/lib/ourstory/db.sqlite
UPLOAD_DIR=/var/lib/ourstory/uploads
JWT_SECRET=your-very-long-random-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-password-here
CORS_ORIGIN=https://ourstory.yourdomain.com
MAX_FILE_SIZE=10485760
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://ourstory-api.yourdomain.com
```

## Deployment Guide

### Prerequisites

- Ubuntu server (for backend)
- Raspberry Pi with Home Assistant (for frontend)
- Domain name with DNS configured
- Nginx Proxy Manager set up on both machines

### 1. Backend Deployment (Ubuntu)

```bash
# On your Ubuntu server

# Create application directory
sudo mkdir -p /opt/ourstory-api
sudo mkdir -p /var/lib/ourstory/{uploads,db}
sudo chown $USER:$USER /var/lib/ourstory

# Clone/copy backend
cd /opt/ourstory-api
npm install --production

# Setup environment
cp .env.example .env
# Edit .env with production settings
nano .env

# Initialize database
npm run migrate

# Test it runs
npm start
# Should start without errors
```

#### Systemd Service Setup

Create `/etc/systemd/system/ourstory-api.service`:

```ini
[Unit]
Description=Our Story API
After=network.target

[Service]
Type=simple
User=ourstory
WorkingDirectory=/opt/ourstory-api
Environment="NODE_ENV=production"
Environment="DATABASE_PATH=/var/lib/ourstory/db.sqlite"
Environment="UPLOAD_DIR=/var/lib/ourstory/uploads"
Environment="PORT=3001"
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Create service user
sudo useradd -r -s /bin/false ourstory

# Fix permissions
sudo chown -R ourstory:ourstory /opt/ourstory-api
sudo chown -R ourstory:ourstory /var/lib/ourstory

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ourstory-api
sudo systemctl start ourstory-api
sudo systemctl status ourstory-api

# View logs
sudo journalctl -u ourstory-api -f
```

#### Nginx Proxy Manager Configuration

In NPM, create a proxy host:

- Domain: `ourstory-api.yourdomain.com`
- Scheme: `http`
- Forward Hostname/IP: `ubuntu-local-ip`
- Forward Port: `3001`
- Enable "Force SSL"
- Enable "Websockets Support" (optional)

### 2. Frontend Deployment (Raspberry Pi)

```bash
# On your development machine

# Build static site
cd ourstory-frontend
npm run build

# Output is in dist/
# Copy to Raspberry Pi
scp -r dist/ pi@raspberry-ip:/tmp/ourstory-dist/
```

```bash
# On Raspberry Pi

# Create directory
mkdir -p /opt/ourstory-frontend
cd /opt/ourstory-frontend

# Copy files from /tmp
cp -r /tmp/ourstory-dist/* .

# Use simple http-server or nginx
# Option 1: Using Node.js serve
sudo npm install -g serve
serve -s . -l 8088

# Option 2: Using Nginx
# Create /etc/nginx/sites-available/ourstory-frontend
```

#### Nginx Configuration (Alternative to Serve)

Create `/etc/nginx/sites-available/ourstory-frontend`:

```nginx
server {
    listen 8088;
    server_name localhost;
    root /opt/ourstory-frontend;

    location / {
        try_files $uri /index.html;
    }

    location /manifest.json {
        add_header Cache-Control "public, max-age=3600";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ourstory-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Nginx Proxy Manager Configuration

In NPM, create a proxy host:

- Domain: `ourstory.yourdomain.com`
- Scheme: `http`
- Forward Hostname/IP: `raspberry-pi-local-ip`
- Forward Port: `8088`
- Enable "Force SSL"

### 3. CORS Configuration

The backend CORS is configured to allow the frontend domain. Make sure .env has:

```env
CORS_ORIGIN=https://ourstory.yourdomain.com
```

If using multiple domains, you can modify the CORS setup in `src/server.js` to accept an array.

## API Documentation

### Public Endpoints

```
GET /api/health
→ { status: "ok", timestamp: "..." }

GET /api/memories
→ [ { id, title, date, section, body, location, images[], ... } ]

GET /api/memories/:id
→ { id, title, date, section, body, location, images[], ... }

GET /api/valentine
→ { title, body, signature, typedEffect, updatedAt }

GET /uploads/:filename
→ Binary image file
```

### Admin Endpoints (Require JWT)

```
POST /api/auth/login
Body: { username, password }
→ { success, token }

POST /api/auth/logout
→ { success }

GET /api/auth/me
→ { userId, username }

POST /api/memories
Body: { title, date, section, body, location }
→ { id, message }

PUT /api/memories/:id
Body: { title, date, section, body, location }
→ { message }

DELETE /api/memories/:id
→ { message }

POST /uploads/:memoryId/images
Body: multipart/form-data (files)
→ { images: [{ id, url, width, height }] }

DELETE /uploads/:memoryId/images/:imageId
→ { message }

PUT /uploads/:memoryId/images/reorder
Body: { order: [{ id, sortOrder }] }
→ { message }

PUT /api/valentine
Body: { title, body, signature, typedEffect }
→ { message }
```

## Troubleshooting

### Backend won't start

```bash
# Check Node version (needs 18+)
node --version

# Check port 3001 is available
sudo lsof -i :3001

# Check database path is writable
ls -la /var/lib/ourstory/
```

### Images not loading

- Verify upload directory exists and is writable
- Check CORS_ORIGIN in .env matches frontend domain
- Verify frontend can reach API domain (try API URL in browser)

### Admin login fails

- Check default username/password in .env
- Verify database was initialized: `npm run migrate`
- Check network connectivity between frontend and backend

### Slow image loading

- Backend generates full-size images by default
- Consider resizing in admin or setting up thumbnail generation with Sharp

## Performance Optimization

### Images

- Frontend lazy-loads images via Intersection Observer
- Images are validated (MIME type, size limit)
- Sharp processes uploads automatically

### PWA Features

- Install as app on phone: "Add to Home Screen"
- Offline fallback caching (can be extended)
- Full-screen, immersive experience

### Database

- SQLite is sufficient for private use
- Indexes on frequently queried columns
- Consider backup strategy for production

## Security Considerations

1. **Change Default Password:** Set strong ADMIN_PASSWORD in .env
2. **JWT Secret:** Use strong, random JWT_SECRET (min 32 characters)
3. **HTTPS Only:** Always use HTTPS in production (via NPM)
4. **Rate Limiting:** Login endpoint is rate-limited to 5 attempts/minute
5. **Backups:** Regularly backup `/var/lib/ourstory/` directory
6. **File Uploads:** Only image files allowed, max 10MB per file

## Backup & Restore

```bash
# Backup
sudo tar -czf ourstory-backup-$(date +%Y%m%d).tar.gz /var/lib/ourstory/

# Restore
tar -xzf ourstory-backup-20240101.tar.gz -C /
```

## License

Private project. Enjoy your story! ❤️

## Support

For issues, check:

1. Log files: `sudo journalctl -u ourstory-api`
2. Browser console (Frontend Dev Tools)
3. Network tab (check API requests)
4. Verify domains/IPs in NPM settings

---

**Built with ❤️ for your special moments**

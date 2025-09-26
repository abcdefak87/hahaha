# UNNET Production Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Server Requirements](#server-requirements)
- [PostgreSQL Setup](#postgresql-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment Steps](#deployment-steps)
- [PM2 Management](#pm2-management)
- [Nginx Configuration](#nginx-configuration)
- [SSL Setup](#ssl-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or newer (or any Linux distribution)
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores recommended

### Software Requirements
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or newer)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

## 🗄️ PostgreSQL Setup

### 1. Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE unnet_production;

# Create user with password
CREATE USER unnet_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE unnet_production TO unnet_user;

# Exit PostgreSQL
\q
```

### 2. Configure PostgreSQL for Remote Access (Optional)
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf
# Add: listen_addresses = 'localhost,your_server_ip'

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 🔐 Environment Configuration

### 1. Clone Repository
```bash
# Create application directory
sudo mkdir -p /var/www/unnet
sudo chown -R $USER:$USER /var/www/unnet

# Clone repository
cd /var/www/unnet
git clone https://github.com/your-username/your-repo.git .
```

### 2. Create Production Environment File
```bash
# Copy template
cp config/production.config.example server/.env.production

# Edit with your values
nano server/.env.production
```

**Important Environment Variables:**
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://unnet_user:your_secure_password@localhost:5432/unnet_production?schema=public"

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
SESSION_SECRET=<generate-with-openssl-rand-base64-32>

# Server
PORT=3001
NODE_ENV=production
SERVER_URL=https://your-domain.com

# Client
CLIENT_URL=https://your-domain.com
```

### 3. Generate Secure Secrets
```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Session Secret
openssl rand -base64 32
```

## 🚀 Deployment Steps

### Method 1: Using Deployment Script (Recommended)
```bash
# Make script executable
chmod +x scripts/deploy-production.sh

# Run full deployment (first time)
./scripts/deploy-production.sh --full

# Quick deployment (updates only)
./scripts/deploy-production.sh --quick

# Rollback if needed
./scripts/deploy-production.sh --rollback
```

### Method 2: Manual Deployment
```bash
# 1. Install dependencies
npm run install-all

# 2. Setup database
cd server
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# 3. Build applications
cd ..
npm run build:production

# 4. Start with PM2
npm run pm2:start
# OR
pm2 start ecosystem.config.js --env production
```

### Method 3: Using start-all.js with PM2
```bash
# Start all services with PM2
node start-all.js --pm2
```

## 📊 PM2 Management

### Basic Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs
pm2 logs unnet-api      # API logs only
pm2 logs unnet-client    # Client logs only
pm2 logs unnet-whatsapp  # WhatsApp bot logs only

# Restart services
pm2 restart all
pm2 restart unnet-api

# Stop services
pm2 stop all

# Delete services
pm2 delete all

# Monitor resources
pm2 monit

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

### PM2 Log Rotation
```bash
# Install log rotation module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 🔒 Nginx Configuration

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/unnet
```

```nginx
# Upstream definitions
upstream api_backend {
    server localhost:3001;
    keepalive 64;
}

upstream client_backend {
    server localhost:3000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API routes
    location /api {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Client application
    location / {
        proxy_pass http://client_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype;
}
```

### 2. Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/unnet /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔐 SSL Setup with Let's Encrypt

```bash
# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run

# Setup auto-renewal cron job
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📈 Monitoring

### 1. PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Web-based monitoring (PM2 Plus)
pm2 link <secret_key> <public_key>
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor system resources
htop

# Monitor disk I/O
sudo iotop

# Monitor network traffic
sudo nethogs
```

### 3. Application Health Checks
```bash
# Check API health
curl http://localhost:3001/health

# Check client
curl http://localhost:3000

# Check PM2 status
pm2 status
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection string
psql "postgresql://unnet_user:password@localhost:5432/unnet_production"

# Check logs
sudo tail -f /var/log/postgresql/*.log
```

#### 2. PM2 Process Crashing
```bash
# Check logs
pm2 logs --lines 100

# Increase memory limit in ecosystem.config.js
max_memory_restart: '2G'

# Clear PM2 logs
pm2 flush
```

#### 3. Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

#### 4. Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/unnet
sudo chown -R $USER:$USER /var/lib/unnet

# Fix permissions
chmod -R 755 /var/www/unnet
```

#### 5. WhatsApp Bot Not Connecting
```bash
# Check WhatsApp bot logs
pm2 logs unnet-whatsapp

# Clear session
rm -rf /var/lib/unnet/whatsapp/auth_info_baileys/*

# Restart bot
pm2 restart unnet-whatsapp
```

## 📝 Maintenance

### Regular Tasks
1. **Daily**: Check PM2 status and logs
2. **Weekly**: Review error logs and system resources
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Full backup and disaster recovery test

### Backup Strategy
```bash
# Database backup
pg_dump unnet_production > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf unnet_backup_$(date +%Y%m%d).tar.gz /var/www/unnet

# Automated backup (add to crontab)
0 2 * * * /var/www/unnet/scripts/backup.sh
```

### Update Process
```bash
# 1. Backup current version
./scripts/deploy-production.sh --backup

# 2. Pull latest changes
git pull origin main

# 3. Deploy updates
./scripts/deploy-production.sh --quick

# 4. If issues occur, rollback
./scripts/deploy-production.sh --rollback
```

## 🚨 Security Checklist

- [ ] Strong database passwords
- [ ] Environment variables secured
- [ ] SSL certificates installed
- [ ] Firewall configured (ufw)
- [ ] Regular security updates
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation active
- [ ] SQL injection prevention
- [ ] XSS protection headers

## 📞 Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Review documentation
3. Check system status: `pm2 status`
4. Contact system administrator

---

**Last Updated**: December 2024
**Version**: 1.0.0

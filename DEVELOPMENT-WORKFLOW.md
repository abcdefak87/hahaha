# Development & Update Workflow Guide

## 🔄 Development Cycle

### 1. Local Development Setup (Windows)

#### First Time Setup
```bash
# Clone repository
git clone https://github.com/abcdefak87/gitcomgitpush.git
cd gitcomgitpush

# Setup server
cd server
npm install
npx prisma generate
npx prisma db push

# Create test database
node ../scripts/create-users-windows.bat

# Setup client
cd ../client
npm install
```

#### Start Development Environment
```bash
# Terminal 1 - Start API
cd server
npm run dev

# Terminal 2 - Start Client
cd client
npm run dev

# Access at:
# - Web: http://localhost:3000
# - API: http://localhost:3001
```

### 2. Making Changes

#### For Bug Fixes
1. Create new branch
```bash
git checkout -b fix/bug-name
```

2. Make changes
3. Test locally
4. Commit changes
```bash
git add .
git commit -m "Fix: description of bug fix"
```

#### For New Features
1. Create feature branch
```bash
git checkout -b feature/feature-name
```

2. Develop feature
3. Test thoroughly
4. Commit changes
```bash
git add .
git commit -m "Feature: description of new feature"
```

### 3. Testing Before Production

#### Local Testing Checklist
- [ ] Feature/fix works as expected
- [ ] No console errors
- [ ] Database migrations work
- [ ] API endpoints respond correctly
- [ ] UI displays properly
- [ ] Authentication still works

#### Test Commands
```bash
# Run server tests (if available)
cd server
npm test

# Build client to check for errors
cd client
npm run build

# Check for linting errors
npm run lint
```

### 4. Push to GitHub
```bash
# Push branch
git push origin feature/feature-name

# Or merge to master first
git checkout master
git merge feature/feature-name
git push origin master
```

## 🚀 Update Production Server

### Method 1: Quick Update (Recommended)

Create this script on your server:

```bash
#!/bin/bash
# File: /var/www/gitcomgitpush/update-production.sh

echo "🔄 Starting production update..."

# Backup database first
cp server/prisma/dev.db server/prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Pull latest changes
git pull origin master

# Update server dependencies if package.json changed
cd server
if git diff HEAD@{1} --name-only | grep -q "server/package.json"; then
    echo "📦 Updating server dependencies..."
    npm install
    npx prisma generate
fi

# Update client dependencies if package.json changed
cd ../client
if git diff HEAD@{1} --name-only | grep -q "client/package.json"; then
    echo "📦 Updating client dependencies..."
    npm install
fi

# Rebuild client if any client files changed
if git diff HEAD@{1} --name-only | grep -q "client/"; then
    echo "🔨 Building client..."
    npm run build
fi

# Run database migrations if schema changed
cd ../server
if git diff HEAD@{1} --name-only | grep -q "prisma/schema.prisma"; then
    echo "🗄️ Running database migrations..."
    npx prisma db push
fi

# Restart services
echo "🔄 Restarting services..."
pm2 restart all

echo "✅ Update complete!"
pm2 status
```

Then run:
```bash
cd /var/www/gitcomgitpush
chmod +x update-production.sh
./update-production.sh
```

### Method 2: Manual Update

```bash
# 1. SSH to server
ssh root@172.17.2.3

# 2. Go to project directory
cd /var/www/gitcomgitpush

# 3. Backup database
cp server/prisma/dev.db server/prisma/dev.db.backup

# 4. Pull latest changes
git pull origin master

# 5. Update dependencies (if needed)
cd server && npm install
cd ../client && npm install

# 6. Build client (if frontend changed)
cd client && npm run build

# 7. Run migrations (if database schema changed)
cd ../server && npx prisma db push

# 8. Restart services
pm2 restart all

# 9. Check status
pm2 status
```

### Method 3: Zero-Downtime Update

```bash
# Use PM2 reload instead of restart
pm2 reload all

# This will gracefully reload without dropping connections
```

## 🧪 Testing Strategy

### 1. Local Testing (Windows)
- Develop and test on local machine
- Use same database structure (SQLite)
- Test all affected features

### 2. Staging Environment (Optional)
- Create a staging server (clone of production)
- Test updates there first
- If OK, apply to production

### 3. Production Testing
- After update, immediately test:
  - Login functionality
  - Core features
  - New changes
  - WhatsApp connection

## 🔄 Rollback Plan

If something goes wrong:

```bash
# 1. Restore database
cp server/prisma/dev.db.backup server/prisma/dev.db

# 2. Revert to previous commit
git log --oneline -n 5  # Find previous commit
git reset --hard <commit-hash>

# 3. Restart services
pm2 restart all
```

## 📝 Best Practices

### DO's ✅
- Always backup database before update
- Test locally first
- Use git branches for features
- Check PM2 logs after update
- Document major changes

### DON'T's ❌
- Never update directly on production without testing
- Don't skip database backups
- Don't update during peak hours
- Don't forget to rebuild client after frontend changes

## 🛠️ Common Update Scenarios

### Scenario 1: Fix a bug in API
```bash
# Local
1. Fix bug in server/
2. Test locally
3. Commit & push

# Server
1. git pull
2. pm2 restart unnet-api
```

### Scenario 2: Update UI
```bash
# Local
1. Update client/
2. Test with npm run dev
3. Build test: npm run build
4. Commit & push

# Server
1. git pull
2. cd client && npm run build
3. pm2 restart unnet-client
```

### Scenario 3: Database schema change
```bash
# Local
1. Update prisma/schema.prisma
2. Run: npx prisma db push
3. Test thoroughly
4. Commit & push

# Server
1. Backup database!
2. git pull
3. cd server && npx prisma db push
4. pm2 restart all
```

### Scenario 4: Add new dependency
```bash
# Local
1. npm install new-package
2. Update code
3. Test
4. Commit & push (including package.json)

# Server
1. git pull
2. npm install
3. pm2 restart affected service
```

## 🔍 Monitoring After Update

```bash
# Check logs
pm2 logs --lines 50

# Monitor real-time
pm2 monit

# Check specific service
pm2 logs unnet-api --lines 100

# System health
./scripts/health-check.sh
```

## 💡 Tips

1. **Schedule updates**: Do updates during low-traffic hours
2. **Communicate**: Inform users about planned maintenance
3. **Test first**: Always test on local before production
4. **Backup**: Database backup is mandatory
5. **Monitor**: Watch logs for 5-10 minutes after update
6. **Document**: Keep a log of what was updated and when

---
Last Updated: September 2024

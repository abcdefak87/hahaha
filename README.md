# ISP Management System

🚀 **Sistem Manajemen ISP Terintegrasi dengan WhatsApp Bot**

Aplikasi web modern untuk manajemen ISP (Internet Service Provider) yang mencakup instalasi, perbaikan, inventory, dan komunikasi otomatis dengan pelanggan melalui WhatsApp.

> **🖥️ Windows Development Version**  
> Versi ini telah dioptimalkan untuk pengembangan di Windows. Semua konfigurasi Linux/production telah dihapus untuk fokus pada development.

## ✨ Fitur Utama

### 📊 Dashboard & Monitoring

- Real-time monitoring status jaringan
- Statistik pelanggan dan gangguan
- Grafik performa dan analitik

### 👥 Manajemen Pelanggan

- Database pelanggan lengkap
- Tracking status berlangganan
- Riwayat pembayaran dan gangguan

### 🔧 Sistem Teknisi

- Manajemen tugas instalasi (PSB)
- Penanganan gangguan
- Tracking lokasi dan status pekerjaan
- Laporan harian teknisi

### 📦 Inventory Management

- Stok modem dan peralatan
- Tracking serial number
- Riwayat penggunaan barang
- Alert stok minimum

### 💬 WhatsApp Integration

- Bot otomatis untuk customer service
- Notifikasi gangguan ke pelanggan
- Reminder pembayaran
- Broadcast informasi maintenance

### 🔐 Security & Authentication

- JWT-based authentication
- Role-based access control (Admin, Teknisi, CS)
- OTP verification
- Session management

## 🏗️ Arsitektur

### Frontend (Client)

- **Framework**: Next.js 14 dengan TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios

### Backend (Server)

- **Runtime**: Node.js dengan Express.js
- **Database**: SQLite dengan Prisma ORM
- **Authentication**: JWT + OTP
- **Real-time**: Socket.IO Server
- **WhatsApp**: Baileys WhatsApp Web API
- **File Upload**: Multer

## 📁 Struktur Proyek

```bash
isp-management-system/
├── client/                 # Next.js Frontend Application
│   ├── app/               # Next.js App Router
│   ├── components/        # Reusable React Components
│   ├── lib/              # Utilities, API clients, helpers
│   ├── hooks/            # Custom React Hooks
│   ├── contexts/         # React Context Providers
│   └── public/           # Static assets
├── server/                # Express.js Backend API
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic layer
│   ├── middleware/       # Express middlewares
│   ├── prisma/           # Database schema & migrations
│   ├── utils/            # Helper functions
│   └── config/           # Server configuration
├── scripts/              # Utility & maintenance scripts
├── auth_info_baileys/    # WhatsApp session (gitignored)
└── qr-codes/            # Generated QR codes (gitignored)
```

## 🛠️ Instalasi & Setup

### Prerequisites

- **Node.js**: v18.0.0 atau lebih tinggi
- **npm**: v8.0.0 atau lebih tinggi
- **Git**: Untuk version control
- **SQLite**: Database (otomatis terinstall dengan dependencies)

### 1. Clone Repository

```bash
git clone https://github.com/abcdefak87/gitcomgitpush.git
cd gitcomgitpush
```

### 2. Install Dependencies

#### Metode 1: Install Semua Sekaligus (Recommended)

```bash
npm run install-all
```

#### Metode 2: Install Manual

```bash
# Root dependencies
npm install

# Client dependencies
cd client
npm install
cd ..

# Server dependencies
cd server
npm install
cd ..
```

### 3. Database Setup

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev --name init

# (Optional) Seed database dengan data sample
npx prisma db seed
```

### 4. Environment Variables

**Buat file `.env` di folder `client`:**

```bash
cd client
cp .env.example .env.local  # Jika ada .env.example
# atau buat manual:
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_WS_URL=http://localhost:3001" >> .env.local
```

**Buat file `.env` di folder `server`:**

```bash
cd server
cp .env.example .env  # Jika ada .env.example
# atau buat manual dengan content berikut:
```

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# WhatsApp Configuration (Optional)
WHATSAPP_SESSION_PATH=./auth_info_baileys
WHATSAPP_QR_PATH=./qr-codes

# CORS Settings
CLIENT_URL=http://localhost:3000
```

### 5. Menjalankan Aplikasi

#### Metode 1: Run All in One (Recommended)

```bash
# Dari root directory
npm run dev
```

#### Metode 2: Run Terpisah

*Terminal 1 - Backend Server:*

```bash
cd server
npm run dev
```

*Terminal 2 - Frontend Client:*

```bash
cd client
npm run dev
```

#### Metode 3: Menggunakan start-all.js

```bash
node start-all.js
```

### 6. Akses Aplikasi

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:3001>
- **API Documentation**: <http://localhost:3001/api-docs> (jika tersedia)

### 7. Default Login Credentials

```text
Superadmin: superadmin@unnet.com / (contact admin for password)
Admin:      admin@unnet.com / (contact admin for password)
Operator:   operator@isp.com / Operator@123
Viewer:     viewer@isp.com / Viewer@123
```

⚠️ **PENTING**: Segera ganti password default setelah login pertama!

## 📱 WhatsApp Integration

### Setup WhatsApp Bot

1. **Start WhatsApp Service**

   ```bash
   # Jalankan dari root directory
   node scripts/whatsapp-bot.js
   ```

2. **Scan QR Code**
   - QR code akan muncul di terminal
   - Atau akses: <http://localhost:3001/api/whatsapp/qr>
   - Scan dengan WhatsApp di HP Anda

3. **Verifikasi Koneksi**
   - Cek status: <http://localhost:3001/api/whatsapp/status>
   - Session akan tersimpan di `auth_info_baileys/`

### Fitur WhatsApp Bot

#### 🤖 Auto-Response Commands

- `!status` - Cek status layanan
- `!tagihan` - Cek tagihan bulanan
- `!bantuan` - Daftar command yang tersedia
- `!teknisi` - Request teknisi

#### 📢 Broadcast Features

- Notifikasi maintenance
- Reminder pembayaran
- Info gangguan massal
- Promo dan penawaran

#### 🔔 Automated Notifications

- Konfirmasi instalasi baru
- Update status gangguan
- Reminder jatuh tempo
- Notifikasi teknisi on the way

## 🗄️ Database Schema

### Tabel Utama

| Table | Description |
|-------|-------------|
| **users** | Admin, CS, dan user sistem lainnya |
| **customers** | Data pelanggan ISP |
| **technicians** | Data teknisi lapangan |
| **psb_installations** | Data pemasangan baru (PSB) |
| **gangguan_tickets** | Tiket gangguan/keluhan |
| **inventory** | Stok modem dan peralatan |
| **inventory_transactions** | Log transaksi inventory |
| **whatsapp_messages** | Log pesan WhatsApp |
| **notifications** | Notifikasi sistem |

### Database Management

```bash
cd server

# Prisma Studio (GUI untuk manage database)
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (HATI-HATI: Akan hapus semua data!)
npx prisma migrate reset
```

## 🔧 NPM Scripts

### Root Level Scripts

```bash
npm run dev           # Run client & server concurrently
npm run install-all   # Install all dependencies
npm run build         # Build client for production
npm run start:prod    # Run production mode
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
```

### Client Scripts

```bash
cd client
npm run dev           # Start development server (port 3000)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Check linting
npm run type-check    # TypeScript type checking
```

### Server Scripts

```bash
cd server
npm run dev           # Start development server (port 3001)
npm run start         # Start production server
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
```

## 🔐 Authentication & Security

### Authentication Flow

1. User login dengan username/password
2. Server generate JWT token
3. Client simpan token di localStorage/cookie
4. Setiap request include token di header
5. Server verify token untuk protected routes

### Security Features

- **JWT Token**: Expired dalam 7 hari
- **Password Hashing**: Bcrypt dengan salt rounds 10
- **Rate Limiting**: Max 100 requests per 15 minutes
- **CORS Protection**: Configured untuk specific origins
- **Input Validation**: Menggunakan Joi/Zod
- **SQL Injection Protection**: Prisma ORM parameterized queries

### User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full access ke semua fitur |
| **Teknisi** | Akses PSB, gangguan, inventory |
| **CS** | Akses customer data, WhatsApp |
| **Viewer** | Read-only access |

## 📊 API Documentation

### Base URL

```text
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | Register new user |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### Customer Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | Get all customers |
| GET | `/customers/:id` | Get customer by ID |
| POST | `/customers` | Create new customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |
| GET | `/customers/search` | Search customers |

### PSB (Pemasangan Baru)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/psb` | Get all installations |
| GET | `/psb/:id` | Get installation by ID |
| POST | `/psb` | Create new installation |
| PUT | `/psb/:id` | Update installation |
| PUT | `/psb/:id/status` | Update status only |
| DELETE | `/psb/:id` | Cancel installation |

### Gangguan (Trouble Tickets)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gangguan` | Get all tickets |
| GET | `/gangguan/:id` | Get ticket by ID |
| POST | `/gangguan` | Create new ticket |
| PUT | `/gangguan/:id` | Update ticket |
| PUT | `/gangguan/:id/assign` | Assign to technician |
| PUT | `/gangguan/:id/resolve` | Mark as resolved |

### WhatsApp Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/whatsapp/status` | Get bot status |
| GET | `/whatsapp/qr` | Get QR code |
| POST | `/whatsapp/send` | Send message |
| POST | `/whatsapp/broadcast` | Send broadcast |
| GET | `/whatsapp/messages` | Get message history |

## 🚀 Deployment Guide

### Production Build

1. **Build Frontend**

   ```bash
   cd client
   npm run build
   ```

2. **Prepare Backend**

   ```bash
   cd server
   npm install --production
   npx prisma migrate deploy
   ```

### Deployment Options

#### Option 1: VPS (Ubuntu/Debian)

```bash
# Install Node.js & PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/abcdefak87/gitcomgitpush.git
cd gitcomgitpush
npm run install-all

# Setup environment
cp server/.env.example server/.env
cp client/.env.example client/.env.local
# Edit .env files dengan production values

# Build and start
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Option 2: Docker

```dockerfile
# Dockerfile example tersedia di repository
docker build -t isp-management .
docker run -p 3000:3000 -p 3001:3001 isp-management
```

#### Option 3: Vercel + Railway

- Frontend: Deploy ke Vercel
- Backend: Deploy ke Railway/Render
- Database: Use Railway PostgreSQL

### Environment Variables Production

```env
# Server Production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=generate-strong-secret-key
CLIENT_URL=https://your-domain.com

# Client Production
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
```

## 🤝 Contribution Guidelines

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'tambah: fitur baru'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 Commit Convention

Gunakan format commit dalam bahasa Indonesia:

- `tambah: fitur baru untuk [deskripsi]`
- `perbaiki: bug pada [area yang bermasalah]`
- `perbarui: konfigurasi [nama komponen]`
- `hapus: kode yang tidak digunakan`
- `refactor: struktur kode [nama modul]`

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Error

```bash
# Regenerate Prisma Client
cd server
npx prisma generate
npx prisma migrate deploy

# Jika masih error, reset database
npx prisma migrate reset
```

#### 2. WhatsApp Bot Issues

```bash
# Hapus session lama
rm -rf server/auth_info_baileys/*

# Restart WhatsApp service
node scripts/whatsapp-bot.js

# Scan QR code ulang
```

#### 3. Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

#### 4. npm install Failed

```bash
# Clear cache
npm cache clean --force

# Delete node_modules & lock files
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
rm -rf server/node_modules server/package-lock.json

# Reinstall
npm run install-all
```

#### 5. Build Failed

```bash
# Check Node version
node --version  # Should be 18+

# Clear Next.js cache
rm -rf client/.next

# Rebuild
cd client && npm run build
```

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd server
npm test
npm run test:watch
npm run test:coverage

# Frontend tests
cd client
npm test
npm run test:e2e
```

## 📈 Performance Optimization

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Next.js Image component
- **API Caching**: Redis integration ready
- **Database Indexing**: Optimized queries
- **Code Splitting**: Automatic with Next.js

## 🔄 Updates & Maintenance

### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update dependencies
npm update

# Update to latest major versions (careful!)
npm install -g npm-check-updates
ncu -u
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [abcdefak87](https://github.com/abcdefak87)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Baileys for WhatsApp Web API
- Prisma team for the excellent ORM
- All contributors who have helped this project

## 📞 Support

For support, email: your-email@example.com or create an issue in this repository.

---

<div align="center">
  <b>Built with ❤️ for efficient ISP management</b>
  <br>
  <sub>© 2024 ISP Management System. All rights reserved.</sub>
</div>

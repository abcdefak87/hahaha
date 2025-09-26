#!/usr/bin/env node

/**
 * Script untuk update .env file dengan secrets yang di-generate
 * Usage: node scripts/update-env-secrets.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path ke file .env
const envPath = path.join(__dirname, '..', 'server', '.env');
const envExamplePath = path.join(__dirname, '..', 'server', '.env.example');

// Generate secure random secret
const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Secrets yang akan di-generate atau digunakan
const secrets = {
  JWT_SECRET: generateSecret(64),
  JWT_REFRESH_SECRET: generateSecret(64),
  CSRF_SECRET: generateSecret(64)
};

// Fungsi untuk membaca file .env yang ada
const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log(`📝 File ${filePath} tidak ditemukan, akan dibuat baru...`);
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) return;
    
    const [key, ...valueParts] = line.split('=');
    if (key) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      env[key.trim()] = value;
    }
  });
  
  return env;
};

// Fungsi untuk menulis file .env
const writeEnvFile = (filePath, envData) => {
  const lines = [];
  
  // Header
  lines.push('# Server Environment Variables');
  lines.push('# Auto-generated secrets - DO NOT COMMIT TO GIT');
  lines.push('# Generated at: ' + new Date().toISOString());
  lines.push('');
  
  // Server Configuration
  lines.push('# Server Configuration');
  lines.push(`PORT=${envData.PORT || '3001'}`);
  lines.push(`NODE_ENV=${envData.NODE_ENV || 'development'}`);
  lines.push('');
  
  // Database
  lines.push('# Database');
  lines.push(`DATABASE_URL="${envData.DATABASE_URL || 'file:./prisma/dev.db'}"`);
  lines.push('');
  
  // Authentication - Use generated secrets
  lines.push('# Authentication (Auto-generated)');
  lines.push(`JWT_SECRET="${envData.JWT_SECRET || secrets.JWT_SECRET}"`);
  lines.push(`JWT_EXPIRES_IN="${envData.JWT_EXPIRES_IN || '7d'}"`);
  lines.push(`JWT_REFRESH_SECRET="${envData.JWT_REFRESH_SECRET || secrets.JWT_REFRESH_SECRET}"`);
  lines.push(`CSRF_SECRET="${envData.CSRF_SECRET || secrets.CSRF_SECRET}"`);
  lines.push('');
  
  // WhatsApp Configuration
  lines.push('# WhatsApp Configuration');
  lines.push(`WHATSAPP_SESSION_PATH="${envData.WHATSAPP_SESSION_PATH || './auth_info_baileys'}"`);
  lines.push(`WHATSAPP_QR_PATH="${envData.WHATSAPP_QR_PATH || './qr-codes'}"`);
  lines.push('');
  
  // CORS Settings
  lines.push('# CORS Settings');
  lines.push(`CLIENT_URL=${envData.CLIENT_URL || 'http://localhost:3000'}`);
  lines.push('');
  
  // System is PHONE-FIRST - No email configuration
  lines.push('# SYSTEM IS PHONE-FIRST WITH WHATSAPP-ONLY COMMUNICATION');
  lines.push('# NO EMAIL SUPPORT - DO NOT ADD EMAIL FUNCTIONALITY');
  lines.push('');
  
  // Rate Limiting
  lines.push('# Rate Limiting');
  lines.push(`RATE_LIMIT_WINDOW_MS=${envData.RATE_LIMIT_WINDOW_MS || '900000'}`);
  lines.push(`RATE_LIMIT_MAX_REQUESTS=${envData.RATE_LIMIT_MAX_REQUESTS || '100'}`);
  lines.push('');
  
  // Additional custom variables
  Object.keys(envData).forEach(key => {
    // Skip if already written above
    const skipKeys = [
      'PORT', 'NODE_ENV', 'DATABASE_URL', 
      'JWT_SECRET', 'JWT_EXPIRES_IN', 'JWT_REFRESH_SECRET', 'CSRF_SECRET',
      'WHATSAPP_SESSION_PATH', 'WHATSAPP_QR_PATH',
      'CLIENT_URL', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS'
    ];
    
    if (!skipKeys.includes(key)) {
      lines.push(`${key}=${envData[key]}`);
    }
  });
  
  fs.writeFileSync(filePath, lines.join('\n'));
};

// Main function
const updateEnv = () => {
  console.log('🔧 ISP Management System - Environment Setup');
  console.log('============================================');
  console.log('');
  
  try {
    // Baca existing .env file
    const existingEnv = readEnvFile(envPath);
    
    // Check apakah secrets sudah ada
    const needsUpdate = !existingEnv.JWT_SECRET || 
                       !existingEnv.JWT_REFRESH_SECRET || 
                       !existingEnv.CSRF_SECRET;
    
    if (!needsUpdate) {
      console.log('✅ Secrets sudah ada di .env file');
      console.log('');
      console.log('Current secrets status:');
      console.log('- JWT_SECRET: ' + (existingEnv.JWT_SECRET ? '✓ Set' : '✗ Missing'));
      console.log('- JWT_REFRESH_SECRET: ' + (existingEnv.JWT_REFRESH_SECRET ? '✓ Set' : '✗ Missing'));
      console.log('- CSRF_SECRET: ' + (existingEnv.CSRF_SECRET ? '✓ Set' : '✗ Missing'));
      console.log('');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Apakah Anda ingin generate ulang secrets? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          // Generate new secrets
          Object.keys(secrets).forEach(key => {
            existingEnv[key] = secrets[key];
          });
          
          writeEnvFile(envPath, existingEnv);
          console.log('');
          console.log('✅ Secrets berhasil di-generate ulang!');
          console.log('');
          console.log('Generated secrets:');
          console.log('==================');
          Object.keys(secrets).forEach(key => {
            console.log(`${key}="${secrets[key]}"`);
            console.log('');
          });
          console.log('⚠️  PENTING: Restart server untuk menggunakan secrets baru');
        } else {
          console.log('✅ Menggunakan secrets yang ada');
        }
        
        rl.close();
        console.log('');
        console.log('🚀 Anda dapat menjalankan aplikasi dengan: npm run dev');
      });
    } else {
      // Generate dan update secrets
      Object.keys(secrets).forEach(key => {
        if (!existingEnv[key]) {
          existingEnv[key] = secrets[key];
        }
      });
      
      // Backup existing .env if exists
      if (fs.existsSync(envPath)) {
        const backupPath = envPath + '.backup.' + Date.now();
        fs.copyFileSync(envPath, backupPath);
        console.log(`📦 Backup file .env lama ke: ${backupPath}`);
      }
      
      // Write updated .env
      writeEnvFile(envPath, existingEnv);
      
      console.log('✅ File .env berhasil di-update dengan secrets baru!');
      console.log('');
      console.log('Generated secrets:');
      console.log('==================');
      Object.keys(secrets).forEach(key => {
        if (!existingEnv[key] || existingEnv[key] === secrets[key]) {
          console.log(`${key}="${secrets[key]}"`);
          console.log('');
        }
      });
      
      console.log('⚠️  PENTING:');
      console.log('1. File .env sudah di-update');
      console.log('2. Restart server untuk menggunakan secrets baru');
      console.log('3. JANGAN commit file .env ke Git');
      console.log('');
      console.log('🚀 Anda dapat menjalankan aplikasi dengan: npm run dev');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Run the script
updateEnv();

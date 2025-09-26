#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Process tracking
const processes = [];
let isShuttingDown = false;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to log with colors
function log(message, color = 'white') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// Function to show banner
function showBanner(mode = 'development') {
  console.clear();
  const title = mode === 'pm2' ? 'UNNET PM2 PRODUCTION LAUNCHER' : 'UNNET WEB APP LAUNCHER';
  const env = mode === 'pm2' ? 'Production Mode with PM2' : 'Development Mode';
  
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log(`║                    ${title.padEnd(42)}║`, 'cyan');
  log('║                                                              ║', 'cyan');
  log(`║  🚀 ${env.padEnd(56)} ║`, 'cyan');
  log('║                                                              ║', 'cyan');
  log('║  Client:  http://localhost:3000                             ║', 'cyan');
  log('║  Server:  http://localhost:3001                             ║', 'cyan');
  log('║  QR Code: http://localhost:3001/qr/whatsapp-qr.png          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  console.log();
}

// Function to check if directory exists
function checkDirectory(dir) {
  if (!fs.existsSync(dir)) {
    log(`❌ Directory not found: ${dir}`, 'red');
    return false;
  }
  return true;
}

// Function to check if package.json exists
function checkPackageJson(dir) {
  const packagePath = path.join(dir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    log(`❌ package.json not found in: ${dir}`, 'red');
    return false;
  }
  return true;
}

// Function to install dependencies if needed
async function installDependencies(dir, name) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log(`📦 Installing dependencies for ${name}...`, 'yellow');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: dir,
        stdio: 'inherit',
        shell: true
      });

      npm.on('close', (code) => {
        if (code === 0) {
          log(`✅ Dependencies installed for ${name}`, 'green');
          resolve();
        } else {
          log(`❌ Failed to install dependencies for ${name}`, 'red');
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  } else {
    log(`✅ Dependencies already installed for ${name}`, 'green');
    return Promise.resolve();
  }
}

// Function to start a process
function startProcess(command, args, cwd, name, color) {
  log(`🚀 Starting ${name}...`, color);
  
  const process = spawn(command, args, {
    cwd: cwd,
    stdio: 'pipe',
    shell: true
  });

  // Store process info
  const processInfo = {
    process: process,
    name: name,
    color: color
  };
  processes.push(processInfo);

  // Handle process output
  process.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      const lines = output.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log(`[${name}] ${line}`, color);
        }
      });
    }
  });

  process.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      const lines = output.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log(`[${name}] ${line}`, 'red');
        }
      });
    }
  });

  process.on('close', (code) => {
    if (!isShuttingDown) {
      log(`⚠️  ${name} exited with code ${code}`, 'yellow');
    }
  });

  process.on('error', (error) => {
    log(`❌ Error starting ${name}: ${error.message}`, 'red');
  });

  return process;
}

// Function to ask for WhatsApp connection option
function askWhatsAppConnectionOption() {
  return new Promise((resolve) => {
    console.log();
    log('🔐 WhatsApp Connection Options:', 'yellow');
    log('1. Scan QR Code baru (hapus session lama)', 'white');
    log('2. Gunakan session lama (jika ada)', 'white');
    log('3. OTP Pairing dengan nomor HP', 'white');
    console.log();
    
    rl.question('Pilih opsi (1/2/3): ', (answer) => {
      const choice = answer.trim();
      if (choice === '1') {
        log('✅ Menggunakan QR scan baru', 'green');
        resolve('new');
      } else if (choice === '2') {
        log('✅ Menggunakan session lama', 'green');
        resolve('old');
      } else if (choice === '3') {
        log('✅ Menggunakan OTP Pairing', 'green');
        resolve('otp');
      } else {
        log('⚠️  Pilihan tidak valid, menggunakan session lama', 'yellow');
        resolve('old');
      }
    });
  });
}

// Function to setup WhatsApp session
async function setupWhatsAppSession(connectionOption) {
  // Bot menggunakan auth_info_baileys di root directory, bukan di server/
  const authDir = path.join(__dirname, 'auth_info_baileys');
  
  if (connectionOption === 'new') {
    log('🗑️  Menghapus session WhatsApp lama...', 'yellow');
    
    if (fs.existsSync(authDir)) {
      try {
        // Hapus seluruh directory dan buat ulang
        fs.rmSync(authDir, { recursive: true, force: true });
        log('✅ Session lama berhasil dihapus (directory dihapus)', 'green');
      } catch (error) {
        log(`⚠️  Error deleting session directory: ${error.message}`, 'yellow');
      }
    } else {
      log('ℹ️  Tidak ada session lama yang perlu dihapus', 'cyan');
    }
  } else if (connectionOption === 'otp') {
    log('📱 Menggunakan OTP Pairing untuk WhatsApp', 'green');
    log('💡 Setelah server berjalan, gunakan endpoint /api/whatsapp/pairing untuk generate OTP', 'cyan');
  } else {
    log('📱 Menggunakan session WhatsApp yang ada', 'green');
  }
}

// Function to show help
function showHelp() {
  console.log();
  log('📖 Usage:', 'cyan');
  log('  node start-all.js [options]', 'white');
  console.log();
  log('🔧 Options:', 'cyan');
  log('  --new-qr     Force new QR scan (delete old session)', 'white');
  log('  --old-qr     Use existing session', 'white');
  log('  --otp        Use OTP pairing with phone number', 'white');
  log('  --help       Show this help message', 'white');
  log('⌨️  Controls:', 'cyan');
  log('  Ctrl+C       Stop all services', 'white');
  log('  q + Enter    Quit gracefully', 'white');
  console.log();
  log('🚀 Development Commands:', 'cyan');
  log('  npm run dev                   Start development mode', 'white');
  log('  npm run clean-start           Clean ports and start', 'white');
  log('  npm run start:full            Start with WhatsApp bot', 'white');
  console.log();
}

// Function to handle graceful shutdown
function gracefulShutdown() {
  if (isShuttingDown) return;
  
  isShuttingDown = true;
  log('\n🛑 Shutting down all services...', 'yellow');
  
  processes.forEach(({ process, name }) => {
    if (process && !process.killed) {
      log(`   Stopping ${name}...`, 'yellow');
      process.kill('SIGTERM');
    }
  });
  
  setTimeout(() => {
    processes.forEach(({ process, name }) => {
      if (process && !process.killed) {
        log(`   Force killing ${name}...`, 'red');
        process.kill('SIGKILL');
      }
    });
    
    log('✅ All services stopped', 'green');
    rl.close();
    process.exit(0);
  }, 5000);
}

// PM2 functionality removed - use Windows development mode only

// Main function
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    return;
  }
  
  // PM2 mode removed - Windows development only
  if (args.includes('--pm2')) {
    log('❌ PM2 mode has been removed. Use development mode only.', 'red');
    log('💡 Run without --pm2 flag for Windows development', 'yellow');
    process.exit(1);
  }
  
  let connectionOption = 'old'; // default
  
  if (args.includes('--new-qr')) {
    connectionOption = 'new';
  } else if (args.includes('--old-qr')) {
    connectionOption = 'old';
  } else if (args.includes('--otp')) {
    connectionOption = 'otp';
  } else {
    connectionOption = await askWhatsAppConnectionOption();
  }
  
  showBanner('development');
  
  // Check directories
  log('🔍 Checking project structure...', 'blue');
  
  if (!checkDirectory('client') || !checkDirectory('server')) {
    log('❌ Required directories not found. Please run from project root.', 'red');
    process.exit(1);
  }
  
  if (!checkPackageJson('client') || !checkPackageJson('server')) {
    log('❌ Required package.json files not found.', 'red');
    process.exit(1);
  }
  
  log('✅ Project structure verified', 'green');
  
  // Install dependencies
  try {
    await installDependencies('client', 'Client');
    await installDependencies('server', 'Server');
  } catch (error) {
    log(`❌ Failed to install dependencies: ${error.message}`, 'red');
    process.exit(1);
  }
  
  // Setup WhatsApp session
  await setupWhatsAppSession(connectionOption);
  
  // Start services
  log('🚀 Starting all services...', 'blue');
  console.log();
  
  // Start server first
  startProcess('npm', ['run', 'dev'], 'server', 'Server', 'green');
  
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start client
  startProcess('npm', ['run', 'dev'], 'client', 'Client', 'blue');
  
  // Wait a bit for client to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Start WhatsApp bot based on connection option
  if (connectionOption === 'new') {
    // Use the integrated bot for new connections (with all features)
    startProcess('node', ['scripts/whatsapp-bot-integrated.js'], '.', 'WhatsApp Bot (New QR)', 'magenta');
  } else if (connectionOption === 'otp') {
    // Use the integrated bot for OTP pairing
    startProcess('node', ['scripts/whatsapp-bot-integrated.js'], '.', 'WhatsApp Bot (OTP)', 'magenta');
  } else {
    // Use the integrated bot for existing sessions (with all features)
    startProcess('node', ['scripts/whatsapp-bot-integrated.js'], '.', 'WhatsApp Bot (Existing Session)', 'magenta');
  }
  
  // Setup signal handlers
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  
  // Setup keyboard input handler
  rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'q') {
      gracefulShutdown();
    }
  });
  
  log('✅ All services started successfully!', 'green');
  log('🌐 Client: http://localhost:3000', 'cyan');
  log('🔧 Server: http://localhost:3001', 'cyan');
  
  if (connectionOption === 'new') {
    log('📱 QR Code: http://localhost:3001/qr/whatsapp-qr.png (High Quality)', 'cyan');
    log('💡 Buka file PNG untuk scan yang sempurna!', 'yellow');
  } else {
    log('📱 QR Code: http://localhost:3001/qr/whatsapp-qr.png', 'cyan');
  }
  
  log('🤖 WhatsApp Bot: Running in background', 'cyan');
  console.log();
  log('💡 Press Ctrl+C or type "q" + Enter to stop all services', 'yellow');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, 'red');
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  gracefulShutdown();
});

// Run main function
main().catch((error) => {
  log(`❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});


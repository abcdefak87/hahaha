#!/usr/bin/env node

/**
 * Clean Start Script - Membersihkan port dan start aplikasi dengan benar
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function log(message, color = 'white') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// Function to kill processes on specific ports
function killPortProcesses(ports) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    let command;
    
    if (isWindows) {
      // Windows command
      const portList = ports.join(' ');
      command = `for /f "tokens=5" %a in ('netstat -aon ^| findstr ":${portList}"') do taskkill /f /pid %a`;
    } else {
      // Unix/Linux/Mac command
      const portList = ports.join(' ');
      command = `lsof -ti:${portList} | xargs kill -9`;
    }
    
    log(`🧹 Cleaning ports: ${ports.join(', ')}`, 'yellow');
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`⚠️  Port cleanup completed (some ports might not have been in use)`, 'yellow');
      } else {
        log(`✅ Ports cleaned successfully`, 'green');
      }
      resolve();
    });
  });
}

// Function to wait for a delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  log('🚀 Clean Start - ISP Management System', 'cyan');
  console.log();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const useOTP = args.includes('--otp');
  const useNewQR = args.includes('--new-qr');
  const useOldQR = args.includes('--old-qr');
  
  // Determine connection option
  let connectionOption = 'old';
  if (useOTP) {
    connectionOption = 'otp';
    log('📱 Using OTP Pairing mode', 'green');
  } else if (useNewQR) {
    connectionOption = 'new';
    log('🔄 Using new QR scan mode', 'green');
  } else if (useOldQR) {
    connectionOption = 'old';
    log('📱 Using existing session mode', 'green');
  } else {
    log('📱 Using existing session mode (default)', 'green');
  }
  
  // Step 1: Clean ports
  log('1️⃣ Cleaning ports 3000 and 3001...', 'blue');
  await killPortProcesses([3000, 3001]);
  await delay(2000);
  
  // Step 2: Check if we're in the right directory
  log('2️⃣ Checking project structure...', 'blue');
  if (!fs.existsSync('client') || !fs.existsSync('server')) {
    log('❌ Please run this script from the project root directory', 'red');
    process.exit(1);
  }
  log('✅ Project structure verified', 'green');
  
  // Step 3: Setup WhatsApp session if needed
  if (connectionOption === 'new') {
    log('3️⃣ Cleaning old WhatsApp session...', 'blue');
    const authDir = path.join('server', 'auth_info_baileys');
    if (fs.existsSync(authDir)) {
      try {
        const files = fs.readdirSync(authDir);
        files.forEach(file => {
          const filePath = path.join(authDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            log(`   Deleted: ${file}`, 'yellow');
          }
        });
        log('✅ Old session cleaned', 'green');
      } catch (error) {
        log(`⚠️  Error cleaning session: ${error.message}`, 'yellow');
      }
    }
  } else if (connectionOption === 'otp') {
    log('3️⃣ OTP Pairing mode - session will be managed by OTP service', 'blue');
  } else {
    log('3️⃣ Using existing WhatsApp session', 'blue');
  }
  
  // Step 4: Start the application
  log('4️⃣ Starting application...', 'blue');
  console.log();
  
  // Build the start command
  let startCommand = 'node start-all.js';
  if (connectionOption === 'otp') {
    startCommand += ' --otp';
  } else if (connectionOption === 'new') {
    startCommand += ' --new-qr';
  } else {
    startCommand += ' --old-qr';
  }
  
  log(`🚀 Executing: ${startCommand}`, 'cyan');
  console.log();
  
  // Start the application
  const child = spawn('node', ['start-all.js', ...(connectionOption === 'otp' ? ['--otp'] : connectionOption === 'new' ? ['--new-qr'] : ['--old-qr'])], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle process events
  child.on('close', (code) => {
    log(`📱 Application exited with code ${code}`, code === 0 ? 'green' : 'red');
  });
  
  child.on('error', (error) => {
    log(`❌ Error starting application: ${error.message}`, 'red');
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    log('\n🛑 Shutting down...', 'yellow');
    child.kill('SIGTERM');
    process.exit(0);
  });
}

// Show help
function showHelp() {
  console.log();
  log('📖 Clean Start Script Usage:', 'cyan');
  log('  node scripts/clean-start.js [options]', 'white');
  console.log();
  log('🔧 Options:', 'cyan');
  log('  --otp        Use OTP pairing mode', 'white');
  log('  --new-qr     Use new QR scan mode', 'white');
  log('  --old-qr     Use existing session mode (default)', 'white');
  log('  --help       Show this help message', 'white');
  console.log();
  log('💡 Examples:', 'cyan');
  log('  node scripts/clean-start.js --otp', 'white');
  log('  node scripts/clean-start.js --new-qr', 'white');
  log('  node scripts/clean-start.js', 'white');
  console.log();
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Run main function
main().catch((error) => {
  log(`❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

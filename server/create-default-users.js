#!/usr/bin/env node

/**
 * Script untuk membuat user default
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createDefaultUsers() {
  // Initialize Prisma client
  const prisma = new PrismaClient();

  try {
    log('🔧 Creating default users...', 'blue');
    
    // Default users data
    const defaultUsers = [
      {
        username: 'superadmin',
        password: 'super123',
        name: 'Super Administrator',
        role: 'superadmin',
        email: 'superadmin@unnet.com'
      },
      {
        username: 'admin',
        password: 'admin123',
        name: 'Administrator',
        role: 'admin',
        email: 'admin@unnet.com'
      },
      {
        username: 'gudang',
        password: 'gudang123',
        name: 'Staff Gudang',
        role: 'gudang',
        email: 'gudang@unnet.com'
      },
      {
        username: 'teknisi',
        password: 'teknisi123',
        name: 'Teknisi',
        role: 'teknisi',
        email: 'teknisi@unnet.com'
      }
    ];

    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      });

      if (existingUser) {
        log(`⚠️  User ${userData.username} already exists, skipping...`, 'yellow');
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          email: userData.email,
          isActive: true,
          isVerified: true
        }
      });

      log(`✅ Created user: ${userData.username} (${userData.role})`, 'green');
    }

    log('\n🎉 Default users created successfully!', 'green');
    log('\n📋 Login credentials:', 'cyan');
    log('┌─────────────┬─────────────┬─────────────────┐', 'cyan');
    log('│ Username    │ Password    │ Role            │', 'cyan');
    log('├─────────────┼─────────────┼─────────────────┤', 'cyan');
    log('│ superadmin  │ super123    │ Super Admin     │', 'cyan');
    log('│ admin       │ admin123    │ Admin           │', 'cyan');
    log('│ gudang      │ gudang123   │ Warehouse       │', 'cyan');
    log('│ teknisi     │ teknisi123  │ Technician      │', 'cyan');
    log('└─────────────┴─────────────┴─────────────────┘', 'cyan');

  } catch (error) {
    log(`❌ Error creating users: ${error.message}`, 'red');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createDefaultUsers()
  .then(() => {
    log('\n✅ Script completed successfully!', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Script failed: ${error.message}`, 'red');
    process.exit(1);
  });

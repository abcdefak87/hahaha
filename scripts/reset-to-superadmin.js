const { PrismaClient } = require('../server/node_modules/@prisma/client');
const bcrypt = require('../server/node_modules/bcryptjs');

const prisma = new PrismaClient();

// Data untuk superadmin
const superadminData = {
  name: 'Super Administrator',
  username: 'superadmin',
  email: 'superadmin@isp.com',
  password: 'super123',
  role: 'superadmin',
  phone: '081234567890',
  whatsappNumber: '6281234567890',
  isActive: true,
  isVerified: true,
  permissions: JSON.stringify({
    users: ['create', 'read', 'update', 'delete'],
    customers: ['create', 'read', 'update', 'delete'],
    technicians: ['create', 'read', 'update', 'delete'],
    jobs: ['create', 'read', 'update', 'delete', 'approve', 'reject'],
    inventory: ['create', 'read', 'update', 'delete'],
    reports: ['read', 'export'],
    settings: ['read', 'update'],
    whatsapp: ['send', 'broadcast'],
    system: ['manage', 'backup', 'restore']
  })
};

async function resetToSuperadmin() {
  try {
    console.log('🔄 Starting user reset process...\n');
    
    // Step 1: Hapus semua user yang ada
    console.log('🗑️  Deleting all existing users...');
    const deleteResult = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} user(s)\n`);
    
    // Step 2: Buat user superadmin baru
    console.log('👤 Creating new superadmin user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(superadminData.password, 10);
    
    // Create superadmin
    const newSuperadmin = await prisma.user.create({
      data: {
        ...superadminData,
        password: hashedPassword
      }
    });
    
    console.log('✅ Superadmin created successfully!\n');
    console.log('=====================================');
    console.log('📋 SUPERADMIN ACCOUNT DETAILS:');
    console.log('=====================================');
    console.log(`Name:     ${newSuperadmin.name}`);
    console.log(`Username: ${newSuperadmin.username}`);
    console.log(`Email:    ${newSuperadmin.email}`);
    console.log(`Password: ${superadminData.password}`);
    console.log(`Role:     ${newSuperadmin.role}`);
    console.log(`Phone:    ${newSuperadmin.phone}`);
    console.log('=====================================\n');
    
    console.log('⚠️  IMPORTANT NOTES:');
    console.log('1. Save these credentials in a secure place');
    console.log('2. Change the password after first login');
    console.log('3. This is the only account with full system access');
    console.log('4. Use this account to create other users as needed\n');
    
    console.log('✨ User reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error details:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will DELETE ALL EXISTING USERS!');
console.log('Only 1 superadmin account will remain.\n');

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    resetToSuperadmin();
  } else {
    console.log('\n❌ Operation cancelled by user.');
    rl.close();
    process.exit(0);
  }
});

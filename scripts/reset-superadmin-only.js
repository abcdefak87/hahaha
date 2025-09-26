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

async function resetToSuperadminOnly() {
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
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   SUPERADMIN ACCOUNT CREDENTIALS      ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║ Username: ${newSuperadmin.username.padEnd(28)}║`);
    console.log(`║ Email:    ${newSuperadmin.email.padEnd(28)}║`);
    console.log(`║ Password: ${superadminData.password.padEnd(28)}║`);
    console.log('╚═══════════════════════════════════════╝\n');
    
    console.log('📌 IMPORTANT:');
    console.log('• This is now the ONLY user in the system');
    console.log('• Save these credentials securely');
    console.log('• Change password after first login');
    console.log('• Use this account to create other users\n');
    
    // Verify final count
    const finalCount = await prisma.user.count();
    console.log(`✅ Database now has exactly ${finalCount} user (superadmin only)\n`);
    
    console.log('✨ Reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error details:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run immediately without confirmation
resetToSuperadminOnly();

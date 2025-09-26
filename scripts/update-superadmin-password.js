const { PrismaClient } = require('../server/node_modules/@prisma/client');
const bcrypt = require('../server/node_modules/bcryptjs');

const prisma = new PrismaClient();

async function updateSuperadminPassword() {
  try {
    console.log('🔄 Updating superadmin password...\n');
    
    const newPassword = 'super123';
    
    // Find superadmin user
    const superadmin = await prisma.user.findFirst({
      where: {
        role: 'superadmin'
      }
    });
    
    if (!superadmin) {
      console.log('❌ No superadmin user found in database!');
      console.log('Please run reset-superadmin-only.js first to create a superadmin.');
      process.exit(1);
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const updatedUser = await prisma.user.update({
      where: {
        id: superadmin.id
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Password updated successfully!\n');
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   UPDATED SUPERADMIN CREDENTIALS      ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║ Username: ${updatedUser.username.padEnd(28)}║`);
    console.log(`║ Email:    ${updatedUser.email.padEnd(28)}║`);
    console.log(`║ Password: ${newPassword.padEnd(28)}║`);
    console.log('╚═══════════════════════════════════════╝\n');
    
    console.log('✨ You can now login with:');
    console.log(`   Username/Email: ${updatedUser.username} or ${updatedUser.email}`);
    console.log(`   Password: ${newPassword}\n`);
    
    console.log('✅ Password update completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateSuperadminPassword();

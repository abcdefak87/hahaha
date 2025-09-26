const { PrismaClient } = require('../server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function checkUsersOnly() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    const userCount = users.length;
    
    if (userCount === 0) {
      console.log('⚠️  No users found in database!\n');
    } else if (userCount === 1) {
      console.log(`✅ Database has exactly ${userCount} user:\n`);
    } else {
      console.log(`📊 Database has ${userCount} users:\n`);
    }
    
    if (users.length > 0) {
      console.table(users.map((user, index) => ({
        No: index + 1,
        Name: user.name,
        Username: user.username,
        Email: user.email,
        Role: user.role,
        Phone: user.phone,
        Active: user.isActive ? '✅' : '❌',
        Verified: user.isVerified ? '✅' : '❌',
        Created: user.createdAt.toLocaleDateString('id-ID')
      })));
    }
    
    // Summary
    console.log('\n📈 User Role Summary:');
    const roleCounts = {};
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   • ${role}: ${count} user(s)`);
    });
    
    console.log('\n✨ Check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkUsersOnly();

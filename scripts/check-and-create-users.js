const { PrismaClient } = require('../server/node_modules/@prisma/client');
const bcrypt = require('../server/node_modules/bcryptjs');

const prisma = new PrismaClient();

// User data to create
const defaultUsers = [
  {
    name: 'Super Admin',
    username: 'superadmin',
    email: 'superadmin@isp.com',
    password: 'Admin@123456',
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
      whatsapp: ['send', 'broadcast']
    })
  },
  {
    name: 'Admin User',
    username: 'admin',
    email: 'admin@isp.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '081234567891',
    whatsappNumber: '6281234567891',
    isActive: true,
    isVerified: true,
    permissions: JSON.stringify({
      users: ['read', 'update'],
      customers: ['create', 'read', 'update'],
      technicians: ['create', 'read', 'update'],
      jobs: ['create', 'read', 'update', 'approve'],
      inventory: ['create', 'read', 'update'],
      reports: ['read'],
      whatsapp: ['send']
    })
  },
  {
    name: 'Operator User',
    username: 'operator',
    email: 'operator@isp.com',
    password: 'Operator@123',
    role: 'operator',
    phone: '081234567892',
    whatsappNumber: '6281234567892',
    isActive: true,
    isVerified: true,
    permissions: JSON.stringify({
      customers: ['read', 'update'],
      jobs: ['create', 'read', 'update'],
      inventory: ['read'],
      reports: ['read']
    })
  },
  {
    name: 'Viewer User',
    username: 'viewer',
    email: 'viewer@isp.com',
    password: 'Viewer@123',
    role: 'viewer',
    phone: '081234567893',
    whatsappNumber: '6281234567893',
    isActive: true,
    isVerified: true,
    permissions: JSON.stringify({
      customers: ['read'],
      jobs: ['read'],
      inventory: ['read'],
      reports: ['read']
    })
  }
];

async function checkAndCreateUsers() {
  try {
    console.log('🔍 Checking existing users in database...\n');
    
    // Check existing users
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (existingUsers.length > 0) {
      console.log(`✅ Found ${existingUsers.length} existing user(s):\n`);
      console.table(existingUsers.map(user => ({
        Name: user.name,
        Username: user.username,
        Email: user.email,
        Role: user.role,
        Active: user.isActive ? 'Yes' : 'No',
        Created: user.createdAt.toLocaleDateString()
      })));
    } else {
      console.log('⚠️  No users found in database.\n');
    }

    // Create missing users
    console.log('\n📝 Checking for missing default users...\n');
    
    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email },
            { phone: userData.phone }
          ]
        }
      });

      if (existingUser) {
        console.log(`⏭️  User '${userData.username}' already exists. Skipping...`);
      } else {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create user
        const newUser = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword
          }
        });

        console.log(`✅ Created user: ${newUser.username} (${newUser.role})`);
        console.log(`   📧 Email: ${newUser.email}`);
        console.log(`   🔑 Password: ${userData.password}`);
        console.log('');
      }
    }

    // Display final user list
    console.log('\n📊 Final user list:\n');
    const finalUsers = await prisma.user.findMany({
      select: {
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    console.table(finalUsers.map(user => ({
      Name: user.name,
      Username: user.username,
      Email: user.email,
      Role: user.role,
      Active: user.isActive ? 'Yes' : 'No'
    })));

    console.log('\n✨ User check and creation completed successfully!\n');
    console.log('📝 Login credentials for new users:');
    console.log('=====================================');
    console.log('Super Admin: superadmin / Admin@123456');
    console.log('Admin:       admin / Admin@123');
    console.log('Operator:    operator / Operator@123');
    console.log('Viewer:      viewer / Viewer@123');
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAndCreateUsers();

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Setting up demo user...');

  // Create or update demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'admin@channelflow.com' },
    update: {
      password: await hash('demo123456', 12),
      name: 'Admin',
    },
    create: {
      email: 'admin@channelflow.com',
      password: await hash('demo123456', 12),
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log('✅ Demo user created/updated:');
  console.log(`   Email: ${demoUser.email}`);
  console.log('   Password: demo123456');
}

main()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

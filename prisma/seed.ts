import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@nestliving.com'; // 👈 Change to your preferred admin email
  const rawPassword = 'Adminnestliving@1122';   // 👈 Change to your preferred admin password

  // Hash password
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // Upsert user (creates if doesn't exist, updates role to ADMIN if already exists)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN', // Make sure this matches the enum in your schema.prisma
    },
  });

  console.log(`✅ Admin account created/updated: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
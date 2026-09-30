import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !rawPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding the admin account.');
  }
  if (rawPassword.length < 16) {
    throw new Error('ADMIN_PASSWORD must be at least 16 characters long.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingUser) {
    if (existingUser.role !== 'ADMIN') {
      throw new Error('ADMIN_EMAIL belongs to a non-admin account; refusing to change its role.');
    }
    console.log(`Admin account already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Admin account created: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
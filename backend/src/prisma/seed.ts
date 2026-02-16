import 'dotenv/config';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from './client';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sidesa.id' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@sidesa.id',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log('Seeded admin user:', admin.email);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

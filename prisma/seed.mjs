import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/users.mjs';

const prisma = new PrismaClient();

async function main() {
  // Initial seeds
  console.log('----- Starting to seed initial data -----');
  await seedUsers(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

const USERS = [
  {
    email: 'c4gdevad@gmail.com',
    name: 'C4G Admin',
    role: 'ADMIN',
  },
  {
    email: 'c4gdevstaff@gmail.com',
    name: 'C4G Staff',
    role: 'STAFF',
  },
];

export const seedUsers = async (prisma) => {
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
      },
      create: {
        email: user.email,
        emailVerified: new Date(),
        name: user.name,
        role: user.role,
      },
    });
    console.log(`${user.email} has been seeded`);
  }
};

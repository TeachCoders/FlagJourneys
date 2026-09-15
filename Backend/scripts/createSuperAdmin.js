// Backend/createSuperAdmin.js
import { prisma } from "../utils/prismaConnection.js";
import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "superadmin@flagjourneys.com";
  const existing = await prisma.users.findFirst({ where: { email } });
  if (existing) {
    console.log("Superadmin already exists with email:", email);
    return;
  }

  const password = await ask("Enter superadmin password: ");
  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  await prisma.users.create({
    data: {
      name: "Super Admin",
      email,
      role: "super_admin",
      hasPassword: passwordHash,
      isActive: true,
    },
  });
  console.log("Superadmin user created with email:", email);
}

main()
  .catch((e) => {
    console.error("Error creating superadmin:", e);
    process.exit(1);
  })
  .finally(() => { rl.close(); prisma.$disconnect(); });

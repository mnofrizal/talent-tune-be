import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create initial users
  const users = [
    {
      email: "admin@example.com",
      phone: "081234567890",
      password: "admin123",
      name: "Admin User",
      nip: "123456789",
      systemRole: "ADMINISTRATOR",
      jabatan: "System Administrator",
      bidang: "IT",
    },
    {
      email: "user@example.com",
      phone: "081234567891",
      password: "user123",
      name: "Regular User",
      nip: "987654321",
      systemRole: "USER",
      jabatan: "Staff",
      bidang: "HR",
    },
    {
      email: "andi.budimansyah@msdm.app",
      phone: "081234567891",
      password: "user123",
      name: "ANDI BUDIMANSYAH",
      nip: "881721674I",
      systemRole: "USER",
      jabatan: "Assistant Manager K3",
      bidang: "K3, Lingkungan dan Sipil",
    },
    {
      email: "angga.estibrata@msdm.app",
      phone: "081234567892",
      password: "user123",
      name: "ANGGA ESTIBRATA",
      nip: "921722596I",
      systemRole: "USER",
      jabatan: "Technician Operasi Lokal Unit 1 (C)",
      bidang: "Operasi Unit 1-4",
    },
    {
      email: "farrid.mahendra@msdm.app",
      phone: "081234567893",
      password: "user123",
      name: "FARRID TRI MAHENDRA",
      nip: "941722597I",
      systemRole: "USER",
      jabatan: "Technician Operasi Control Room Unit 7 (C)",
      bidang: "Operasi Unit 5-7",
    },
    {
      email: "putra.yanuar@msdm.app",
      phone: "081234567894",
      password: "user123",
      name: "PUTRA YANUAR",
      nip: "931721678I",
      systemRole: "USER",
      jabatan: "Technician Operasi Lokal Ground Floor Unit 5 (C)",
      bidang: "Operasi Unit 5-7",
    },
    {
      email: "rois.mochamad@msdm.app",
      phone: "081234567895",
      password: "user123",
      name: "ROIS MOCHAMAD",
      nip: "961831207I",
      systemRole: "USER",
      jabatan:
        "Junior Officer Pengadaan Fasilitas, Sarana Operasi dan Investasi",
      bidang: "Pengadaan Barang dan Jasa II",
    },
  ];

  // Create users
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password: hashedPassword,
      },
    });
  }

  // Create assessment roles
  const assessmentRoles = [
    {
      name: "PARTICIPANT",
      description: "Assessment participant role",
    },
    {
      name: "EVALUATOR",
      description: "Assessment evaluator role",
    },
  ];

  for (const role of assessmentRoles) {
    await prisma.assessmentRole.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

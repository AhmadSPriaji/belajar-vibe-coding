import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function registerUser({ name, email, password }: any) {
  // 1. Cek apakah email user sudah terdaftar
  const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUsers.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  // 2. Hash password menggunakan Bun.password
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Masukkan data ke database
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return "OK";
}

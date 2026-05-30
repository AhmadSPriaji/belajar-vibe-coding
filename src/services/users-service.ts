import { db } from "../db";
import { users, sessions } from "../db/schema";
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

export async function loginUser({ email, password }: any) {
  // 1. Cari user di database berdasarkan email
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    throw new Error("Email atau password salah");
  }

  // 2. Verifikasi password menggunakan Bun.password.verify
  const isPasswordValid = await Bun.password.verify(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Email atau password salah");
  }

  // 3. Generate token UUID
  const token = crypto.randomUUID();

  // 4. Simpan ke tabel sessions
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
}

export async function getCurrentUser(token: string) {
  // 1. Cari session berdasarkan token
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);

  if (!session) {
    throw new Error("Unauthorized");
  }

  // 2. Cari user berdasarkan userId
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 3. Return user data (tanpa password)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createdAt,
  };
}

export async function logoutUser(token: string) {
  // 1. Cari session berdasarkan token
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);

  if (!session) {
    throw new Error("Unauthorized");
  }

  // 2. Hapus session berdasarkan token
  await db.delete(sessions).where(eq(sessions.token, token));

  return "OK";
}


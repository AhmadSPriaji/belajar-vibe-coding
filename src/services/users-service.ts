import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Fungsi untuk mendaftarkan pengguna baru ke dalam sistem.
 * Melakukan pengecekan email duplikat, melakukan hashing pada password,
 * lalu menyimpan data pengguna ke dalam database.
 * 
 * @param payload Object yang berisi name, email, dan password dari pengguna
 * @returns String "OK" jika berhasil
 * @throws Error jika email sudah terdaftar sebelumnya
 */
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

/**
 * Fungsi untuk memproses login pengguna.
 * Memverifikasi ketersediaan email dan kecocokan password.
 * Jika valid, akan menghasilkan sebuah token UUID (sesi login)
 * yang kemudian disimpan di database dan dikembalikan ke klien.
 * 
 * @param payload Object yang berisi email dan password login
 * @returns String token UUID untuk autentikasi sesi
 * @throws Error jika email tidak ditemukan atau password tidak cocok
 */
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

/**
 * Fungsi untuk mengambil data profil pengguna yang sedang login saat ini.
 * Memvalidasi token sesi yang diberikan, mencari data user terkait,
 * lalu mengembalikan informasi dasar user tersebut (tanpa menyertakan password).
 * 
 * @param token String token autentikasi sesi
 * @returns Object data profil pengguna (id, name, email, created_at)
 * @throws Error "Unauthorized" jika token tidak valid atau user tidak ditemukan
 */
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

/**
 * Fungsi untuk melakukan proses logout pengguna.
 * Menghapus data sesi berdasarkan token yang dikirim,
 * sehingga token tersebut tidak bisa lagi digunakan untuk autentikasi.
 * 
 * @param token String token autentikasi sesi yang ingin dihapus
 * @returns String "OK" jika berhasil
 * @throws Error "Unauthorized" jika token tidak ditemukan di database
 */
export async function logoutUser(token: string) {
  // Langsung hapus session berdasarkan token
  const [result] = await db.delete(sessions).where(eq(sessions.token, token));

  if (result.affectedRows === 0) {
    throw new Error("Unauthorized");
  }

  return "OK";
}


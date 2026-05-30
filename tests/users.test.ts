import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "../src/routes/users-route";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

const app = new Elysia().group("/api", (app) => app.use(usersRoute));

describe("API Users Unit Tests", () => {
  beforeEach(async () => {
    // Bersihkan data session dan user terlebih dahulu untuk konsistensi data
    await db.delete(sessions);
    await db.delete(users);
  });

  afterAll(async () => {
    // Tutup koneksi ke database pool agar bun test tidak menggantung
    if (db.$client && typeof db.$client.end === "function") {
      await db.$client.end();
    }
  });

  describe("1. Registrasi User (POST /api/users)", () => {
    it("harus berhasil melakukan registrasi dengan data valid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Budi Utomo",
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ data: "OK" });
    });

    it("harus gagal jika email sudah terdaftar sebelumnya", async () => {
      // Registrasi pertama
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Budi Utomo",
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );

      // Registrasi kedua dengan email yang sama
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Budi Clone",
            email: "budi@example.com",
            password: "AnotherPassword123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "Email sudah terdaftar" });
    });

    it("harus gagal jika panjang name melebihi 255 karakter", async () => {
      const longName = "a".repeat(256);
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("harus gagal jika panjang password melebihi 100 karakter", async () => {
      const longPassword = "p".repeat(101);
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Budi Utomo",
            email: "budi@example.com",
            password: longPassword,
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("harus gagal jika format email salah", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Budi Utomo",
            email: "budi-bukan-email",
            password: "SecurePassword123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("2. Login User (POST /api/users/login)", () => {
    beforeEach(async () => {
      // Registrasikan satu user untuk pengujian login
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Budi Utomo",
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );
    });

    it("harus berhasil login dengan kredensial benar dan mengembalikan token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json.data).toBeDefined();
      expect(typeof json.data).toBe("string");
    });

    it("harus gagal login jika password salah", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "budi@example.com",
            password: "SalahPassword123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "Email atau password salah" });
    });

    it("harus gagal login jika email tidak terdaftar", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "tidak-ada@example.com",
            password: "SecurePassword123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "Email atau password salah" });
    });

    it("harus gagal login jika format input invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "salahformat",
            password: "",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("3. Get Current User (GET /api/users/current)", () => {
    let validToken: string;

    beforeEach(async () => {
      // Registrasi user
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Budi Utomo",
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );

      // Login untuk dapatkan token
      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );
      const loginJson: any = await loginResponse.json();
      validToken = loginJson.data;
    });

    it("harus berhasil mengambil data user dengan token yang valid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.name).toBe("Budi Utomo");
      expect(json.data.email).toBe("budi@example.com");
      expect(json.data.password).toBeUndefined(); // password tidak boleh dibocorkan
    });

    it("harus gagal mengambil data user jika token tidak valid/palsu", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer 1234-palsu-token-5678",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("harus gagal mengambil data user jika tanpa header Authorization", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("harus gagal mengambil data user jika format token salah (tanpa kata Bearer)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: validToken,
          },
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("4. Logout User (DELETE /api/users/logout)", () => {
    let validToken: string;

    beforeEach(async () => {
      // Registrasi
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Budi Utomo",
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );

      // Login
      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "budi@example.com",
            password: "SecurePassword123",
          }),
        })
      );
      const loginJson: any = await loginResponse.json();
      validToken = loginJson.data;
    });

    it("harus berhasil logout dengan token valid dan menghapus session", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ data: "OK" });

      // Verifikasi token di DB sudah dihapus
      const [session] = await db.select().from(sessions).where(eq(sessions.token, validToken)).limit(1);
      expect(session).toBeUndefined();
    });

    it("harus gagal logout jika token tidak valid / tidak ada di database", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer token-palsu-dan-tidak-ada",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("harus gagal mengakses Get Current User dan melakukan Logout kembali pasca-logout sukses", async () => {
      // 1. Logout sukses
      const logoutResponse = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );
      expect(logoutResponse.status).toBe(200);

      // 2. Coba get current user menggunakan token yang sama (harus ditolak)
      const currentResponse = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );
      expect(currentResponse.status).toBe(401);

      // 3. Coba logout kembali menggunakan token yang sama (harus ditolak)
      const secondLogoutResponse = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );
      expect(secondLogoutResponse.status).toBe(401);
    });
  });
});

import { eq } from "drizzle-orm";

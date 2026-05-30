import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/users" })
  .derive(({ headers }) => ({
    getBearerToken: () => {
      const authorization = headers.authorization;
      if (!authorization || !authorization.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }
      const token = authorization.substring(7);
      if (token.length > 255) {
        throw new Error("Unauthorized");
      }
      return token;
    }
  }))
  .get("/current", async ({ getBearerToken, set }) => {
    try {
      const token = getBearerToken();
      const user = await getCurrentUser(token);
      return { data: user };
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      set.status = 500;
      return { error: "Terjadi kesalahan pada server" };
    }
  }, {
    detail: {
      summary: "Dapatkan Profil User Saat Ini",
      description: "Mengambil data profil user yang sedang login berdasarkan token Bearer."
    },
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String({ format: "email" }),
          created_at: t.Any()
        })
      }),
      401: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    }
  })
  .post("/", async ({ body, set }) => {
    try {
      const result = await registerUser(body);
      return { data: result };
    } catch (error: any) {
      if (error.message === "Email sudah terdaftar") {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Terjadi kesalahan pada server" };
    }
  }, {
    detail: {
      summary: "Registrasi User Baru",
      description: "Endpoint untuk mendaftarkan akun baru dengan mengirimkan nama, email, dan password."
    },
    body: t.Object({
      name: t.String({ maxLength: 255 }),
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ maxLength: 100 }),
    }),
    response: {
      200: t.Object({
        data: t.String({ default: "OK" })
      }),
      400: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    }
  })
  .post("/login", async ({ body, set }) => {
    try {
      const token = await loginUser(body);
      return { data: token };
    } catch (error: any) {
      if (error.message === "Email atau password salah") {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Terjadi kesalahan pada server" };
    }
  }, {
    detail: {
      summary: "Login User",
      description: "Endpoint untuk melakukan autentikasi user dan mendapatkan session token."
    },
    body: t.Object({
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ maxLength: 100 }),
    }),
    response: {
      200: t.Object({
        data: t.String({ format: "uuid" })
      }),
      400: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    }
  })
  .delete("/logout", async ({ getBearerToken, set }) => {
    try {
      const token = getBearerToken();
      await logoutUser(token);
      return { data: "OK" };
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      set.status = 500;
      return { error: "Terjadi kesalahan pada server" };
    }
  }, {
    detail: {
      summary: "Logout User",
      description: "Mengakhiri session user dan menghapus token dari database."
    },
    response: {
      200: t.Object({
        data: t.String({ default: "OK" })
      }),
      401: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    }
  });

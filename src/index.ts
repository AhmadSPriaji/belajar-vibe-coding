import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";

const app = new Elysia()
  .get("/", () => ({ message: "Hello from Elysia, Drizzle, and MySQL!" }))
  .get("/health", () => ({ status: "ok" }))
  .get("/users", async () => {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return { error: "Failed to fetch users" };
    }
  })
  .post("/users", async ({ body, set }) => {
    try {
      await db.insert(users).values({
        name: body.name,
        email: body.email,
      });
      set.status = 201;
      return { success: true, message: "User created successfully" };
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === "ER_DUP_ENTRY") {
        set.status = 400;
        return { error: "Email already exists" };
      }
      set.status = 500;
      return { error: "Failed to create user" };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
    })
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

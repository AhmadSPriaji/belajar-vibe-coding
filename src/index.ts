import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Belajar Vibe Coding API Documentation",
          version: "1.0.0",
          description: "Dokumentasi interaktif untuk Backend API Belajar Vibe Coding.",
        },
      },
    })
  )
  .get("/", () => ({ message: "Hello from Elysia, Drizzle, and MySQL!" }))
  .get("/health", () => ({ status: "ok" }))
  .group("/api", (app) => app.use(usersRoute))
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .get("/", () => ({ message: "Hello from Elysia, Drizzle, and MySQL!" }))
  .get("/health", () => ({ status: "ok" }))
  .group("/api", (app) => app.use(usersRoute))
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

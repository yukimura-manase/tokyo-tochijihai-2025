import { Hono } from "hono";

export const userRouter = new Hono();

userRouter.get("/", async (context) => {
  return context.text("Hello User!");
});

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as dotenv from "dotenv";
import { userRouter } from "./apis/user.js";

/** 環境変数を読み込む */
dotenv.config({ path: `.env` });

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: [process.env.FRONT_APP_URL!],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// 環境変数のテスト
// console.log("環境", process.env.NODE_ENV);
// console.log(process.env.DATABASE_URL);
// console.log(process.env.FRONT_APP_URL);

app.route("/api/users", userRouter);

serve(
  {
    fetch: app.fetch,
    port: 3777,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
